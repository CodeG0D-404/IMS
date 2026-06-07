import express from "express";
import {
  adminLogin,
  employeeLogin,
  refreshTokenHandler,
  logoutUser,
  getMe,
  getEmployees,
  resetEmployeePassword,
} from "../controllers/authController.js";

import { protect } from "../middleware/auth.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================
   PUBLIC
========================= */
router.post("/admin/login", adminLogin);
router.post("/employee/login", employeeLogin);
router.post("/refresh", refreshTokenHandler);
router.post("/logout", logoutUser);

/* =========================
   PROTECTED
========================= */
router.get("/me", protect, getMe);

router.get(
  "/employees",
  protect,
  allowRoles("ADMIN"),
  getEmployees
);

router.put(
  "/reset-password",
  protect,
  allowRoles("ADMIN"),
  resetEmployeePassword
);

export default router;