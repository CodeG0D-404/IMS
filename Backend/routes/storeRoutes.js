import express from "express";
import {
  createStore,
  getAllStores,
  getStoreById,
  getStores,
} from "../controllers/storeController.js";

import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

router.post("/", protect, allowRoles("ADMIN"), createStore);
router.get("/", protect, allowRoles("ADMIN"), getAllStores);
router.get("/my", protect, getStores);
router.get("/:id", protect, getStoreById);

export default router;