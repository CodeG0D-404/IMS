import express from "express";

import {
  getPurchaseOverview,
  getPurchaseTrend,
  getTopPurchasedProducts,
  getTopReturnedPurchaseProducts,
  getNetPurchasedProducts,
  getPurchasesBySupplier,
} from "../controllers/purchaseReportController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   PURCHASE REPORTS
========================================= */

// Purchase overview
router.get(
  "/overview",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPurchaseOverview
);

// Purchase trend
router.get(
  "/trend",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPurchaseTrend
);

// Top purchased products
router.get(
  "/top-products",
  allowRoles("ADMIN", "EMPLOYEE"),
  getTopPurchasedProducts
);

// Top returned purchase products
router.get(
  "/top-returned-products",
  allowRoles("ADMIN", "EMPLOYEE"),
  getTopReturnedPurchaseProducts
);

// Net purchased products
router.get(
  "/net-products",
  allowRoles("ADMIN", "EMPLOYEE"),
  getNetPurchasedProducts
);

// Purchases by supplier
router.get(
  "/suppliers",
  allowRoles("ADMIN", "EMPLOYEE"),
  getPurchasesBySupplier
);

export default router;