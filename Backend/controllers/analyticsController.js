import mongoose from "mongoose";

import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";

import Purchase from "../models/Purchase.js";

import StockLot from "../models/StockLot.js";

import Ledger from "../models/Ledger.js";

/* =========================================
   SALES ANALYTICS
========================================= */
export const getSalesAnalytics =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         DAILY SALES TREND
      ========================================= */

      const dailySales =
        await Sale.aggregate([
          {
            $match: {
              store: storeId,
              isDeleted: false,
            },
          },

          {
            $group: {
              _id: {
                year: {
                  $year: "$saleDate",
                },

                month: {
                  $month: "$saleDate",
                },

                day: {
                  $dayOfMonth:
                    "$saleDate",
                },
              },

              totalSales: {
                $sum: "$totalAmount",
              },

              totalInvoices: {
                $sum: 1,
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

      /* =========================================
         MONTHLY SALES TREND
      ========================================= */

      const monthlySales =
        await Sale.aggregate([
          {
            $match: {
              store: storeId,
              isDeleted: false,
            },
          },

          {
            $group: {
              _id: {
                year: {
                  $year: "$saleDate",
                },

                month: {
                  $month: "$saleDate",
                },
              },

              totalSales: {
                $sum: "$totalAmount",
              },

              totalInvoices: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              "_id.year": 1,
              "_id.month": 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,

        data: {
          dailySales,
          monthlySales,
        },
      });
    } catch (error) {
      console.error(
        "Sales Analytics Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PRODUCT ANALYTICS
========================================= */
export const getProductAnalytics =
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

              totalQty: {
                $sum: "$quantity",
              },

              totalRevenue: {
                $sum:
                  "$totalRevenue",
              },

              totalProfit: {
                $sum: "$profit",
              },

              averageSellingPrice: {
                $avg: "$price",
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

              totalRevenue: 1,

              totalProfit: 1,

              averageSellingPrice:
                {
                  $round: [
                    "$averageSellingPrice",
                    2,
                  ],
                },
            },
          },

          {
            $sort: {
              totalRevenue: -1,
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
        "Product Analytics Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   INVENTORY ANALYTICS
========================================= */
export const getInventoryAnalytics =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const inventory =
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

              averagePurchasePrice:
                {
                  $avg:
                    "$purchasePrice",
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

              stockValue: 1,

              averagePurchasePrice:
                {
                  $round: [
                    "$averagePurchasePrice",
                    2,
                  ],
                },
            },
          },

          {
            $sort: {
              stockValue: -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        count: inventory.length,
        data: inventory,
      });
    } catch (error) {
      console.error(
        "Inventory Analytics Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PURCHASE ANALYTICS
========================================= */
export const getPurchaseAnalytics =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const purchases =
        await Purchase.aggregate([
          {
            $match: {
              store: storeId,
              isDeleted: false,
            },
          },

          {
            $group: {
              _id: {
                year: {
                  $year:
                    "$purchaseDate",
                },

                month: {
                  $month:
                    "$purchaseDate",
                },
              },

              totalPurchases: {
                $sum: "$totalAmount",
              },

              totalInvoices: {
                $sum: 1,
              },

              averagePurchaseValue:
                {
                  $avg:
                    "$totalAmount",
                },
            },
          },

          {
            $sort: {
              "_id.year": 1,
              "_id.month": 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: purchases,
      });
    } catch (error) {
      console.error(
        "Purchase Analytics Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   CUSTOMER ANALYTICS
========================================= */
export const getCustomerAnalytics =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const customers =
        await Sale.aggregate([
          {
            $match: {
              store: storeId,
              isDeleted: false,
            },
          },

          {
            $group: {
              _id: "$party",

              totalSales: {
                $sum: "$totalAmount",
              },

              totalInvoices: {
                $sum: 1,
              },

              averageInvoiceValue:
                {
                  $avg:
                    "$totalAmount",
                },
            },
          },

          {
            $lookup: {
              from: "parties",

              localField: "_id",
              foreignField: "_id",

              as: "party",
            },
          },

          {
            $unwind: "$party",
          },

          {
            $project: {
              _id: 0,

              customerId:
                "$party._id",

              name: "$party.name",

              phone:
                "$party.phone",

              totalSales: 1,

              totalInvoices: 1,

              averageInvoiceValue:
                {
                  $round: [
                    "$averageInvoiceValue",
                    2,
                  ],
                },
            },
          },

          {
            $sort: {
              totalSales: -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        count: customers.length,
        data: customers,
      });
    } catch (error) {
      console.error(
        "Customer Analytics Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   FINANCIAL ANALYTICS
========================================= */
export const getFinancialAnalytics =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const balances =
        await Ledger.aggregate([
          {
            $match: {
              store: storeId,

              isDeleted: false,
            },
          },

          {
            $sort: {
              transactionDate: 1,
            },
          },

          {
            $group: {
              _id: "$party",

              latestBalance: {
                $last: "$balance",
              },
            },
          },
        ]);

      let receivables = 0;
      let payables = 0;

      for (const item of balances) {
        if (item.latestBalance > 0) {
          receivables +=
            item.latestBalance;
        } else {
          payables += Math.abs(
            item.latestBalance
          );
        }
      }

      return res.status(200).json({
        success: true,

        data: {
          receivables: Number(
            receivables.toFixed(2)
          ),

          payables: Number(
            payables.toFixed(2)
          ),

          netExposure: Number(
            (
              receivables -
              payables
            ).toFixed(2)
          ),
        },
      });
    } catch (error) {
      console.error(
        "Financial Analytics Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };