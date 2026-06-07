import mongoose from "mongoose";

import StockLot from "../models/StockLot.js";

/* =========================================
   STOCK SUMMARY (PER PRODUCT)
========================================= */
export const getStockSummary = async (req, res) => {
  try {
    const storeId = req.storeId;

    const summary = await StockLot.aggregate([
      {
        $match: {
          store: new mongoose.Types.ObjectId(storeId),

          isDeleted: false,
          isActive: true,

          remainingQty: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: "$product",
          totalQty: { $sum: "$remainingQty" },
          totalValue: {
            $sum: {
              $multiply: ["$remainingQty", "$purchasePrice"],
            },
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productId: "$product._id",
          name: "$product.name",
          sku: "$product.sku",
          totalQty: 1,
          totalValue: 1,
        },
      },
      { $sort: { name: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      count: summary.length,
      data: summary,
    });
  } catch (error) {
    console.error("Stock Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   SINGLE PRODUCT STOCK DETAILS (FIFO VIEW)
========================================= */
export const getProductStockDetails = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { productId } = req.params;

    const lots = await StockLot.find({
      store: storeId,
      product: productId,

      isDeleted: false,
      isActive: true,

      remainingQty: { $gt: 0 },
    }).sort({ purchaseDate: 1 });

    let totalQty = 0;
    let totalValue = 0;

    const fifoLayers = lots.map((lot) => {
      const value = Number(
        (
          lot.remainingQty *
          lot.purchasePrice
        ).toFixed(2)
      );

      totalQty += lot.remainingQty;
      totalValue += value;

      return {
        lotId: lot._id,
        purchaseDate: lot.purchaseDate,
        remainingQty: lot.remainingQty,
        purchasePrice: lot.purchasePrice,
        value,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalQty: Number(
          totalQty.toFixed(2)
        ),

        totalValue: Number(
          totalValue.toFixed(2)
        ),

        fifoLayers,
      },
    });
  } catch (error) {
    console.error("Product Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   TOTAL INVENTORY VALUE
========================================= */
export const getTotalInventoryValue = async (req, res) => {
  try {
    const storeId = req.storeId;

    const result = await StockLot.aggregate([
      {
        $match: {
          store: new mongoose.Types.ObjectId(storeId),

          isDeleted: false,
          isActive: true,

          remainingQty: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: null,
          totalQty: { $sum: "$remainingQty" },
          totalValue: {
            $sum: {
              $multiply: ["$remainingQty", "$purchasePrice"],
            },
          },
        },
      },
    ]);

    const raw =
        result[0] || {
          totalQty: 0,
          totalValue: 0,
        };

      const data = {
        totalQty: Number(
          raw.totalQty?.toFixed(2) || 0
        ),

        totalValue: Number(
          raw.totalValue?.toFixed(2) || 0
        ),
      };

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Inventory Value Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   LOW STOCK SUMMARY (PRODUCT LEVEL)
========================================= */
export const getLowStockSummary = async (req, res) => {
  try {
    const storeId = req.storeId;
    const threshold = Number(req.query.threshold) || 5;

    const summary = await StockLot.aggregate([
      {
        $match: {
          store: new mongoose.Types.ObjectId(storeId),

          isDeleted: false,
          isActive: true,

          remainingQty: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: "$product",
          totalQty: { $sum: "$remainingQty" },
        },
      },
      {
        $match: {
          totalQty: { $lte: threshold },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productId: "$product._id",
          name: "$product.name",
          sku: "$product.sku",
          totalQty: 1,
        },
      },
      { $sort: { totalQty: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      count: summary.length,
      data: summary,
    });
  } catch (error) {
    console.error("Low Stock Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};