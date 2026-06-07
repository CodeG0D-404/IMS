import mongoose from "mongoose";

import Purchase from "../models/Purchase.js";
import PurchaseItem from "../models/PurchaseItem.js";
import StockLot from "../models/StockLot.js";
import { logStockTransaction } from "../utils/stockLogger.js";
import { createLedgerEntry } from "../utils/ledgerHelper.js";

/* =========================================
   CREATE PURCHASE
========================================= */
export const createPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const storeId = req.storeId;

    const {
      supplier,
      items,
      totalAmount,
      paidAmount = 0,
      paymentMode,
      purchaseDate,
    } = req.body;

    const party = supplier;

    /* =========================
       VALIDATION
    ========================= */
    if (!party || !items || items.length === 0) {
      throw new Error("Supplier and items are required");
    }

    for (const item of items) {
      if (!item.product || !item.quantity || !item.costPrice) {
        throw new Error("Invalid item data");
      }
    }
    if (paidAmount < 0) {
      throw new Error("Paid amount cannot be negative");
    }
        if (totalAmount <= 0) {
      throw new Error("Total amount must be greater than 0");
    }

    /* =========================
       CALCULATIONS
    ========================= */
      const dueAmount = Number(
        (totalAmount - paidAmount).toFixed(2)
      );


    /* =========================
       CREATE PURCHASE
    ========================= */
    const [purchase] = await Purchase.create(
      [
        {
          store: storeId,
          party,
          totalAmount,
          paidAmount,
          dueAmount,
          purchaseDate: purchaseDate || new Date(),
          createdBy: req.user._id,
        },
      ],
      { session }
    );

    /* =========================
       CREATE ITEMS + LOTS
    ========================= */
    for (const item of items) {
      const { product, quantity, costPrice } = item;

      const [stockLot] = await StockLot.create(
        [
          {
            product,
            store: storeId,
            purchase: purchase._id,
            purchaseDate: purchase.purchaseDate,
            quantity,
            remainingQty: quantity,
            purchasePrice: costPrice,
            createdBy: req.user._id,
          },
        ],
        { session }
      );

      await PurchaseItem.create(
        [
          {
            purchase: purchase._id,
            product,
            quantity,
            costPrice,
            total: Number(
              (quantity * costPrice).toFixed(2)
            ),
            store: storeId,
            stockLot: stockLot._id,
          },
        ],
        { session }
      );

      await logStockTransaction({
        store: storeId,
        performedBy: req.user._id,
        product,
        type: "PURCHASE",
        quantity,
        stockLot: stockLot._id,
        referenceId: purchase._id,
        referenceModel: "Purchase",
        session,
      });
    }

    /* =========================
       LEDGER ENTRY (FIXED)
    ========================= */

    // Running balance logic:
    // previousBalance + (total - paid)

    const purchaseImpact =
      Number(totalAmount) - Number(paidAmount);

    await createLedgerEntry({
      party,
      store: storeId,

      entryType: "PURCHASE",
      type: "DEBIT",

      amount: totalAmount,

      paymentMode: (paymentMode || "cash").toLowerCase(),

      referenceId: purchase._id,
      referenceModel: "Purchase",

      createdBy: req.user._id,

      impact: purchaseImpact,

      note: "Purchase created",

      session,
    });

    /* =========================
       COMMIT
    ========================= */
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      data: purchase,
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
   GET ALL PURCHASES
========================================= */
export const getPurchases = async (req, res) => {
  try {
    const storeId = req.storeId;

    const purchases = await Purchase.find({ store: storeId })
      .populate(
          "party",
          "name phone email"
        )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: purchases.length,
      data: purchases,
    });

  } catch (error) {
    console.error("Get Purchases Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET PURCHASE BY ID
========================================= */
export const getPurchaseById = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const purchase = await Purchase.findOne({
      _id: id,
      store: storeId,
    }).populate(
        "party",
        "name phone email"
      )

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    const items = await PurchaseItem.find({
      purchase: purchase._id,
    }).populate("product stockLot");

    return res.status(200).json({
      success: true,
      data: {
        purchase,
        items,
      },
    });

  } catch (error) {
    console.error("Get Purchase Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   DELETE PURCHASE
========================================= */
export const deletePurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const purchase = await Purchase.findOne({
      _id: id,
      store: storeId,
    }).session(session);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    const items = await PurchaseItem.find({
      purchase: purchase._id,
    }).session(session);

    for (const item of items) {
      const lot = await StockLot.findById(item.stockLot).session(session);

      if (!lot) continue;

      if (lot.remainingQty !== lot.quantity) {
        throw new Error(
          "Cannot delete purchase: stock already used in sales"
        );
      }
    }

    for (const item of items) {
      const lot = await StockLot.findById(item.stockLot).session(session);

      await logStockTransaction({
        store: storeId,
        performedBy: req.user._id,
        product: item.product,
        type: "PURCHASE_DELETE",
        quantity: -item.quantity,
        stockLot: lot._id,
        referenceId: purchase._id,
        referenceModel: "Purchase",
        session,
      });

      await lot.deleteOne({ session });
    }

    await PurchaseItem.deleteMany(
      { purchase: purchase._id },
      { session }
    );

    await purchase.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Purchase deleted successfully",
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Delete Purchase Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};