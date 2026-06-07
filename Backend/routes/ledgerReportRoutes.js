import express from "express";

import {
  getLedgerOverview,
  getPartyBalances,
  getPartyLedgerHistory,
  getReceivables,
  getPayables,
  getLedgerTransactionSummary,
  getPaymentModeSummary,
} from "../controllers/ledgerReportController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   LEDGER REPORTS
========================================= */

// Ledger overview
router.get(
  "/overview",
  allowRoles("ADMIN", "EMPLOYEE"),
  getLedgerOverview
);

// Party balances
router.get(
  "/party-balances",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPartyBalances
);

// Single party ledger history
router.get(
  "/party/:partyId",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPartyLedgerHistory
);

// Receivables
router.get(
  "/receivables",
  allowRoles("ADMIN", "EMPLOYEE"),
  getReceivables
);

// Payables
router.get(
  "/payables",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPayables
);

// Ledger transaction summary
router.get(
  "/transaction-summary",
  allowRoles("ADMIN", "EMPLOYEE"),
  getLedgerTransactionSummary
);

/* =========================================
   PAYMENT MODE SUMMARY
========================================= */
router.get(
  "/payment-modes",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPaymentModeSummary
);

export default router;