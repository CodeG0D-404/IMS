import express from "express";

import {
  getAllStockLots,
  getStockLotsByProduct,
  getStockLotById,
  getLowStockLots,
} from "../controllers/stockLotController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";

const router = express.Router();

/* =========================
   GLOBAL MIDDLEWARE
========================= */
router.use(protect, attachStore);

/* =========================
   STOCK LOT ROUTES
========================= */
router.get("/", getAllStockLots);
router.get("/low", getLowStockLots);
router.get("/product/:productId", getStockLotsByProduct);
router.get("/:id", getStockLotById);

export default router;