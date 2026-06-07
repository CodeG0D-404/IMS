import express from "express";

import {
  getDashboardSummary,
  getProfitSummary,
  getSalesVsPurchase,
  getTopSellingProducts,
} from "../controllers/dashboardController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   DASHBOARD ROUTES
========================================= */

// Dashboard summary
router.get(
  "/summary",
  allowRoles("ADMIN", "EMPLOYEE"),
  getDashboardSummary
);

// Profit summary
router.get(
  "/profit-summary",
  allowRoles("ADMIN", "EMPLOYEE"),
  getProfitSummary
);

// Sales vs purchase chart
router.get(
  "/sales-vs-purchase",
  allowRoles("ADMIN", "EMPLOYEE"),
  getSalesVsPurchase
);

// Top selling products
router.get(
  "/top-products",
  allowRoles("ADMIN", "EMPLOYEE"),
  getTopSellingProducts
);

export default router;