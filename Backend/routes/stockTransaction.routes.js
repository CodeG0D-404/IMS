import express from "express";
import { attachStore } from "../middleware/attachStore.js";
import {
  getTransactionsByStore,
  getTransactionsByProduct,
  getSingleTransaction,
} from "../controllers/stockTransaction.controller.js";

import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   BASE MIDDLEWARE
========================================= */
router.use(
  protect,
  allowRoles("ADMIN", "EMPLOYEE"), // 🔥 FIXED (employees can view)
  attachStore
);

/* =========================================
   GET ALL TRANSACTIONS (STORE)
   Query:
   - type
   - from
   - to
   - page
   - limit
========================================= */
router.get("/", getTransactionsByStore);

/* =========================================
   GET TRANSACTIONS BY PRODUCT
========================================= */
router.get("/product/:productId", getTransactionsByProduct);

/* =========================================
   GET SINGLE TRANSACTION
========================================= */
router.get("/:transactionId", getSingleTransaction);

export default router;