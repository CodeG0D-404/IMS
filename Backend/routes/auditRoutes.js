import express from "express";

import {
  getStockIntegrityAudit,
  getOrphanStockTransactions,
  getProductStockMismatchAudit,
  getLedgerBalanceAudit,
  getInvalidStockTransactions,
  getDeadStockAudit,
} from "../controllers/auditController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   AUDIT ROUTES
========================================= */

// Stock integrity audit
router.get(
  "/stock-integrity",
  allowRoles("ADMIN"),
  getStockIntegrityAudit
);

// Orphan stock transactions
router.get(
  "/orphan-transactions",
  allowRoles("ADMIN"),
  getOrphanStockTransactions
);

// Product stock mismatch audit
router.get(
  "/stock-mismatch",
  allowRoles("ADMIN"),
  getProductStockMismatchAudit
);

// Ledger balance audit
router.get(
  "/ledger-balance",
  allowRoles("ADMIN"),
  getLedgerBalanceAudit
);

// Invalid stock transactions
router.get(
  "/invalid-transactions",
  allowRoles("ADMIN"),
  getInvalidStockTransactions
);

// Dead stock audit
router.get(
  "/dead-stock",
  allowRoles("ADMIN"),
  getDeadStockAudit
);

export default router;