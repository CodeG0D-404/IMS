import mongoose from "mongoose";

import Sale from "../models/Sale.js";
import SaleItem from "../models/SaleItem.js";

import SalesReturn from "../models/SalesReturn.js";
import SalesReturnItem from "../models/SalesReturnItem.js";

/* =========================================
   SALES OVERVIEW REPORT
========================================= */
export const getSalesOverview = async (
  req,
  res
) => {
  try {
    const storeId =
      new mongoose.Types.ObjectId(
        req.storeId
      );

    /* =========================================
       GROSS SALES
    ========================================= */

    const salesAgg = await Sale.aggregate([
      {
        $match: {
          store: storeId,
          isDeleted: false,
        },
      },

      {
        $group: {
          _id: null,

          grossSales: {
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
       SALES RETURNS
    ========================================= */

    const returnsAgg =
      await SalesReturn.aggregate([
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

    const grossSales =
      salesAgg[0]?.grossSales || 0;

    const totalReturns =
      returnsAgg[0]?.totalReturns || 0;

    const netSales = Number(
      (
        grossSales - totalReturns
      ).toFixed(2)
    );

    /* =========================================
       RESPONSE
    ========================================= */

    return res.status(200).json({
      success: true,

      data: {
        grossSales,

        totalReturns,

        netSales,

        totalInvoices:
          salesAgg[0]?.totalInvoices || 0,

        totalReturnInvoices:
          returnsAgg[0]
            ?.totalReturnInvoices || 0,

        totalPaid:
          salesAgg[0]?.totalPaid || 0,

        totalDue:
          salesAgg[0]?.totalDue || 0,
      },
    });
  } catch (error) {
    console.error(
      "Sales Overview Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   SALES TREND REPORT
========================================= */
export const getSalesTrend = async (
  req,
  res
) => {
  try {
    const storeId =
      new mongoose.Types.ObjectId(
        req.storeId
      );

    const trend = await Sale.aggregate([
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
              $dayOfMonth: "$saleDate",
            },
          },

          grossSales: {
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
      "Sales Trend Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   TOP SELLING PRODUCTS
========================================= */
export const getTopSellingProducts =
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

              productId: "$product._id",

              name: "$product.name",

              sku: "$product.sku",

              totalSold: 1,

              revenue: 1,

              profit: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error(
        "Top Selling Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   TOP RETURNED PRODUCTS
========================================= */
export const getTopReturnedProducts =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const limit =
        Number(req.query.limit) || 10;

      const products =
        await SalesReturnItem.aggregate([
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
                $sum: "$totalRevenue",
              },

              returnLoss: {
                $sum: "$profitLoss",
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

              productId: "$product._id",

              name: "$product.name",

              sku: "$product.sku",

              totalReturned: 1,

              returnValue: 1,

              returnLoss: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      console.error(
        "Top Returned Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   NET PRODUCT SALES
========================================= */
export const getNetProductSales =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         SALES
      ========================================= */

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

              soldQty: {
                $sum: "$quantity",
              },

              grossRevenue: {
                $sum: "$totalRevenue",
              },

              grossProfit: {
                $sum: "$profit",
              },
            },
          },
        ]);

      /* =========================================
         RETURNS
      ========================================= */

      const returns =
        await SalesReturnItem.aggregate([
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

              returnRevenue: {
                $sum: "$totalRevenue",
              },

              returnLoss: {
                $sum: "$profitLoss",
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

      for (const sale of sales) {
        const key =
          sale._id.toString();

        const returnData =
          returnMap[key] || {};

        const netQty =
          sale.soldQty -
          (returnData.returnedQty || 0);

        const netRevenue =
          sale.grossRevenue -
          (returnData.returnRevenue || 0);

        const netProfit =
          sale.grossProfit -
          (returnData.returnLoss || 0);

        finalData.push({
          product: sale._id,

          soldQty: sale.soldQty,

          returnedQty:
            returnData.returnedQty || 0,

          netQty,

          grossRevenue:
            sale.grossRevenue,

          returnRevenue:
            returnData.returnRevenue || 0,

          netRevenue,

          grossProfit:
            sale.grossProfit,

          returnLoss:
            returnData.returnLoss || 0,

          netProfit,
        });
      }

      return res.status(200).json({
        success: true,
        count: finalData.length,
        data: finalData,
      });
    } catch (error) {
      console.error(
        "Net Product Sales Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   SALES BY CUSTOMER
========================================= */
export const getSalesByCustomer =
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
              totalSales: -1,
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

              phone: "$party.phone",

              totalSales: 1,

              totalInvoices: 1,

              paidAmount: 1,

              dueAmount: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error) {
      console.error(
        "Sales By Customer Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };