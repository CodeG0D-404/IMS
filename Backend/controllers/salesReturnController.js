import mongoose from "mongoose";

import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import SalesReturn from "../models/SalesReturn.js";
import SalesReturnItem from "../models/SalesReturnItem.js";
import StockLot from "../models/StockLot.js";
import { createLedgerEntry } from "../utils/ledgerHelper.js";
import { logStockTransaction } from "../utils/stockLogger.js";

/* =========================================
   CREATE SALES RETURN
========================================= */
export const createSalesReturn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const storeId = req.storeId;
    const userId = req.user._id;

    const {
  saleId,
  items,
  adjustmentType = "ADJUST",
} = req.body;

    if (!saleId || !items || items.length === 0) {
      throw new Error("Sale and items are required");
    }

    const sale = await Sale.findOne({
      _id: saleId,
      store: storeId,
    }).session(session);

    if (!sale) throw new Error("Sale not found");

    let totalReturnAmount = 0;
    let totalProfitReversal = 0;

    /* =========================
       CREATE RETURN
    ========================= */
    const [salesReturn] = await SalesReturn.create(
      [
        {
          store: storeId,
          sale: sale._id,
          party: sale.party,        // ✅ REQUIRED
          createdBy: userId,        // ✅ REQUIRED
          adjustmentType,     // ✅ REQUIRED (default)
          totalAmount: 0,
        },
      ],
      { session }
    );

    /* =========================
       PROCESS ITEMS
    ========================= */
    for (const item of items) {
      const {
        saleItemId,
        quantity,
        condition = "good",
        lots = [],
      } = item;

      if (!saleItemId || !quantity || quantity <= 0) {
        throw new Error("Invalid item data");
      }

      const saleItem = await SaleItem.findById(saleItemId).session(session);

      if (!saleItem) throw new Error("Sale item not found");

      if (saleItem.sale.toString() !== sale._id.toString()) {
        throw new Error("Invalid sale item");
      }

      /* =========================
         CHECK RETURN LIMIT
      ========================= */
      const prevReturns =
  await SalesReturnItem.aggregate([
        {
          $match: {
            saleItem: saleItem._id,
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$saleItem",
            totalReturned: { $sum: "$quantity" },
          },
        },
      ]).session(session);

      const alreadyReturned = prevReturns[0]?.totalReturned || 0;

      if (alreadyReturned + quantity > saleItem.quantity) {
        throw new Error("Return exceeds sold quantity");
      }
      /* =========================
        CALCULATIONS
        ========================= */


        const unitPrice = Number(
          saleItem.price
        );

        const returnAmount = Number(
          (
            unitPrice * quantity
          ).toFixed(2)
        );

      /* =========================
         LOT REVERSAL (FIFO)
      ========================= */
      /* =========================
   LOT REVERSAL
        ========================= */
        if (!lots.length) {
          throw new Error(
            "Please select return lots"
          );
        }

        const lotReturns = [];

        const totalLotQty = lots.reduce(
          (sum, l) => sum + Number(l.quantity || 0),
          0
        );

        if (totalLotQty !== quantity) {
          throw new Error(
            "Lot return quantity must match return quantity"
          );
        }

        let costToReverse = 0;

        for (const selectedLot of lots) {

          const originalLot = saleItem.lots.find(
            (l) =>
              l.stockLot.toString() ===
              selectedLot.stockLot.toString()
          );

          if (!originalLot) {
            throw new Error(
              "Lot not found in original sale"
            );
          }

          const returnQty = Number(
            selectedLot.quantity
          );

          if (returnQty <= 0) {
            continue;
          }

          if (returnQty > originalLot.quantity) {
            throw new Error(
              `Return exceeds sold quantity for lot ${selectedLot.stockLot}`
            );
          }

          /* =========================
            COST REVERSAL
          ========================= */
          costToReverse +=
            returnQty *
            Number(originalLot.costPrice);

          /* =========================
            RESTORE STOCK
          ========================= */
          if (
            condition === "good" &&
            adjustmentType !== "REPLACE"
          ) {
            const stockLot =
              await StockLot.findById(
                selectedLot.stockLot
              ).session(session);

            if (!stockLot) {
              throw new Error(
                "Stock lot not found"
              );
            }

            stockLot.remainingQty += returnQty;

            await stockLot.save({
              session,
            });

            await logStockTransaction({
              product: saleItem.product,
              store: storeId,
              stockLot: stockLot._id,

              type: "SALES_RETURN",

              quantity: returnQty,

              costPrice:
                originalLot.costPrice,

              sellingPrice:
                saleItem.price,

              performedBy: userId,

              notes: "Sales Return",

              session,
            });
          }

          lotReturns.push({
            stockLot: selectedLot.stockLot,
            quantity: returnQty,
            costPrice:
              originalLot.costPrice,
          });
        }

        costToReverse = Number(
          costToReverse.toFixed(2)
        );

        /* =========================
          PROFIT REVERSAL
        ========================= */

        const profitReversal = Number(
          (
            costToReverse - returnAmount
          ).toFixed(2)
        );

        totalReturnAmount += returnAmount;

        totalProfitReversal +=
          profitReversal;

      /* =========================
         CREATE RETURN ITEM
      ========================= */
      await SalesReturnItem.create(
        [
          {
            salesReturn: salesReturn._id,
            saleItem: saleItem._id,
            product: saleItem.product,
            store: storeId,
            quantity,
            price: unitPrice,
            condition,
            lots: lotReturns,
            adjustmentType,
            totalRevenue: returnAmount,
            totalCost: costToReverse,
            profitLoss: profitReversal,
            affectsStock:
            adjustmentType !== "REPLACE",
          },
        ],
        { session }
      );
    }
/* =========================
   FINALIZE RETURN
========================= */

salesReturn.totalAmount = Number(
  totalReturnAmount.toFixed(2)
);

salesReturn.totalProfitLoss = Number(
  totalProfitReversal.toFixed(2)
);

await salesReturn.save({ session });

/* =========================
   UPDATE SALE SUMMARY
   (INFORMATIONAL ONLY)
========================= */

sale.hasReturn = true;

sale.returnCount =
  (sale.returnCount || 0) + 1;

sale.returnedAmount = Number(
  (
    (sale.returnedAmount || 0) +
    totalReturnAmount
  ).toFixed(2)
);

sale.returnedQuantity = Number(
  (
    (sale.returnedQuantity || 0) +
    items.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    )
  ).toFixed(2)
);

sale.totalProfit = Number(
  (
    sale.totalProfit +
    totalProfitReversal
  ).toFixed(2)
);

await sale.save({ session });

    /* =========================
       LEDGER ENTRY
    ========================= */

if (adjustmentType === "ADJUST") {
  await createLedgerEntry({
    party: sale.party,

    store: storeId,

    entryType: "SALES_RETURN",

    /*
      Sales return creates
      customer credit
    */
    type: "CREDIT",

    amount: totalReturnAmount,

    referenceId: salesReturn._id,

    referenceModel: "SalesReturn",

    createdBy: userId,

    /*
      We owe customer
    */
    impact: -totalReturnAmount,

    note: "Sales return adjustment",

    session,
  });
}

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      data: salesReturn,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Sales Return Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET ALL SALES RETURNS
========================================= */
export const getSalesReturns = async (req, res) => {
  try {
    const storeId = req.storeId;

    const returns = await SalesReturn.find({
      store: storeId,
      isDeleted: false,
    })
    .populate("party", "name")
    .populate(
      "sale",
      "invoiceNumber totalAmount saleDate paidAmount dueAmount"
    )
    .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    console.error("Get Sales Returns Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET SINGLE SALES RETURN
========================================= */
export const getSalesReturnById = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const salesReturn = await SalesReturn.findOne({
      _id: id,
      store: storeId,
      isDeleted: false,
    })
    .populate("party", "name")
    .populate(
      "sale",
      "invoiceNumber totalAmount saleDate paidAmount dueAmount"
    );

    if (!salesReturn) {
      return res.status(404).json({
        success: false,
        message: "Sales return not found",
      });
    }

    const items = await SalesReturnItem.find({
      salesReturn: id,
    })
      .populate("product", "name")
      .populate("saleItem")
      .populate("lots.stockLot");

    return res.json({
      success: true,
      data: {
        salesReturn,
        items,
      },
    });
  } catch (error) {
    console.error("Get Sales Return Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};