import mongoose from "mongoose";

import Product from "../models/Product.js";

import SaleItem from "../models/SaleItem.js";
import SalesReturnItem from "../models/SalesReturnItem.js";

import PurchaseItem from "../models/PurchaseItem.js";
import PurchaseReturnItem from "../models/PurchaseReturnItem.js";

import StockLot from "../models/StockLot.js";

/* =========================================
   PRODUCT OVERVIEW
========================================= */
export const getProductOverview =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         TOTAL PRODUCTS
      ========================================= */

      const totalProducts =
        await Product.countDocuments({
          store: storeId,
          isDeleted: false,
        });

      /* =========================================
         STOCK VALUE
      ========================================= */

      const stockAgg =
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
            },
          },

          {
            $group: {
              _id: null,

              totalStockValue: {
                $sum: "$stockValue",
              },

              totalStockQty: {
                $sum: "$remainingQty",
              },
            },
          },
        ]);

      return res.status(200).json({
        success: true,

        data: {
          totalProducts,

          totalStockValue: Number(
            (
              stockAgg[0]
                ?.totalStockValue || 0
            ).toFixed(2)
          ),

          totalStockQty: Number(
            (
              stockAgg[0]
                ?.totalStockQty || 0
            ).toFixed(2)
          ),
        },
      });
    } catch (error) {
      console.error(
        "Product Overview Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PRODUCT SALES REPORT
========================================= */
export const getProductSalesReport =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const sales =
        await SaleItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: "$product",

              totalSold: {
                $sum: "$quantity",
              },

              revenue: {
                $sum: "$totalRevenue",
              },

              profit: {
                $sum: "$profit",
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

              totalSold: 1,

              revenue: 1,

              profit: 1,
            },
          },

          {
            $sort: {
              totalSold: -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        count: sales.length,
        data: sales,
      });
    } catch (error) {
      console.error(
        "Product Sales Report Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PRODUCT PURCHASE REPORT
========================================= */
export const getProductPurchaseReport =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const purchases =
        await PurchaseItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: "$product",

              totalPurchased: {
                $sum: "$quantity",
              },

              purchaseValue: {
                $sum: "$total",
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

              totalPurchased: 1,

              purchaseValue: 1,
            },
          },

          {
            $sort: {
              totalPurchased: -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        count: purchases.length,
        data: purchases,
      });
    } catch (error) {
      console.error(
        "Product Purchase Report Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   NET PRODUCT MOVEMENT
========================================= */
export const getNetProductMovement =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const products =
        await Product.find({
          store: storeId,
          isDeleted: false,
        });

      const result = [];

      for (const product of products) {
        const productId = product._id;

        /* =========================================
           PURCHASES
        ========================================= */

        const purchaseAgg =
          await PurchaseItem.aggregate([
            {
              $match: {
                store: storeId,
                product: productId,
              },
            },

            {
              $group: {
                _id: null,

                qty: {
                  $sum: "$quantity",
                },
              },
            },
          ]);

        /* =========================================
           PURCHASE RETURNS
        ========================================= */

        const purchaseReturnAgg =
          await PurchaseReturnItem.aggregate([
            {
              $match: {
                store: storeId,
                product: productId,
              },
            },

            {
              $group: {
                _id: null,

                qty: {
                  $sum: "$quantity",
                },
              },
            },
          ]);

        /* =========================================
           SALES
        ========================================= */

        const salesAgg =
          await SaleItem.aggregate([
            {
              $match: {
                store: storeId,
                product: productId,
              },
            },

            {
              $group: {
                _id: null,

                qty: {
                  $sum: "$quantity",
                },

                revenue: {
                  $sum:
                    "$totalRevenue",
                },

                profit: {
                  $sum: "$profit",
                },
              },
            },
          ]);

        /* =========================================
           SALES RETURNS
        ========================================= */

        const salesReturnAgg =
          await SalesReturnItem.aggregate([
            {
              $match: {
                store: storeId,
                product: productId,
              },
            },

            {
              $group: {
                _id: null,

                qty: {
                  $sum: "$quantity",
                },

                returnValue: {
                  $sum:
                    "$totalRevenue",
                },

                returnLoss: {
                  $sum:
                    "$profitLoss",
                },
              },
            },
          ]);

        /* =========================================
           CURRENT STOCK
        ========================================= */

        const stockAgg =
          await StockLot.aggregate([
            {
              $match: {
                store: storeId,

                product: productId,

                isDeleted: false,
                isActive: true,
              },
            },

            {
              $group: {
                _id: null,

                stockQty: {
                  $sum:
                    "$remainingQty",
                },

                stockValue: {
                  $sum: {
                    $multiply: [
                      "$remainingQty",
                      "$purchasePrice",
                    ],
                  },
                },
              },
            },
          ]);

        const totalPurchased =
          purchaseAgg[0]?.qty || 0;

        const totalPurchaseReturns =
          purchaseReturnAgg[0]?.qty ||
          0;

        const totalSold =
          salesAgg[0]?.qty || 0;

        const totalSalesReturns =
          salesReturnAgg[0]?.qty ||
          0;

        const netPurchased =
          totalPurchased -
          totalPurchaseReturns;

        const netSold =
          totalSold -
          totalSalesReturns;

        result.push({
          productId,

          name: product.name,

          sku: product.sku,

          totalPurchased,

          totalPurchaseReturns,

          netPurchased,

          totalSold,

          totalSalesReturns,

          netSold,

          revenue:
            salesAgg[0]?.revenue || 0,

          returnValue:
            salesReturnAgg[0]
              ?.returnValue || 0,

          netRevenue: Number(
            (
              (salesAgg[0]
                ?.revenue || 0) -
              (salesReturnAgg[0]
                ?.returnValue || 0)
            ).toFixed(2)
          ),

          grossProfit:
            salesAgg[0]?.profit || 0,

          returnLoss:
            salesReturnAgg[0]
              ?.returnLoss || 0,

          netProfit: Number(
            (
              (salesAgg[0]
                ?.profit || 0) -
              (salesReturnAgg[0]
                ?.returnLoss || 0)
            ).toFixed(2)
          ),

          currentStock:
            stockAgg[0]?.stockQty || 0,

          currentStockValue:
            stockAgg[0]
              ?.stockValue || 0,
        });
      }

      return res.status(200).json({
        success: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.error(
        "Net Product Movement Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   TOP PROFIT PRODUCTS
========================================= */
export const getTopProfitProducts =
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

              totalSold: {
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
        "Top Profit Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };