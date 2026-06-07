import express from "express";

import {
  getProductOverview,
  getProductSalesReport,
  getProductPurchaseReport,
  getNetProductMovement,
  getTopProfitProducts,
} from "../controllers/productReportController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   PRODUCT REPORTS
========================================= */

// Product overview
router.get(
  "/overview",
  allowRoles("ADMIN", "EMPLOYEE"),
  getProductOverview
);

// Product sales report
router.get(
  "/sales",
  allowRoles("ADMIN", "EMPLOYEE"),
  getProductSalesReport
);

// Product purchase report
router.get(
  "/purchases",
  allowRoles("ADMIN", "EMPLOYEE"),
  getProductPurchaseReport
);

// Net product movement
router.get(
  "/net-movement",
  allowRoles("ADMIN", "EMPLOYEE"),
  getNetProductMovement
);

// Top profit products
router.get(
  "/top-profit",
  allowRoles("ADMIN", "EMPLOYEE"),
  getTopProfitProducts
);

export default router;