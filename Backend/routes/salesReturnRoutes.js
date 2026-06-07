import express from "express";

import {
  createSalesReturn,
  getSalesReturns,
  getSalesReturnById,
} from "../controllers/salesReturnController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   SALES RETURNS (AFFECTS STOCK + PROFIT)
========================================= */

// Create sales return (ADMIN ONLY 🔥)
router.post("/", allowRoles("ADMIN"), createSalesReturn);

// Get all sales returns
router.get("/", allowRoles("ADMIN", "EMPLOYEE"), getSalesReturns);

// Get single sales return
router.get("/:id", allowRoles("ADMIN", "EMPLOYEE"), getSalesReturnById);

export default router;