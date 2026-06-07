import express from "express";

import {
  getInventoryOverview,
  getStockMovementReport,
  getInventoryValuation,
  getLowStockProducts,
  getOutOfStockProducts,
  getFastMovingProducts,
  getStockLotAging,
} from "../controllers/inventoryReportController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   INVENTORY REPORTS
========================================= */

// Inventory overview
router.get(
  "/overview",
  allowRoles("ADMIN", "EMPLOYEE"),
  getInventoryOverview
);

// Stock movement report
router.get(
  "/stock-movement",
  allowRoles("ADMIN", "EMPLOYEE"),
  getStockMovementReport
);

// Inventory valuation
router.get(
  "/valuation",
  allowRoles("ADMIN", "EMPLOYEE"),
  getInventoryValuation
);

// Low stock products
router.get(
  "/low-stock",
  allowRoles("ADMIN", "EMPLOYEE"),
  getLowStockProducts
);

// Out of stock products
router.get(
  "/out-of-stock",
  allowRoles("ADMIN", "EMPLOYEE"),
  getOutOfStockProducts
);

// Fast moving products
router.get(
  "/fast-moving",
  allowRoles("ADMIN", "EMPLOYEE"),
  getFastMovingProducts
);

// Stock aging report
router.get(
  "/stock-aging",
  allowRoles("ADMIN", "EMPLOYEE"),
  getStockLotAging
);

export default router;