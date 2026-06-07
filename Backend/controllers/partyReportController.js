import mongoose from "mongoose";

import Party from "../models/Party.js";

import Sale from "../models/Sale.js";
import Purchase from "../models/Purchase.js";

import SalesReturn from "../models/SalesReturn.js";
import PurchaseReturn from "../models/PurchaseReturn.js";

import Ledger from "../models/Ledger.js";

/* =========================================
   PARTY OVERVIEW
========================================= */
export const getPartyOverview =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         TOTAL PARTIES
      ========================================= */

      const totalParties =
        await Party.countDocuments({
          store: storeId,
          isDeleted: false,
        });

      const customers =
        await Party.countDocuments({
          store: storeId,
          isDeleted: false,
          types: "CUSTOMER",
        });

      const suppliers =
        await Party.countDocuments({
          store: storeId,
          isDeleted: false,
          type: "SUPPLIER",
        });

      /* =========================================
         LEDGER BALANCES
      ========================================= */

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
          totalParties,

          customers,

          suppliers,

          receivables: Number(
            receivables.toFixed(2)
          ),

          payables: Number(
            payables.toFixed(2)
          ),
        },
      });
    } catch (error) {
      console.error(
        "Party Overview Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PARTY SUMMARY
========================================= */
export const getPartySummary =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const parties =
        await Party.find({
          store: storeId,
          isDeleted: false,
        });

      const result = [];

      for (const party of parties) {
        const partyId = party._id;

        /* =========================================
           SALES
        ========================================= */

        const salesAgg =
          await Sale.aggregate([
            {
              $match: {
                store: storeId,
                party: partyId,
                isDeleted: false,
              },
            },

            {
              $group: {
                _id: null,

                totalSales: {
                  $sum:
                    "$totalAmount",
                },

                totalPaid: {
                  $sum:
                    "$paidAmount",
                },

                totalDue: {
                  $sum:
                    "$dueAmount",
                },

                totalInvoices: {
                  $sum: 1,
                },
              },
            },
          ]);

        /* =========================================
           SALES RETURNS
        ========================================= */

        const salesReturnAgg =
          await SalesReturn.aggregate([
            {
              $match: {
                store: storeId,
                party: partyId,
                isDeleted: false,
              },
            },

            {
              $group: {
                _id: null,

                totalReturns: {
                  $sum:
                    "$totalAmount",
                },

                totalReturnInvoices:
                  {
                    $sum: 1,
                  },
              },
            },
          ]);

        /* =========================================
           PURCHASES
        ========================================= */

        const purchaseAgg =
          await Purchase.aggregate([
            {
              $match: {
                store: storeId,
                party: partyId,
                isDeleted: false,
              },
            },

            {
              $group: {
                _id: null,

                totalPurchases: {
                  $sum:
                    "$totalAmount",
                },

                totalPaid: {
                  $sum:
                    "$paidAmount",
                },

                totalDue: {
                  $sum:
                    "$dueAmount",
                },

                totalInvoices: {
                  $sum: 1,
                },
              },
            },
          ]);

        /* =========================================
           PURCHASE RETURNS
        ========================================= */

        const purchaseReturnAgg =
          await PurchaseReturn.aggregate([
            {
              $match: {
                store: storeId,
                party: partyId,
                isDeleted: false,
              },
            },

            {
              $group: {
                _id: null,

                totalReturns: {
                  $sum:
                    "$totalAmount",
                },

                totalReturnInvoices:
                  {
                    $sum: 1,
                  },
              },
            },
          ]);

        /* =========================================
           LATEST LEDGER BALANCE
        ========================================= */

        const latestLedger =
          await Ledger.findOne({
            store: storeId,
            party: partyId,
            isDeleted: false,
          }).sort({
            transactionDate: -1,
          });

        result.push({
          partyId,

          name: party.name,

          phone: party.phone,

          type: party.type,

          sales: {
            totalSales:
              salesAgg[0]
                ?.totalSales || 0,

            totalPaid:
              salesAgg[0]
                ?.totalPaid || 0,

            totalDue:
              salesAgg[0]
                ?.totalDue || 0,

            totalInvoices:
              salesAgg[0]
                ?.totalInvoices || 0,

            totalReturns:
              salesReturnAgg[0]
                ?.totalReturns || 0,

            totalReturnInvoices:
              salesReturnAgg[0]
                ?.totalReturnInvoices ||
              0,
          },

          purchases: {
            totalPurchases:
              purchaseAgg[0]
                ?.totalPurchases ||
              0,

            totalPaid:
              purchaseAgg[0]
                ?.totalPaid || 0,

            totalDue:
              purchaseAgg[0]
                ?.totalDue || 0,

            totalInvoices:
              purchaseAgg[0]
                ?.totalInvoices || 0,

            totalReturns:
              purchaseReturnAgg[0]
                ?.totalReturns || 0,

            totalReturnInvoices:
              purchaseReturnAgg[0]
                ?.totalReturnInvoices ||
              0,
          },

          ledgerBalance:
            latestLedger?.balance || 0,
        });
      }

      return res.status(200).json({
        success: true,
        count: result.length,
        data: result,
      });
    } catch (error) {
      console.error(
        "Party Summary Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   SINGLE PARTY REPORT
========================================= */
export const getSinglePartyReport =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const { partyId } =
        req.params;

      const party =
        await Party.findOne({
          _id: partyId,
          store: storeId,
          isDeleted: false,
        });

      if (!party) {
        return res.status(404).json({
          success: false,
          message: "Party not found",
        });
      }

      /* =========================================
         SALES
      ========================================= */

      const sales =
        await Sale.find({
          store: storeId,
          party: partyId,
          isDeleted: false,
        }).sort({
          createdAt: -1,
        });

      /* =========================================
         PURCHASES
      ========================================= */

      const purchases =
        await Purchase.find({
          store: storeId,
          party: partyId,
          isDeleted: false,
        }).sort({
          createdAt: -1,
        });

      /* =========================================
         SALES RETURNS
      ========================================= */

      const salesReturns =
        await SalesReturn.find({
          store: storeId,
          party: partyId,
          isDeleted: false,
        }).sort({
          createdAt: -1,
        });

      /* =========================================
         PURCHASE RETURNS
      ========================================= */

      const purchaseReturns =
        await PurchaseReturn.find({
          store: storeId,
          party: partyId,
          isDeleted: false,
        }).sort({
          createdAt: -1,
        });

      /* =========================================
         LEDGER
      ========================================= */

      const ledger =
        await Ledger.find({
          store: storeId,
          party: partyId,
          isDeleted: false,
        }).sort({
          transactionDate: 1,
        });

      return res.status(200).json({
        success: true,

        data: {
          party,

          sales,

          purchases,

          salesReturns,

          purchaseReturns,

          ledger,
        },
      });
    } catch (error) {
      console.error(
        "Single Party Report Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   TOP CUSTOMERS
========================================= */
export const getTopCustomers =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const limit =
        Number(req.query.limit) || 10;

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
                $sum:
                  "$totalAmount",
              },

              totalInvoices: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              totalSales: -1,
            },
          },

          {
            $limit: limit,
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

              partyId:
                "$party._id",

              name: "$party.name",

              phone:
                "$party.phone",

              totalSales: 1,

              totalInvoices: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: customers,
      });
    } catch (error) {
      console.error(
        "Top Customers Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   TOP SUPPLIERS
========================================= */
export const getTopSuppliers =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const limit =
        Number(req.query.limit) || 10;

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
                $sum:
                  "$totalAmount",
              },

              totalInvoices: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              totalPurchases: -1,
            },
          },

          {
            $limit: limit,
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

              partyId:
                "$party._id",

              name: "$party.name",

              phone:
                "$party.phone",

              totalPurchases: 1,

              totalInvoices: 1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: suppliers,
      });
    } catch (error) {
      console.error(
        "Top Suppliers Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };