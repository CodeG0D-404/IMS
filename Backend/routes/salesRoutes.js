import express from "express";
import {
  createSale,
  getSales,
  getSaleById,
} from "../controllers/salesController.js";

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
   SALES RETURNS
========================================= */

// Create sales return
router.post(
  "/returns",
  allowRoles("ADMIN", "EMPLOYEE"),
  createSalesReturn
);

// Get all sales returns
router.get(
  "/returns",
  allowRoles("ADMIN", "EMPLOYEE"),
  getSalesReturns
);

// Get single sales return
router.get(
  "/returns/:id",
  allowRoles("ADMIN", "EMPLOYEE"),
  getSalesReturnById
);

/* =========================================
   SALES
========================================= */

// Create sale
router.post("/", allowRoles("ADMIN", "EMPLOYEE"), createSale);

// Get all sales
router.get("/", allowRoles("ADMIN", "EMPLOYEE"), getSales);

// Get single sale
router.get("/:id", allowRoles("ADMIN", "EMPLOYEE"), getSaleById);

export default router;