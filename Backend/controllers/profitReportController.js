import mongoose from "mongoose";

import SaleItem from "../models/SaleItem.js";
import SalesReturnItem from "../models/SalesReturnItem.js";

import StockTransaction from "../models/StockTransaction.js";

/* =========================================
   PROFIT OVERVIEW
========================================= */
export const getProfitOverview =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         GROSS PROFIT
      ========================================= */

      const grossProfitAgg =
        await SaleItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: null,

              totalRevenue: {
                $sum:
                  "$totalRevenue",
              },

              totalCost: {
                $sum: "$totalCost",
              },

              grossProfit: {
                $sum: "$profit",
              },
            },
          },
        ]);

      /* =========================================
         RETURN LOSSES
      ========================================= */

      const returnAgg =
        await SalesReturnItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: null,

              totalReturnRevenue: {
                $sum:
                  "$totalRevenue",
              },

              totalReturnCost: {
                $sum:
                  "$totalCost",
              },

              totalReturnLoss: {
                $sum:
                  "$profitLoss",
              },
            },
          },
        ]);

      const grossRevenue =
        grossProfitAgg[0]
          ?.totalRevenue || 0;

      const grossCost =
        grossProfitAgg[0]
          ?.totalCost || 0;

      const grossProfit =
        grossProfitAgg[0]
          ?.grossProfit || 0;

      const totalReturnRevenue =
        returnAgg[0]
          ?.totalReturnRevenue || 0;

      const totalReturnCost =
        returnAgg[0]
          ?.totalReturnCost || 0;

      const totalReturnLoss =
        returnAgg[0]
          ?.totalReturnLoss || 0;

      const netProfit = Number(
        (
          grossProfit -
          totalReturnLoss
        ).toFixed(2)
      );

      return res.status(200).json({
        success: true,

        data: {
          grossRevenue,

          grossCost,

          grossProfit,

          totalReturnRevenue,

          totalReturnCost,

          totalReturnLoss,

          netProfit,
        },
      });
    } catch (error) {
      console.error(
        "Profit Overview Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PROFIT TREND REPORT
========================================= */
export const getProfitTrend =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const trend =
        await SaleItem.aggregate([
          {
            $lookup: {
              from: "sales",

              localField: "sale",
              foreignField: "_id",

              as: "saleData",
            },
          },

          {
            $unwind: "$saleData",
          },

          {
            $match: {
              store: storeId,

              "saleData.isDeleted":
                false,
            },
          },

          {
            $group: {
              _id: {
                year: {
                  $year:
                    "$saleData.saleDate",
                },

                month: {
                  $month:
                    "$saleData.saleDate",
                },

                day: {
                  $dayOfMonth:
                    "$saleData.saleDate",
                },
              },

              revenue: {
                $sum:
                  "$totalRevenue",
              },

              cost: {
                $sum:
                  "$totalCost",
              },

              profit: {
                $sum: "$profit",
              },
            },
          },

          {
            $sort: {
              "_id.year": 1,
              "_id.month": 1,
              "_id.day": 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: trend,
      });
    } catch (error) {
      console.error(
        "Profit Trend Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PRODUCT PROFIT REPORT
========================================= */
export const getProductProfitReport =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const products =
        await SaleItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: "$product",

              totalRevenue: {
                $sum:
                  "$totalRevenue",
              },

              totalCost: {
                $sum:
                  "$totalCost",
              },

              totalProfit: {
                $sum: "$profit",
              },

              totalQty: {
                $sum: "$quantity",
              },
            },
          },

          {
            $sort: {
              totalProfit: -1,
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

              totalRevenue: 1,

              totalCost: 1,

              totalProfit: 1,

              totalQty: 1,

              margin: {
                $cond: [
                  {
                    $eq: [
                      "$totalRevenue",
                      0,
                    ],
                  },

                  0,

                  {
                    $multiply: [
                      {
                        $divide: [
                          "$totalProfit",
                          "$totalRevenue",
                        ],
                      },

                      100,
                    ],
                  },
                ],
              },
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
        "Product Profit Report Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   NET PRODUCT PROFIT REPORT
========================================= */
export const getNetProductProfitReport =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         SALES PROFITS
      ========================================= */

      const profits =
        await SaleItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: "$product",

              revenue: {
                $sum:
                  "$totalRevenue",
              },

              cost: {
                $sum:
                  "$totalCost",
              },

              profit: {
                $sum: "$profit",
              },
            },
          },
        ]);

      /* =========================================
         RETURN LOSSES
      ========================================= */

      const losses =
        await SalesReturnItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: "$product",

              returnRevenue: {
                $sum:
                  "$totalRevenue",
              },

              returnCost: {
                $sum:
                  "$totalCost",
              },

              returnLoss: {
                $sum:
                  "$profitLoss",
              },
            },
          },
        ]);

      const lossMap = {};

      for (const item of losses) {
        lossMap[item._id.toString()] =
          item;
      }

      const finalData = [];

      for (const item of profits) {
        const key =
          item._id.toString();

        const loss =
          lossMap[key] || {};

        finalData.push({
          product: item._id,

          grossRevenue:
            item.revenue,

          grossCost:
            item.cost,

          grossProfit:
            item.profit,

          returnRevenue:
            loss.returnRevenue || 0,

          returnCost:
            loss.returnCost || 0,

          returnLoss:
            loss.returnLoss || 0,

          netRevenue: Number(
            (
              item.revenue -
              (loss.returnRevenue ||
                0)
            ).toFixed(2)
          ),

          netProfit: Number(
            (
              item.profit -
              (loss.returnLoss ||
                0)
            ).toFixed(2)
          ),
        });
      }

      return res.status(200).json({
        success: true,
        count: finalData.length,
        data: finalData,
      });
    } catch (error) {
      console.error(
        "Net Product Profit Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   LOSS REPORT
========================================= */
export const getLossReport =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         SALES RETURN LOSSES
      ========================================= */

      const salesReturnLosses =
        await SalesReturnItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: null,

              totalLoss: {
                $sum:
                  "$profitLoss",
              },
            },
          },
        ]);

      /* =========================================
         STOCK ADJUSTMENT LOSSES
      ========================================= */

      const adjustmentLosses =
        await StockTransaction.aggregate([
          {
            $match: {
              store: storeId,

              transactionType:
                "ADJUSTMENT",

              direction: "OUT",

              isDeleted: false,
            },
          },

          {
            $group: {
              _id: null,

              totalLoss: {
                $sum:
                  "$totalCost",
              },
            },
          },
        ]);

      const salesReturnLoss =
        salesReturnLosses[0]
          ?.totalLoss || 0;

      const stockAdjustmentLoss =
        adjustmentLosses[0]
          ?.totalLoss || 0;

      const totalLoss = Number(
        (
          salesReturnLoss +
          stockAdjustmentLoss
        ).toFixed(2)
      );

      return res.status(200).json({
        success: true,

        data: {
          salesReturnLoss,

          stockAdjustmentLoss,

          totalLoss,
        },
      });
    } catch (error) {
      console.error(
        "Loss Report Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   MOST PROFITABLE PRODUCTS
========================================= */
export const getMostProfitableProducts =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const limit =
        Number(req.query.limit) || 10;

      const products =
        await SaleItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: "$product",

              totalProfit: {
                $sum: "$profit",
              },

              totalRevenue: {
                $sum:
                  "$totalRevenue",
              },

              totalQty: {
                $sum: "$quantity",
              },
            },
          },

          {
            $sort: {
              totalProfit: -1,
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

              totalProfit: 1,

              totalRevenue: 1,

              totalQty: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error(
        "Most Profitable Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };