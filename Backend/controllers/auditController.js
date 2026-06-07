import mongoose from "mongoose";

import Product from "../models/Product.js";

import StockLot from "../models/StockLot.js";
import StockTransaction from "../models/StockTransaction.js";

import SaleItem from "../models/SaleItem.js";
import SalesReturnItem from "../models/SalesReturnItem.js";

import PurchaseItem from "../models/PurchaseItem.js";
import PurchaseReturnItem from "../models/PurchaseReturnItem.js";

import Ledger from "../models/Ledger.js";

/* =========================================
   STOCK INTEGRITY AUDIT
========================================= */
export const getStockIntegrityAudit =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         NEGATIVE STOCK LOTS
      ========================================= */

      const negativeLots =
        await StockLot.find({
          store: storeId,

          isDeleted: false,

          remainingQty: {
            $lt: 0,
          },
        }).populate(
          "product",
          "name sku"
        );

      /* =========================================
         OVERFLOW LOTS
      ========================================= */

      const overflowLots =
        await StockLot.find({
          store: storeId,

          isDeleted: false,

          $expr: {
            $gt: [
              "$remainingQty",
              "$quantity",
            ],
          },
        }).populate(
          "product",
          "name sku"
        );

      /* =========================================
         ZERO OR NEGATIVE PURCHASE PRICE
      ========================================= */

      const invalidPriceLots =
        await StockLot.find({
          store: storeId,

          isDeleted: false,

          purchasePrice: {
            $lte: 0,
          },
        }).populate(
          "product",
          "name sku"
        );

      return res.status(200).json({
        success: true,

        data: {
          negativeLots,

          overflowLots,

          invalidPriceLots,
        },
      });
    } catch (error) {
      console.error(
        "Stock Integrity Audit Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   ORPHAN STOCK TRANSACTIONS
========================================= */
export const getOrphanStockTransactions =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const transactions =
        await StockTransaction.aggregate([
          {
            $match: {
              store: storeId,

              isDeleted: false,
            },
          },

          {
            $lookup: {
              from: "stocklots",

              localField: "stockLot",
              foreignField: "_id",

              as: "lot",
            },
          },

          {
            $match: {
              lot: {
                $size: 0,
              },
            },
          },
        ]);

      return res.status(200).json({
        success: true,

        count: transactions.length,

        data: transactions,
      });
    } catch (error) {
      console.error(
        "Orphan Stock Transactions Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PRODUCT STOCK MISMATCH AUDIT
========================================= */
export const getProductStockMismatchAudit =
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
        const productId =
          product._id;

        /* =========================================
           PURCHASED
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
           SOLD
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
              },
            },

            {
              $group: {
                _id: null,

                qty: {
                  $sum:
                    "$remainingQty",
                },
              },
            },
          ]);

        const purchased =
          purchaseAgg[0]?.qty || 0;

        const purchaseReturned =
          purchaseReturnAgg[0]
            ?.qty || 0;

        const sold =
          salesAgg[0]?.qty || 0;

        const salesReturned =
          salesReturnAgg[0]
            ?.qty || 0;

        const actualStock =
          stockAgg[0]?.qty || 0;

        const expectedStock =
          purchased -
          purchaseReturned -
          sold +
          salesReturned;

        const mismatch =
          Number(
            (
              actualStock -
              expectedStock
            ).toFixed(2)
          );

        if (mismatch !== 0) {
          result.push({
            productId,

            name: product.name,

            sku: product.sku,

            purchased,

            purchaseReturned,

            sold,

            salesReturned,

            expectedStock,

            actualStock,

            mismatch,
          });
        }
      }

      return res.status(200).json({
        success: true,

        count: result.length,

        data: result,
      });
    } catch (error) {
      console.error(
        "Product Stock Mismatch Audit Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   LEDGER BALANCE AUDIT
========================================= */
export const getLedgerBalanceAudit =
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

              totalDebit: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$type",
                        "DEBIT",
                      ],
                    },

                    "$amount",

                    0,
                  ],
                },
              },

              totalCredit: {
                $sum: {
                  $cond: [
                    {
                      $eq: [
                        "$type",
                        "CREDIT",
                      ],
                    },

                    "$amount",

                    0,
                  ],
                },
              },
            },
          },

          {
            $project: {
              latestBalance: 1,

              expectedBalance: {
                $subtract: [
                  "$totalDebit",
                  "$totalCredit",
                ],
              },

              mismatch: {
                $subtract: [
                  "$latestBalance",
                  {
                    $subtract: [
                      "$totalDebit",
                      "$totalCredit",
                    ],
                  },
                ],
              },
            },
          },

          {
            $match: {
              mismatch: {
                $ne: 0,
              },
            },
          },
        ]);

      return res.status(200).json({
        success: true,

        count: balances.length,

        data: balances,
      });
    } catch (error) {
      console.error(
        "Ledger Balance Audit Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   INVALID STOCK TRANSACTIONS
========================================= */
export const getInvalidStockTransactions =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const invalidTransactions =
        await StockTransaction.find({
          store: storeId,

          isDeleted: false,

          $or: [
            {
              quantity: 0,
            },

            {
              transactionType: {
                $exists: false,
              },
            },

            {
              direction: {
                $exists: false,
              },
            },
          ],
        })
          .populate(
            "product",
            "name sku"
          )
          .populate(
            "stockLot"
          );

      return res.status(200).json({
        success: true,

        count:
          invalidTransactions.length,

        data: invalidTransactions,
      });
    } catch (error) {
      console.error(
        "Invalid Stock Transactions Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   DEAD STOCK AUDIT
========================================= */
export const getDeadStockAudit =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const days =
        Number(req.query.days) ||
        90;

      const deadStock =
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
              product: 1,

              remainingQty: 1,

              purchasePrice: 1,

              purchaseDate: 1,

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
            $match: {
              ageInDays: {
                $gte: days,
              },
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
              _id: 0,

              productId:
                "$product._id",

              name: "$product.name",

              sku: "$product.sku",

              remainingQty: 1,

              purchasePrice: 1,

              ageInDays: 1,

              stockValue: {
                $multiply: [
                  "$remainingQty",
                  "$purchasePrice",
                ],
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

        count: deadStock.length,

        data: deadStock,
      });
    } catch (error) {
      console.error(
        "Dead Stock Audit Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };