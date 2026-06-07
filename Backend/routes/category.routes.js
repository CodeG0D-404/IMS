import express from "express";
import { attachStore } from "../middleware/attachStore.js";

import {
  createCategory,
  getCategories,
  updateCategory,
} from "../controllers/category.controller.js";

import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* ==============================
   CATEGORY ROUTES
============================== */

// Create category (ADMIN)
router.post(
  "/",
  protect,
  attachStore,
  allowRoles("ADMIN"),
  createCategory
);

// Get categories
router.get(
  "/",
  protect,
  attachStore,
  allowRoles("ADMIN", "EMPLOYEE"),
  getCategories
);

// Update / deactivate category
router.put(
  "/:id",
  protect,
  attachStore,
  allowRoles("ADMIN"),
  updateCategory
);

export default router;