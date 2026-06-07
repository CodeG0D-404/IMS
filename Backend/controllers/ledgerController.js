import mongoose from "mongoose";

import Ledger from "../models/Ledger.js";
import Party from "../models/Party.js";

/* =========================================
   GET PARTY LEDGER (FULL HISTORY)
========================================= */
export const getPartyLedger = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { partyId } = req.params;

    const entries = await Ledger.find({
      store: storeId,
      party: partyId,
      isDeleted: false,
    })
      .sort({ createdAt: 1 })
      .populate("referenceId");

    return res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });

  } catch (error) {
    console.error("Party Ledger Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET PARTY BALANCE
========================================= */
export const getPartyBalance = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { partyId } = req.params;

    /* =========================
       GET LATEST LEDGER ENTRY
    ========================= */
    const lastEntry = await Ledger.findOne({
      store: storeId,
      party: partyId,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    const balance = lastEntry
      ? Number(lastEntry.balance)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        balance,
      },
    });

  } catch (error) {
    console.error("Party Balance Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET ALL PARTY BALANCES
========================================= */
export const getAllPartyBalances = async (req, res) => {
  try {
    const storeId = req.storeId;

    /* =========================
       GET ALL PARTIES
    ========================= */
    const parties = await Party.find({
      store: storeId,
      isDeleted: false,
    }).select("name phone");

    /* =========================
       BUILD BALANCE LIST
    ========================= */
    const balances = [];

    for (const party of parties) {

      const lastEntry = await Ledger.findOne({
        store: storeId,
        party: party._id,
        isDeleted: false,
      }).sort({ createdAt: -1 });

      balances.push({
        partyId: party._id,
        name: party.name,
        phone: party.phone,
        balance: lastEntry
          ? Number(lastEntry.balance)
          : 0,
      });
    }

    /* =========================
       SORT BY BALANCE
    ========================= */
    balances.sort((a, b) => b.balance - a.balance);

    return res.status(200).json({
      success: true,
      count: balances.length,
      data: balances,
    });

  } catch (error) {
    console.error("All Balances Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   LEDGER SUMMARY
========================================= */
export const getLedgerSummary = async (req, res) => {
  try {
    const storeId = req.storeId;

    /* =========================
       GET ALL PARTIES
    ========================= */
    const parties = await Party.find({
      store: storeId,
      isDeleted: false,
    }).select("_id");

    let totalReceivable = 0;
    let totalPayable = 0;

    /* =========================
       CALCULATE NET BALANCES
    ========================= */
    for (const party of parties) {

      const lastEntry = await Ledger.findOne({
        store: storeId,
        party: party._id,
        isDeleted: false,
      }).sort({ createdAt: -1 });

      const balance = lastEntry
        ? Number(lastEntry.balance)
        : 0;

      // Positive = receivable
      if (balance > 0) {
        totalReceivable += balance;
      }

      // Negative = payable
      if (balance < 0) {
        totalPayable += Math.abs(balance);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        totalReceivable,
        totalPayable,
        netBalance: totalReceivable - totalPayable,
      },
    });

  } catch (error) {
    console.error("Ledger Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================================
   SALES PAYMENT MODES
========================================= */
export const getSalesPaymentModes = async (
  req,
  res
) => {
  try {

    const entries = await Ledger.find({
      store: req.storeId,
      entryType: "SALE",
      isDeleted: false,
    }).select(
      "referenceId paymentMode"
    );

    return res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });

  } catch (error) {

    console.error(
      "Sales Payment Modes Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* =========================================
   PURCHASE PAYMENT MODES
========================================= */
export const getPurchasePaymentModes = async (
  req,
  res
) => {
  try {

    const entries = await Ledger.find({
      store: req.storeId,
      entryType: "PURCHASE",
      isDeleted: false,
    }).select(
      "referenceId paymentMode"
    );

    return res.status(200).json({
      success: true,
      count: entries.length,
      data: entries,
    });

  } catch (error) {

    console.error(
      "Purchase Payment Modes Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};