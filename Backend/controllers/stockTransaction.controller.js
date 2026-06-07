import mongoose from "mongoose";
import StockTransaction from "../models/StockTransaction.js";

/* =========================================
   GET ALL STOCK TRANSACTIONS (FILTERABLE)
========================================= */
export const getStockTransactions = async (req, res) => {
  try {
    const storeId = req.storeId;

    const {
      product,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    let filter = {
      store: storeId,
      isDeleted: false,
    };

    if (product) filter.product = product;
    if (type) filter.type = type;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const transactions = await StockTransaction.find(filter)
      .populate("product", "name sku")
      .populate("stockLot")
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await StockTransaction.countDocuments(filter);

    return res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: transactions,
    });
  } catch (error) {
    console.error("Stock Transactions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   ALIAS (FIX FOR ROUTES)
========================================= */
export const getTransactionsByStore = getStockTransactions;

/* =========================================
   GET SINGLE TRANSACTION
========================================= */
export const getSingleTransaction = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const transaction = await StockTransaction.findOne({
        _id: id,
        store: storeId,

        isDeleted: false,
      })
      .populate("product", "name sku")
      .populate("stockLot");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Get Single Transaction Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET PRODUCT TRANSACTIONS
========================================= */
export const getProductTransactions = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { productId } = req.params;

    const transactions = await StockTransaction.find({
        store: storeId,
        product: productId,

        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .populate("stockLot");

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Product Transactions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   ALIAS (FIX FOR ROUTES)
========================================= */
export const getTransactionsByProduct = getProductTransactions;

/* =========================================
   GET LOT TRANSACTIONS
========================================= */
export const getLotTransactions = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { lotId } = req.params;

    const transactions = await StockTransaction.find({
        store: storeId,
        stockLot: lotId,

        isDeleted: false,
      }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Lot Transactions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET REFERENCE TRANSACTIONS
========================================= */
export const getReferenceTransactions = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { referenceId } = req.params;

    const transactions = await StockTransaction.find({
        store: storeId,
        referenceId,

        isDeleted: false,
      }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions,
    });
  } catch (error) {
    console.error("Reference Transactions Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   STOCK MOVEMENT SUMMARY
========================================= */
export const getStockMovementSummary = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { productId } = req.query;

    let match = {
        store: storeId,
        isDeleted: false,
      };

    if (productId) match.product = productId;

    const summary = await StockTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$type",
          totalQty: { $sum: "$quantity" },
        },
      },
    ]);

    let result = {
        PURCHASE: 0,

        SALE: 0,

        PURCHASE_RETURN: 0,

        SALES_RETURN: 0,

        PURCHASE_REPLACEMENT_IN: 0,

        SALES_REPLACEMENT_OUT: 0,

        DAMAGE: 0,

        MANUAL_ADJUSTMENT: 0,
      };

    summary.forEach((item) => {
      result[item._id] = item.totalQty;
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Stock Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};