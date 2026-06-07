import express from "express";

import {
  getPartyOverview,
  getPartySummary,
  getSinglePartyReport,
  getTopCustomers,
  getTopSuppliers,
} from "../controllers/partyReportController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   PARTY REPORTS
========================================= */

// Party overview
router.get(
  "/overview",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPartyOverview
);

// Party summary
router.get(
  "/summary",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPartySummary
);

// Top customers
router.get(
  "/top-customers",
  allowRoles("ADMIN", "EMPLOYEE"),
  getTopCustomers
);

// Top suppliers
router.get(
  "/top-suppliers",
  allowRoles("ADMIN", "EMPLOYEE"),
  getTopSuppliers
);

// Single party report
router.get(
  "/:partyId",
  allowRoles("ADMIN", "EMPLOYEE"),
  getSinglePartyReport
);

export default router;