// middleware/auth.js

import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * ===============================
 * 1️⃣ Protect Middleware (Upgraded)
 * ===============================
 * - Verifies accessToken from httpOnly cookie
 * - Fetches full user from DB
 * - Rejects inactive users
 */
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔎 Fetch fresh user from DB
    const user = await User.findById(decoded.sub).populate("store");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: "Account is inactive",
      });
    }

    // ✅ Attach full user document
    req.user = user;

    next();

  } catch (error) {

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired",
      });
    }

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};


/**
 * ===============================
 * 2️⃣ Admin Only Middleware
 * ===============================
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Admin access only",
    });
  }

  next();
};


/**
 * ===============================
 * 3️⃣ Employee Only Middleware
 * ===============================
 */
export const employeeOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "EMPLOYEE") {
    return res.status(403).json({
      message: "Employee access only",
    });
  }

  next();
};