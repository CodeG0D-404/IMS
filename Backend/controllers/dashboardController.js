import mongoose from "mongoose";

import Sale from "../models/Sale.js";
import Purchase from "../models/Purchase.js";

import SalesReturn from "../models/SalesReturn.js";
import PurchaseReturn from "../models/PurchaseReturn.js";

import SaleItem from "../models/SaleItem.js";
import SalesReturnItem from "../models/SalesReturnItem.js";

import StockLot from "../models/StockLot.js";

import Ledger from "../models/Ledger.js";

/* =========================================
   DASHBOARD SUMMARY (ERP V2)
========================================= */
export const getDashboardSummary = async (
  req,
  res
) => {
  try {
    const storeId =
      new mongoose.Types.ObjectId(
        req.storeId
      );

    /* =========================================
       SALES
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

          totalSalesInvoices: {
            $sum: 1,
          },
        },
      },
    ]);

    const grossSales =
      salesAgg[0]?.grossSales || 0;

    const totalSalesInvoices =
      salesAgg[0]?.totalSalesInvoices || 0;

    /* =========================================
       SALES RETURNS
    ========================================= */

    const salesReturnAgg =
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

            totalSalesReturns: {
              $sum: "$totalAmount",
            },

            totalSalesReturnInvoices: {
              $sum: 1,
            },
          },
        },
      ]);

    const totalSalesReturns =
      salesReturnAgg[0]
        ?.totalSalesReturns || 0;

    const totalSalesReturnInvoices =
      salesReturnAgg[0]
        ?.totalSalesReturnInvoices || 0;

    const netSales = Number(
      (
        grossSales - totalSalesReturns
      ).toFixed(2)
    );

    /* =========================================
       PURCHASES
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

            totalPurchaseInvoices: {
              $sum: 1,
            },
          },
        },
      ]);

    const grossPurchases =
      purchaseAgg[0]?.grossPurchases || 0;

    const totalPurchaseInvoices =
      purchaseAgg[0]
        ?.totalPurchaseInvoices || 0;

    /* =========================================
       PURCHASE RETURNS
    ========================================= */

    const purchaseReturnAgg =
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

            totalPurchaseReturns: {
              $sum: "$totalAmount",
            },

            totalPurchaseReturnInvoices: {
              $sum: 1,
            },
          },
        },
      ]);

    const totalPurchaseReturns =
      purchaseReturnAgg[0]
        ?.totalPurchaseReturns || 0;

    const totalPurchaseReturnInvoices =
      purchaseReturnAgg[0]
        ?.totalPurchaseReturnInvoices || 0;

    const netPurchases = Number(
      (
        grossPurchases -
        totalPurchaseReturns
      ).toFixed(2)
    );

    /* =========================================
       REAL PROFIT
    ========================================= */

    const salesProfitAgg =
      await SaleItem.aggregate([
        {
          $match: {
            store: storeId,
          },
        },

        {
          $group: {
            _id: null,

            totalProfit: {
              $sum: "$profit",
            },
          },
        },
      ]);

    const returnLossAgg =
      await SalesReturnItem.aggregate([
        {
          $match: {
            store: storeId,
          },
        },

        {
          $group: {
            _id: null,

            totalReturnLoss: {
              $sum: "$profitLoss",
            },
          },
        },
      ]);

    const grossProfit =
      salesProfitAgg[0]?.totalProfit || 0;

    const totalReturnLoss =
      returnLossAgg[0]
        ?.totalReturnLoss || 0;

    const netProfit = Number(
      (
        grossProfit - totalReturnLoss
      ).toFixed(2)
    );

    /* =========================================
       INVENTORY VALUE
    ========================================= */

    const inventoryAgg =
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
            inventoryValue: {
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

            totalInventoryValue: {
              $sum: "$inventoryValue",
            },
          },
        },
      ]);

    const totalInventoryValue =
      Number(
        (
          inventoryAgg[0]
            ?.totalInventoryValue || 0
        ).toFixed(2)
      );

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
       PAYABLES / RECEIVABLES
    ========================================= */

    const ledgerAgg =
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

    for (const item of ledgerAgg) {
      if (item.latestBalance > 0) {
        receivables +=
          item.latestBalance;
      } else {
        payables += Math.abs(
          item.latestBalance
        );
      }
    }

    receivables = Number(
      receivables.toFixed(2)
    );

    payables = Number(
      payables.toFixed(2)
    );

    /* =========================================
       RESPONSE
    ========================================= */

    return res.status(200).json({
      success: true,

      data: {
        sales: {
          grossSales,
          totalSalesReturns,
          netSales,

          totalSalesInvoices,
          totalSalesReturnInvoices,
        },

        purchases: {
          grossPurchases,
          totalPurchaseReturns,
          netPurchases,

          totalPurchaseInvoices,
          totalPurchaseReturnInvoices,
        },

        profit: {
          grossProfit,
          totalReturnLoss,
          netProfit,
        },

        inventory: {
          totalInventoryValue,
          lowStockCount,
        },

        finance: {
          receivables,
          payables,
        },
      },
    });
  } catch (error) {
    console.error(
      "Dashboard Summary Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   PROFIT SUMMARY
========================================= */
export const getProfitSummary = async (
  req,
  res
) => {
  try {
    const storeId =
      new mongoose.Types.ObjectId(
        req.storeId
      );

    const todayStart = new Date();

    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(
      todayStart.getFullYear(),
      todayStart.getMonth(),
      1
    );

    /* =========================================
       TODAY PROFIT
    ========================================= */

    const todayProfitAgg =
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

            "saleData.createdAt": {
              $gte: todayStart,
            },

            "saleData.isDeleted": false,
          },
        },

        {
          $group: {
            _id: null,

            totalProfit: {
              $sum: "$profit",
            },
          },
        },
      ]);

    const todayProfit =
      todayProfitAgg[0]
        ?.totalProfit || 0;

    /* =========================================
       MONTH PROFIT
    ========================================= */

    const monthProfitAgg =
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

            "saleData.createdAt": {
              $gte: monthStart,
            },

            "saleData.isDeleted": false,
          },
        },

        {
          $group: {
            _id: null,

            totalProfit: {
              $sum: "$profit",
            },
          },
        },
      ]);

    const monthlyProfit =
      monthProfitAgg[0]
        ?.totalProfit || 0;

    /* =========================================
       TOTAL PROFIT
    ========================================= */

    const totalProfitAgg =
      await SaleItem.aggregate([
        {
          $match: {
            store: storeId,
          },
        },

        {
          $group: {
            _id: null,

            totalProfit: {
              $sum: "$profit",
            },
          },
        },
      ]);

    const totalProfit =
      totalProfitAgg[0]
        ?.totalProfit || 0;

    return res.status(200).json({
      success: true,

      data: {
        todayProfit: Number(
          todayProfit.toFixed(2)
        ),

        monthlyProfit: Number(
          monthlyProfit.toFixed(2)
        ),

        totalProfit: Number(
          totalProfit.toFixed(2)
        ),
      },
    });
  } catch (error) {
    console.error(
      "Profit Summary Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   SALES VS PURCHASE
========================================= */
export const getSalesVsPurchase =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const sales =
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
                  $year: "$createdAt",
                },

                month: {
                  $month: "$createdAt",
                },
              },

              totalSales: {
                $sum: "$totalAmount",
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
                  $year: "$createdAt",
                },

                month: {
                  $month: "$createdAt",
                },
              },

              totalPurchase: {
                $sum: "$totalAmount",
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
          sales,
          purchases,
        },
      });
    } catch (error) {
      console.error(
        "Sales Vs Purchase Error:",
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
        Number(req.query.limit) || 5;

      const topProducts =
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

              totalSold: 1,
              revenue: 1,
              profit: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: topProducts,
      });
    } catch (error) {
      console.error(
        "Top Products Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };