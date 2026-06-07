import express from "express";

import {
  getPartyLedger,
  getPartyBalance,
  getAllPartyBalances,
  getLedgerSummary,
  getSalesPaymentModes,
  getPurchasePaymentModes,
} from "../controllers/ledgerController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   APPLY MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   LEDGER SUMMARY (OVERALL BUSINESS)
   GET /api/ledger/summary
========================================= */
router.get(
  "/summary",
  allowRoles("ADMIN", "EMPLOYEE"),
  getLedgerSummary
);

/* =========================================
   ALL PARTY BALANCES
   GET /api/ledger/balances
========================================= */
router.get(
  "/balances",
  allowRoles("ADMIN", "EMPLOYEE"),
  getAllPartyBalances
);

/* =========================================
   PARTY LEDGER (FULL HISTORY)
   GET /api/ledger/party/:partyId
========================================= */
router.get(
  "/party/:partyId",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPartyLedger
);

/* =========================================
   PARTY BALANCE (SINGLE)
   GET /api/ledger/party/:partyId/balance
========================================= */
router.get(
  "/party/:partyId/balance",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPartyBalance
);

/* =========================================
   SALES PAYMENT MODES
   GET /api/ledger/sales-payment-modes
========================================= */
router.get(
  "/sales-payment-modes",
  allowRoles("ADMIN", "EMPLOYEE"),
  getSalesPaymentModes
);

router.get(
  "/purchase-payment-modes",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPurchasePaymentModes
);

export default router;