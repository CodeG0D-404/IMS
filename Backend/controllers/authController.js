import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* =========================================
   TOKEN GENERATORS
========================================= */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
      store: user.store || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      type: "refresh",
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

/* =========================================
   ADMIN LOGIN
========================================= */
export const adminLogin = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.toLowerCase().trim();

    const user = await User.findOne({
      email,
      role: "ADMIN",
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Admin login successful",
      user: {
        _id: user._id,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Admin Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/* =========================================
   EMPLOYEE LOGIN
========================================= */
export const employeeLogin = async (req, res) => {
  try {
    let { username, password } = req.body;

    username = username?.toLowerCase().trim();

    const user = await User.findOne({
      username,
      role: "EMPLOYEE",
      isActive: true,
    }).populate("store");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Employee login successful",
      user: {
        _id: user._id,
        role: user.role,
        storeId: user.store?._id,
      },
    });

  } catch (error) {
    console.error("Employee Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/* =========================================
   REFRESH TOKEN
========================================= */
export const refreshTokenHandler = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No refresh token",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET
    );

    if (decoded.type !== "refresh") {
      return res.status(401).json({
        success: false,
        message: "Invalid token type",
      });
    }

    const user = await User.findById(decoded.sub);

    if (!user || !user.refreshToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const isMatch = await bcrypt.compare(
      token,
      user.refreshToken
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Refresh token mismatch",
      });
    }

    const newAccessToken = generateAccessToken(user);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Token refreshed",
    });

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

/* =========================================
   LOGOUT
========================================= */
export const logoutUser = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_REFRESH_SECRET
        );

        const user = await User.findById(decoded.sub);

        if (user) {
          user.refreshToken = null;
          await user.save();
        }
      } catch (err) {
        // ignore invalid token
      }
    }

    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    return res.json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

/* =========================================
   GET CURRENT USER
========================================= */
export const getMe = (req, res) => {
  return res.json({
    success: true,
    user: {
      _id: req.user._id,
      role: req.user.role,
      storeId:
        req.user.role === "EMPLOYEE"
          ? req.user.store?._id
          : null,
    },
  });
};
/* =========================================
   GET EMPLOYEES (ADMIN, STORE SAFE)
========================================= */
export const getEmployees = async (req, res) => {
  try {
    const employees = await User.find({
      role: "EMPLOYEE",
      isActive: true,
      store: req.user.store, // ✅ FIXED
    })
      .populate("store", "name storeCode")
      .select("username store createdAt");

    return res.json({
      success: true,
      data: employees,
    });

  } catch (error) {
    console.error("Get Employees Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch employees",
    });
  }
};

/* =========================================
   RESET EMPLOYEE PASSWORD (ADMIN)
========================================= */
export const resetEmployeePassword = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only admin can reset passwords",
      });
    }

    const { employeeId, newPassword } = req.body;

    if (!employeeId || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and new password are required",
      });
    }

    const employee = await User.findOne({
      _id: employeeId,
      role: "EMPLOYEE",
      isActive: true,
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    employee.password = hashedPassword;
    employee.refreshToken = null;

    await employee.save();

    return res.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("Reset Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Password reset failed",
    });
  }
};