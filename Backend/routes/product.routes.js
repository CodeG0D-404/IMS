import express from "express";
import {
  createProduct,
  getProductsByStore,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

router.use(protect, attachStore);

router.post("/", allowRoles("ADMIN"), createProduct);
router.get("/", getProductsByStore);
router.get("/:id", getProductById);
router.put("/:id", allowRoles("ADMIN"), updateProduct);
router.delete("/:id", allowRoles("ADMIN"), deleteProduct);

export default router;