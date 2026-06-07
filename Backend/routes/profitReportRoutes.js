import express from "express";

import {
  getProfitOverview,
  getProfitTrend,
  getProductProfitReport,
  getNetProductProfitReport,
  getLossReport,
  getMostProfitableProducts,
} from "../controllers/profitReportController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   PROFIT REPORTS
========================================= */

// Profit overview
router.get(
  "/overview",
  allowRoles("ADMIN", "EMPLOYEE"),
  getProfitOverview
);

// Profit trend
router.get(
  "/trend",
  allowRoles("ADMIN", "EMPLOYEE"),
  getProfitTrend
);

// Product profit report
router.get(
  "/products",
  allowRoles("ADMIN", "EMPLOYEE"),
  getProductProfitReport
);

// Net product profit report
router.get(
  "/net-products",
  allowRoles("ADMIN", "EMPLOYEE"),
  getNetProductProfitReport
);

// Loss report
router.get(
  "/losses",
  allowRoles("ADMIN", "EMPLOYEE"),
  getLossReport
);

// Most profitable products
router.get(
  "/top-products",
  allowRoles("ADMIN", "EMPLOYEE"),
  getMostProfitableProducts
);

export default router;