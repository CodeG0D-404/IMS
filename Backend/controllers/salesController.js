import mongoose from "mongoose";

import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";
import StockLot from "../models/StockLot.js";
import { logStockTransaction } from "../utils/stockLogger.js";
import { createLedgerEntry } from "../utils/ledgerHelper.js";

/* =========================================
   CREATE SALE (FIFO + PROFIT SAFE)
========================================= */
export const createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const storeId = req.storeId;
    const userId = req.user._id; // ✅ FIX

    // 🔥 ONLY ADD THIS (no removal)
    const {
      party,
      customer,
      items,
      totalAmount,
      paidAmount = 0,
      paymentMode,
      saleDate,
    } = req.body;

    const finalCustomer = party || customer; // ✅ FIX

    /* =========================
       VALIDATION
    ========================= */
    if (!finalCustomer || !items || items.length === 0) {
      throw new Error("Customer and items are required");
    }

    for (const item of items) {
      if (
        !item.product ||
        item.quantity === undefined ||
        item.quantity <= 0 ||
        item.sellingPrice === undefined ||
        item.sellingPrice <= 0
      ) {
        console.log("INVALID ITEM:", item);
        throw new Error("Invalid item data");
      }
    }

    const dueAmount = Number(
      (totalAmount - paidAmount).toFixed(2)
    );

    if (paidAmount < 0) {
  throw new Error(
    "Paid amount cannot be negative"
  );
}

if (totalAmount <= 0) {
  throw new Error(
    "Total amount must be greater than 0"
  );
}

    /* =========================
       CREATE SALE
    ========================= */
    const [sale] = await Sale.create(
      [
        {
          store: storeId,
          party: finalCustomer,
          createdBy: userId,

          totalAmount,

          paidAmount,

          dueAmount,

          totalProfit: 0,

          totalItems: items.length,

          saleDate: saleDate || new Date(),
        },
      ],
      { session }
    );

    let totalProfit = 0;

    /* =========================
       PROCESS ITEMS (FIFO)
    ========================= */
    for (const item of items) {
      const { product, quantity, sellingPrice } = item;

      const selectedLots = item.lots || [];

if (!selectedLots.length) {
  throw new Error(
    "Please select at least one lot"
  );
}

const totalSelected = selectedLots.reduce(
  (sum, lot) => sum + Number(lot.quantity || 0),
  0
);

if (totalSelected !== quantity) {
  throw new Error(
    "Selected lot quantity must match item quantity"
  );
}

let lotBreakdown = [];
let totalCost = 0;

for (const selected of selectedLots) {

  const lot = await StockLot.findOne({
    _id: selected.stockLot,
    store: storeId,
    product,
  }).session(session);

  if (!lot) {
    throw new Error("Lot not found");
  }

  if (lot.remainingQty < selected.quantity) {
    throw new Error(
      `Lot ${lot._id} has only ${lot.remainingQty} available`
    );
  }

  lot.remainingQty -= Number(selected.quantity);

  await lot.save({ session });

  const cost =
    Number(selected.quantity) *
    Number(lot.purchasePrice);

  totalCost += cost;

  lotBreakdown.push({
    stockLot: lot._id,
    quantity: Number(selected.quantity),
    costPrice: lot.purchasePrice,
  });

  await logStockTransaction({
    store: storeId,
    product,
    type: "SALE",
    quantity: -Number(selected.quantity),
    stockLot: lot._id,
    referenceId: sale._id,
    referenceModel: "Sale",
    performedBy: userId,
    session,
  });
}

        const totalRevenue = Number(
          (
            quantity * sellingPrice
          ).toFixed(2)
        );

        const profit = Number(
          (
            totalRevenue - totalCost
          ).toFixed(2)
        );

      totalProfit += profit;

      await SaleItem.create(
        [
          {
            sale: sale._id,
            product,
            store: storeId, // ✅ FIX (same as purchase)
            quantity,
            price: sellingPrice,
            lots: lotBreakdown,
            totalCost,
            totalRevenue,
            profit,
          },
        ],
        { session }
      );
    }

    /* =========================
       UPDATE SALE
    ========================= */
    sale.totalProfit = Number(
          totalProfit.toFixed(2)
        );
    await sale.save({ session });

    /* =========================
       LEDGER ENTRY
    ========================= */


const saleImpact =
  Number(totalAmount) -
  Number(paidAmount);

await createLedgerEntry({
  party: finalCustomer,

  store: storeId,

  entryType: "SALE",

  /*
    SALE increases customer due
  */
  type: "DEBIT",

  amount: totalAmount,

  paymentMode:
    paymentMode?.toLowerCase() || "cash",

  referenceId: sale._id,

  referenceModel: "Sale",

  createdBy: userId,

  /*
    Running balance impact
  */
  impact: saleImpact,

  note: "Sale created",

  session,
});
await session.commitTransaction();
session.endSession();

return res.status(201).json({
  success: true,
  data: sale,
});

} catch (error) {
  await session.abortTransaction();
  session.endSession();

  console.error("Create Sale Error:", error);

  return res.status(500).json({
    success: false,
    message: error.message,
  });
}
};
/* =========================================
   GET ALL SALES
========================================= */
export const getSales = async (req, res) => {
  try {
    const storeId = req.storeId;

    const sales = await Sale.find({ store: storeId })
      .populate(
        "party",
        "name phone email"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sales.length,
      data: sales,
    });

  } catch (error) {
    console.error("Get Sales Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET SALE BY ID
========================================= */
export const getSaleById = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const sale = await Sale.findOne({
      _id: id,
      store: storeId,
    }).populate(
        "party",
        "name phone email"
      )

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    const items = await SaleItem.find({
      sale: sale._id,
    }).populate("product");

    return res.status(200).json({
      success: true,
      data: {
        sale,
        items,
      },
    });

  } catch (error) {
    console.error("Get Sale Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};