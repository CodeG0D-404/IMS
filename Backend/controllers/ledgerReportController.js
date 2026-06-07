import mongoose from "mongoose";

import Ledger from "../models/Ledger.js";

/* =========================================
   LEDGER OVERVIEW
========================================= */
export const getLedgerOverview =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      /* =========================================
         PARTY BALANCES
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

      receivables = Number(
        receivables.toFixed(2)
      );

      payables = Number(
        payables.toFixed(2)
      );

      return res.status(200).json({
        success: true,

        data: {
          receivables,
          payables,

          totalParties:
            balances.length,
        },
      });
    } catch (error) {
      console.error(
        "Ledger Overview Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PARTY BALANCES
========================================= */
export const getPartyBalances =
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

              lastTransactionDate: {
                $last:
                  "$transactionDate",
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

              partyId:
                "$party._id",

              name: "$party.name",

              phone:
                "$party.phone",

              type: "$party.type",

              latestBalance: 1,

              lastTransactionDate: 1,
            },
          },

          {
            $sort: {
              latestBalance: -1,
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
        "Party Balances Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PARTY LEDGER HISTORY
========================================= */
export const getPartyLedgerHistory =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const { partyId } =
        req.params;

      const ledger =
        await Ledger.find({
          store: storeId,

          party: partyId,

          isDeleted: false,
        })
          .populate(
            "party",
            "name phone type"
          )
          .sort({
            transactionDate: 1,
          });

      return res.status(200).json({
        success: true,

        count: ledger.length,

        data: ledger,
      });
    } catch (error) {
      console.error(
        "Party Ledger History Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   RECEIVABLES REPORT
========================================= */
export const getReceivables =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const receivables =
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

          {
            $match: {
              latestBalance: {
                $gt: 0,
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

              partyId:
                "$party._id",

              name: "$party.name",

              phone:
                "$party.phone",

              balance:
                "$latestBalance",
            },
          },

          {
            $sort: {
              balance: -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        count:
          receivables.length,
        data: receivables,
      });
    } catch (error) {
      console.error(
        "Receivables Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   PAYABLES REPORT
========================================= */
export const getPayables =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const payables =
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

          {
            $match: {
              latestBalance: {
                $lt: 0,
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

              partyId:
                "$party._id",

              name: "$party.name",

              phone:
                "$party.phone",

              balance: {
                $abs:
                  "$latestBalance",
              },
            },
          },

          {
            $sort: {
              balance: -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        count: payables.length,
        data: payables,
      });
    } catch (error) {
      console.error(
        "Payables Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

/* =========================================
   LEDGER TRANSACTION SUMMARY
========================================= */
export const getLedgerTransactionSummary =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const summary =
        await Ledger.aggregate([
          {
            $match: {
              store: storeId,
              isDeleted: false,
            },
          },

          {
            $group: {
              _id: "$type",

              totalAmount: {
                $sum: "$amount",
              },

              totalTransactions: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              totalAmount: -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      console.error(
        "Ledger Transaction Summary Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };

  /* =========================================
   PAYMENT MODE SUMMARY
========================================= */
export const getPaymentModeSummary =
  async (req, res) => {
    try {
      const storeId =
        new mongoose.Types.ObjectId(
          req.storeId
        );

      const summary =
        await Ledger.aggregate([
          {
            $match: {
              store: storeId,
              isDeleted: false,

              paymentMode: {
                $exists: true,
                $ne: null,
              },
            },
          },

          {
            $group: {
              _id: "$paymentMode",

              totalAmount: {
                $sum: "$amount",
              },

              transactions: {
                $sum: 1,
              },
            },
          },

          {
            $sort: {
              totalAmount: -1,
            },
          },
        ]);

      return res.status(200).json({
        success: true,
        data: summary,
      });

    } catch (error) {
      console.error(
        "Payment Mode Summary Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };