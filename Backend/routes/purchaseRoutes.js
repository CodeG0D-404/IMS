import express from "express";
import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  deletePurchase,
} from "../controllers/purchaseController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";

const router = express.Router();

router.use(protect, attachStore);

router.post("/", createPurchase);
router.get("/", getPurchases);
router.get("/:id", getPurchaseById);
router.delete("/:id", deletePurchase);

export default router;