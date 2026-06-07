import express from "express";

import {
  getSalesAnalytics,
  getProductAnalytics,
  getInventoryAnalytics,
  getPurchaseAnalytics,
  getCustomerAnalytics,
  getFinancialAnalytics,
} from "../controllers/analyticsController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   ANALYTICS ROUTES
========================================= */

// Sales analytics
router.get(
  "/sales",
  allowRoles("ADMIN", "EMPLOYEE"),
  getSalesAnalytics
);

// Product analytics
router.get(
  "/products",
  allowRoles("ADMIN", "EMPLOYEE"),
  getProductAnalytics
);

// Inventory analytics
router.get(
  "/inventory",
  allowRoles("ADMIN", "EMPLOYEE"),
  getInventoryAnalytics
);

// Purchase analytics
router.get(
  "/purchases",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPurchaseAnalytics
);

// Customer analytics
router.get(
  "/customers",
  allowRoles("ADMIN", "EMPLOYEE"),
  getCustomerAnalytics
);

// Financial analytics
router.get(
  "/financial",
  allowRoles("ADMIN", "EMPLOYEE"),
  getFinancialAnalytics
);

export default router;