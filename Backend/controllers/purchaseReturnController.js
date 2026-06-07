import mongoose from "mongoose";

import Purchase from "../models/Purchase.js";
import PurchaseItem from "../models/PurchaseItem.js";
import PurchaseReturn from "../models/PurchaseReturn.js";
import PurchaseReturnItem from "../models/PurchaseReturnItem.js";
import StockLot from "../models/StockLot.js";
import { createLedgerEntry } from "../utils/ledgerHelper.js";
import { logStockTransaction } from "../utils/stockLogger.js";

/* =========================================
   CREATE PURCHASE RETURN
========================================= */
export const createPurchaseReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const storeId = req.storeId;

    const {
      purchaseId,
      items,
      paymentMode,
      adjustmentType = "ADJUST",
    } = req.body;

    if (!purchaseId || !items || items.length === 0) {
      throw new Error("Purchase and items are required");
    }

    const purchase = await Purchase.findOne({
      _id: purchaseId,
      store: storeId,
    }).session(session);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    let totalReturnAmount = 0;

    /* =========================
       CREATE RETURN
    ========================= */
    const [purchaseReturn] = await PurchaseReturn.create(
      [
        {
          store: storeId,
          purchase: purchase._id,
          party: purchase.party,
          totalAmount: 0,
          adjustmentType,
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    /* =========================
       PROCESS ITEMS
    ========================= */
    for (const item of items) {
      const { purchaseItemId, quantity } = item;

      const purchaseItem = await PurchaseItem.findById(purchaseItemId).session(session);

      if (!purchaseItem) {
        throw new Error("Purchase item not found");
      }

      if (purchaseItem.purchase.toString() !== purchase._id.toString()) {
        throw new Error("Item does not belong to purchase");
      }

      const stockLot = await StockLot.findById(purchaseItem.stockLot).session(session);

      if (!stockLot) {
        throw new Error("Stock lot not found");
      }

      /* =========================
         CHECK RETURN LIMIT
      ========================= */
      const prevReturns =
        await PurchaseReturnItem.aggregate([
        { $match: { purchaseItem: purchaseItem._id } },
        {
          $group: {
            _id: "$purchaseItem",
            totalReturned: { $sum: "$quantity" },
          },
        },
      ]).session(session);

      const alreadyReturned = prevReturns[0]?.totalReturned || 0;

      if (alreadyReturned + quantity > purchaseItem.quantity) {
        throw new Error("Return exceeds purchased quantity");
      }

      /* =========================
         STOCK SAFETY
      ========================= */
      if (adjustmentType !== "REPLACE") {
        if (stockLot.remainingQty < quantity) {
          throw new Error("Cannot return: items already sold from this lot");
        }
      }

      /* =========================
         STOCK HANDLING
      ========================= */
      if (adjustmentType === "REPLACE") {
        // (-1 +1)

        await logStockTransaction({
          store: storeId,
          performedBy: req.user._id,
          product: purchaseItem.product,
          type: "PURCHASE_RETURN",
          direction: "OUT", // ✅ ADD
          quantity: quantity, // ✅ FIX
          costPrice: purchaseItem.costPrice,
          stockLot: stockLot._id,
          referenceId: purchaseReturn._id,
          referenceModel: "PurchaseReturn",
          session,
        });

        await logStockTransaction({
          store: storeId,
          performedBy: req.user._id,
          product: purchaseItem.product,
          type: "PURCHASE_REPLACEMENT_IN",
          quantity: quantity,
          costPrice: purchaseItem.costPrice,
          stockLot: stockLot._id,
          referenceId: purchaseReturn._id,
          referenceModel: "PurchaseReturn",
          session,
        });

      } else {
        // NORMAL RETURN

        stockLot.remainingQty -= quantity;
        stockLot.quantity -= quantity;

        await stockLot.save({ session });

        await logStockTransaction({
          store: storeId,
          performedBy: req.user._id,
          product: purchaseItem.product,
          type: "PURCHASE_RETURN",
          direction: "OUT", // ✅ ADD
          quantity: quantity, // ✅ FIX
          costPrice: purchaseItem.costPrice,
          stockLot: stockLot._id,
          referenceId: purchaseReturn._id,
          referenceModel: "PurchaseReturn",
          session,
        });
      }

      /* =========================
         CALCULATE AMOUNT
      ========================= */
      let returnAmount = 0;

      if (adjustmentType !== "REPLACE") {
        returnAmount = Number(
          (
            quantity * purchaseItem.costPrice
          ).toFixed(2)
        );
        totalReturnAmount += returnAmount;
      }

      /* =========================
         CREATE RETURN ITEM
      ========================= */
      await PurchaseReturnItem.create(
        [
          {
            purchaseReturn: purchaseReturn._id,
            purchaseItem: purchaseItem._id,
            product: purchaseItem.product,
            stockLot: stockLot._id,
            store: storeId,

            quantity,

            costPrice: purchaseItem.costPrice,

            total: Number(
              returnAmount.toFixed(2)
            ),

            adjustmentType,
          },
        ],
        { session }
      );
    }


    /* =========================
   FINALIZE RETURN
========================= */
purchaseReturn.totalAmount = Number(
  totalReturnAmount.toFixed(2)
);

await purchaseReturn.save({ session });

/* =========================
   UPDATE PURCHASE SUMMARY
   (INFORMATIONAL ONLY)
========================= */

purchase.hasReturn = true;

purchase.returnCount =
  (purchase.returnCount || 0) + 1;

purchase.returnedAmount = Number(
  (
    (purchase.returnedAmount || 0) +
    totalReturnAmount
  ).toFixed(2)
);

purchase.returnedQuantity =
  (purchase.returnedQuantity || 0) +
  items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

await purchase.save({ session });

    /* =========================
       LEDGER ENTRY
    ========================= */
   /* =========================
   LEDGER ENTRY
========================= */

if (adjustmentType === "ADJUST") {
  await createLedgerEntry({
    party: purchase.party,
    store: storeId,

    entryType: "PURCHASE_RETURN",
    type: "CREDIT",

    amount: totalReturnAmount,

    referenceId: purchaseReturn._id,
    referenceModel: "PurchaseReturn",

    createdBy: req.user._id,

    impact: -totalReturnAmount,

    note: "Purchase return adjustment",

    session,
  });
}
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      data: purchaseReturn,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("🔥 FULL ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET ALL PURCHASE RETURNS
========================================= */
export const getPurchaseReturns = async (req, res) => {
  try {
    const storeId = req.storeId;

    const returns = await PurchaseReturn.find({
      store: storeId,
      isDeleted: false,
    })
      .populate("party", "name")
      .populate("purchase", "totalAmount")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: returns.length,
      data: returns,
    });

  } catch (error) {
    console.error("Get Purchase Returns Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET SINGLE PURCHASE RETURN
========================================= */
export const getPurchaseReturnById = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const purchaseReturn = await PurchaseReturn.findOne({
      _id: id,
      store: storeId,
      isDeleted: false,
    })
      .populate("party", "name")
      .populate("purchase");

    if (!purchaseReturn) {
      return res.status(404).json({
        success: false,
        message: "Purchase return not found",
      });
    }

    const items = await PurchaseReturnItem.find({
      purchaseReturn: purchaseReturn._id,
    }).populate("product stockLot");

    return res.status(200).json({
      success: true,
      data: {
        purchaseReturn,
        items,
      },
    });

  } catch (error) {
    console.error("Get Purchase Return Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};