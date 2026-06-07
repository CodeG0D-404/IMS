import mongoose from "mongoose";

import StockLot from "../models/StockLot.js";
import StockTransaction from "../models/StockTransaction.js";

/* =========================================
   INVENTORY OVERVIEW
========================================= */
export const getInventoryOverview =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         TOTAL STOCK VALUE
      ========================================= */

      const stockValueAgg =
        await StockLot.aggregate([
          {
            $match: {
              store: storeId,

              isDeleted: false,
              isActive: true,

              remainingQty: { $gt: 0 },
            },
          },

          {
            $project: {
              stockValue: {
                $multiply: [
                  "$remainingQty",
                  "$purchasePrice",
                ],
              },

              remainingQty: 1,
            },
          },

          {
            $group: {
              _id: null,

              totalStockValue: {
                $sum: "$stockValue",
              },

              totalUnits: {
                $sum: "$remainingQty",
              },

              totalLots: {
                $sum: 1,
              },
            },
          },
        ]);

      const overview =
        stockValueAgg[0] || {};

      /* =========================================
         LOW STOCK
      ========================================= */

      const lowStockCount =
        await StockLot.countDocuments({
          store: storeId,

          isDeleted: false,
          isActive: true,

          remainingQty: {
            $gt: 0,
            $lte: 5,
          },
        });

      /* =========================================
         OUT OF STOCK
      ========================================= */

      const outOfStockCount =
        await StockLot.countDocuments({
          store: storeId,

          isDeleted: false,
          isActive: true,

          remainingQty: 0,
        });

      return res.status(200).json({
        success: true,

        data: {
          totalStockValue: Number(
            (
              overview.totalStockValue || 0
            ).toFixed(2)
          ),

          totalUnits: Number(
            (
              overview.totalUnits || 0
            ).toFixed(2)
          ),

          totalLots:
            overview.totalLots || 0,

          lowStockCount,

          outOfStockCount,
        },
      });
    } catch (error) {
      console.error(
        "Inventory Overview Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   STOCK MOVEMENT REPORT
========================================= */
export const getStockMovementReport =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const movement =
        await StockTransaction.aggregate([
          {
            $match: {
              store: storeId,

              isDeleted: false,
            },
          },

          {
            $group: {
              _id: {
                type:
                  "$transactionType",

                direction:
                  "$direction",
              },

              totalQty: {
                $sum: "$quantity",
              },

              totalCost: {
                $sum: "$totalCost",
              },

              totalRevenue: {
                $sum: "$totalRevenue",
              },
            },
          },

          {
            $sort: {
              "_id.type": 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: movement,
      });
    } catch (error) {
      console.error(
        "Stock Movement Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   INVENTORY VALUATION
========================================= */
export const getInventoryValuation =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const valuation =
        await StockLot.aggregate([
          {
            $match: {
              store: storeId,

              isDeleted: false,
              isActive: true,

              remainingQty: { $gt: 0 },
            },
          },

          {
            $lookup: {
              from: "products",

              localField: "product",
              foreignField: "_id",

              as: "product",
            },
          },

          {
            $unwind: "$product",
          },

          {
            $project: {
              productId:
                "$product._id",

              name: "$product.name",

              sku: "$product.sku",

              purchasePrice: 1,

              remainingQty: 1,

              totalValue: {
                $multiply: [
                  "$remainingQty",
                  "$purchasePrice",
                ],
              },
            },
          },

          {
            $sort: {
              totalValue: -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        count: valuation.length,
        data: valuation,
      });
    } catch (error) {
      console.error(
        "Inventory Valuation Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   LOW STOCK PRODUCTS
========================================= */
export const getLowStockProducts =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const threshold =
        Number(req.query.threshold) ||
        5;

      const products =
        await StockLot.aggregate([
          {
            $match: {
              store: storeId,

              isDeleted: false,
              isActive: true,
            },
          },

          {
            $group: {
              _id: "$product",

              totalQty: {
                $sum: "$remainingQty",
              },
            },
          },

          {
            $match: {
              totalQty: {
                $lte: threshold,
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

          {
            $unwind: "$product",
          },

          {
            $project: {
              _id: 0,

              productId:
                "$product._id",

              name: "$product.name",

              sku: "$product.sku",

              totalQty: 1,
            },
          },

          {
            $sort: {
              totalQty: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      console.error(
        "Low Stock Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   OUT OF STOCK PRODUCTS
========================================= */
export const getOutOfStockProducts =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const products =
        await StockLot.aggregate([
          {
            $match: {
              store: storeId,

              isDeleted: false,
              isActive: true,
            },
          },

          {
            $group: {
              _id: "$product",

              totalQty: {
                $sum: "$remainingQty",
              },
            },
          },

          {
            $match: {
              totalQty: 0,
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

          {
            $unwind: "$product",
          },

          {
            $project: {
              _id: 0,

              productId:
                "$product._id",

              name: "$product.name",

              sku: "$product.sku",
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        count: products.length,
        data: products,
      });
    } catch (error) {
      console.error(
        "Out Of Stock Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   FAST MOVING PRODUCTS
========================================= */
export const getFastMovingProducts =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const limit =
        Number(req.query.limit) || 10;

      const products =
        await StockTransaction.aggregate([
          {
            $match: {
              store: storeId,

              transactionType:
                "SALE",

              direction: "OUT",

              isDeleted: false,
            },
          },

          {
            $group: {
              _id: "$product",

              totalSold: {
                $sum: {
                  $abs: "$quantity",
                },
              },
            },
          },

          {
            $sort: {
              totalSold: -1,
            },
          },

          {
            $limit: limit,
          },

          {
            $lookup: {
              from: "products",

              localField: "_id",
              foreignField: "_id",

              as: "product",
            },
          },

          {
            $unwind: "$product",
          },

          {
            $project: {
              _id: 0,

              productId:
                "$product._id",

              name: "$product.name",

              sku: "$product.sku",

              totalSold: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error(
        "Fast Moving Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   STOCK LOT AGING
========================================= */
export const getStockLotAging =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const lots =
        await StockLot.aggregate([
          {
            $match: {
              store: storeId,

              isDeleted: false,
              isActive: true,

              remainingQty: { $gt: 0 },
            },
          },

          {
            $lookup: {
              from: "products",

              localField: "product",
              foreignField: "_id",

              as: "product",
            },
          },

          {
            $unwind: "$product",
          },

          {
            $project: {
              productId:
                "$product._id",

              name: "$product.name",

              sku: "$product.sku",

              purchaseDate: 1,

              remainingQty: 1,

              purchasePrice: 1,

              ageInDays: {
                $dateDiff: {
                  startDate:
                    "$purchaseDate",

                  endDate: "$$NOW",

                  unit: "day",
                },
              },
            },
          },

          {
            $sort: {
              ageInDays: -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        count: lots.length,
        data: lots,
      });
    } catch (error) {
      console.error(
        "Stock Lot Aging Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };