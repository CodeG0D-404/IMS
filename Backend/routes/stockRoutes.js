import express from "express";

import {
  getStockSummary,
  getProductStockDetails,
  getTotalInventoryValue,
  getLowStockSummary,
} from "../controllers/stockController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";

const router = express.Router();

router.use(protect, attachStore);

router.get("/summary", getStockSummary);
router.get("/total-value", getTotalInventoryValue);
router.get("/low-stock", getLowStockSummary);
router.get("/product/:productId", getProductStockDetails);

export default router;