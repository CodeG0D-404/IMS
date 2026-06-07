import mongoose from "mongoose";

import Purchase from "../models/Purchase.js";
import PurchaseItem from "../models/PurchaseItem.js";

import PurchaseReturn from "../models/PurchaseReturn.js";
import PurchaseReturnItem from "../models/PurchaseReturnItem.js";

/* =========================================
   PURCHASE OVERVIEW REPORT
========================================= */
export const getPurchaseOverview =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         GROSS PURCHASES
      ========================================= */

      const purchaseAgg =
        await Purchase.aggregate([
          {
            $match: {
              store: storeId,
              isDeleted: false,
            },
          },

          {
            $group: {
              _id: null,

              grossPurchases: {
                $sum: "$totalAmount",
              },

              totalInvoices: {
                $sum: 1,
              },

              totalPaid: {
                $sum: "$paidAmount",
              },

              totalDue: {
                $sum: "$dueAmount",
              },
            },
          },
        ]);

      /* =========================================
         PURCHASE RETURNS
      ========================================= */

      const returnAgg =
        await PurchaseReturn.aggregate([
          {
            $match: {
              store: storeId,
              isDeleted: false,
            },
          },

          {
            $group: {
              _id: null,

              totalReturns: {
                $sum: "$totalAmount",
              },

              totalReturnInvoices: {
                $sum: 1,
              },
            },
          },
        ]);

      const grossPurchases =
        purchaseAgg[0]
          ?.grossPurchases || 0;

      const totalReturns =
        returnAgg[0]
          ?.totalReturns || 0;

      const netPurchases = Number(
        (
          grossPurchases -
          totalReturns
        ).toFixed(2)
      );

      return res.status(200).json({
        success: true,

        data: {
          grossPurchases,

          totalReturns,

          netPurchases,

          totalInvoices:
            purchaseAgg[0]
              ?.totalInvoices || 0,

          totalReturnInvoices:
            returnAgg[0]
              ?.totalReturnInvoices || 0,

          totalPaid:
            purchaseAgg[0]
              ?.totalPaid || 0,

          totalDue:
            purchaseAgg[0]
              ?.totalDue || 0,
        },
      });
    } catch (error) {
      console.error(
        "Purchase Overview Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PURCHASE TREND REPORT
========================================= */
export const getPurchaseTrend =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const trend =
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
                  $year: "$purchaseDate",
                },

                month: {
                  $month: "$purchaseDate",
                },

                day: {
                  $dayOfMonth:
                    "$purchaseDate",
                },
              },

              grossPurchases: {
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

      return res.status(200).json({
        success: true,
        data: trend,
      });
    } catch (error) {
      console.error(
        "Purchase Trend Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   TOP PURCHASED PRODUCTS
========================================= */
export const getTopPurchasedProducts =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const limit =
        Number(req.query.limit) || 10;

      const products =
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
            $sort: {
              totalPurchased: -1,
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

              totalPurchased: 1,

              purchaseValue: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error(
        "Top Purchased Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   TOP RETURNED PURCHASE PRODUCTS
========================================= */
export const getTopReturnedPurchaseProducts =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const limit =
        Number(req.query.limit) || 10;

      const products =
        await PurchaseReturnItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: "$product",

              totalReturned: {
                $sum: "$quantity",
              },

              returnValue: {
                $sum: "$total",
              },
            },
          },

          {
            $sort: {
              totalReturned: -1,
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

              totalReturned: 1,

              returnValue: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error(
        "Top Returned Purchase Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   NET PURCHASED PRODUCTS
========================================= */
export const getNetPurchasedProducts =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         PURCHASES
      ========================================= */

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

              purchasedQty: {
                $sum: "$quantity",
              },

              grossPurchaseValue: {
                $sum: "$total",
              },
            },
          },
        ]);

      /* =========================================
         RETURNS
      ========================================= */

      const returns =
        await PurchaseReturnItem.aggregate([
          {
            $match: {
              store: storeId,
            },
          },

          {
            $group: {
              _id: "$product",

              returnedQty: {
                $sum: "$quantity",
              },

              returnValue: {
                $sum: "$total",
              },
            },
          },
        ]);

      /* =========================================
         MERGE
      ========================================= */

      const returnMap = {};

      for (const item of returns) {
        returnMap[item._id.toString()] =
          item;
      }

      const finalData = [];

      for (const purchase of purchases) {
        const key =
          purchase._id.toString();

        const returnData =
          returnMap[key] || {};

        const netQty =
          purchase.purchasedQty -
          (returnData.returnedQty || 0);

        const netPurchaseValue =
          purchase.grossPurchaseValue -
          (returnData.returnValue || 0);

        finalData.push({
          product: purchase._id,

          purchasedQty:
            purchase.purchasedQty,

          returnedQty:
            returnData.returnedQty || 0,

          netQty,

          grossPurchaseValue:
            purchase.grossPurchaseValue,

          returnValue:
            returnData.returnValue || 0,

          netPurchaseValue,
        });
      }

      return res.status(200).json({
        success: true,
        count: finalData.length,
        data: finalData,
      });
    } catch (error) {
      console.error(
        "Net Purchased Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PURCHASES BY SUPPLIER
========================================= */
export const getPurchasesBySupplier =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const suppliers =
        await Purchase.aggregate([
          {
            $match: {
              store: storeId,
              isDeleted: false,
            },
          },

          {
            $group: {
              _id: "$party",

              totalPurchases: {
                $sum: "$totalAmount",
              },

              totalInvoices: {
                $sum: 1,
              },

              paidAmount: {
                $sum: "$paidAmount",
              },

              dueAmount: {
                $sum: "$dueAmount",
              },
            },
          },

          {
            $sort: {
              totalPurchases: -1,
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

              supplierId:
                "$party._id",

              name: "$party.name",

              phone: "$party.phone",

              totalPurchases: 1,

              totalInvoices: 1,

              paidAmount: 1,

              dueAmount: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: suppliers,
      });
    } catch (error) {
      console.error(
        "Purchases By Supplier Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };