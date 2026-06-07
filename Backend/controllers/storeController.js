import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import Store from "../models/Store.js";
import User from "../models/User.js";

/* =====================================================
   1️⃣ CREATE STORE (ADMIN ONLY)
===================================================== */
export const createStore = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    let {
      name,
      storeCode,
      ownerName,
      phone,
      email,
      address,
      gstNumber,
      employeeUsername,
      employeePassword,
    } = req.body;

    /* =========================
       NORMALIZE INPUT
    ========================= */
    name = name?.trim();
    storeCode = storeCode?.trim();
    ownerName = ownerName?.trim();
    phone = phone?.trim();
    email = email?.trim();
    employeeUsername = employeeUsername?.toLowerCase().trim();

    /* =========================
       VALIDATION
    ========================= */
    if (!name || !storeCode || !ownerName || !phone) {
      throw new Error("Required fields missing");
    }

    if (!employeeUsername || !employeePassword) {
      throw new Error("Employee credentials required");
    }

    /* =========================
       UNIQUE CHECKS
    ========================= */
    const existingStore = await Store.findOne({ storeCode });
    if (existingStore) {
      throw new Error("Store code already exists");
    }

    const existingEmployee = await User.findOne({
      username: employeeUsername,
    });
    if (existingEmployee) {
      throw new Error("Employee username already exists");
    }

    /* =========================
       HASH PASSWORD
    ========================= */
    const hashedPassword = await bcrypt.hash(employeePassword, 10);

    /* =========================
       CREATE STORE
    ========================= */
    const [store] = await Store.create(
      [
        {
          name,
          storeCode,
          ownerName,
          phone,
          email,
          address,
          gstNumber,
        },
      ],
      { session }
    );

    /* =========================
       CREATE EMPLOYEE
    ========================= */
    const [employee] = await User.create(
      [
        {
          role: "EMPLOYEE",
          username: employeeUsername,
          password: hashedPassword,
          store: store._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      data: {
        store,
        employee: {
          _id: employee._id,
          username: employee.username,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Create Store Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   2️⃣ GET ALL STORES (ADMIN ONLY)
===================================================== */
export const getAllStores = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = { isDeleted: false };

    const [stores, total] = await Promise.all([
      Store.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),

      Store.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      count: stores.length,
      stores,
    });
  } catch (error) {
    console.error("Get All Stores Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   3️⃣ GET STORE BY ID (ROLE SAFE)
===================================================== */
export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store ID",
      });
    }

    const store = await Store.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found",
      });
    }

    if (req.user.role === "EMPLOYEE") {
      const userStoreId = req.user.store?.toString();

      if (userStoreId !== id) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    return res.status(200).json({
      success: true,
      store,
    });
  } catch (error) {
    console.error("Get Store By ID Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   4️⃣ GET STORES (SELECT STORE PAGE)
===================================================== */
export const getStores = async (req, res) => {
  try {
    const user = req.user;

    let stores = [];

    if (user.role === "ADMIN") {
      stores = await Store.find({ isDeleted: false }).sort({
        createdAt: -1,
      });
    } else {
      stores = await Store.find({
        _id: user.store,
        isDeleted: false,
      });
    }

    return res.status(200).json({
      success: true,
      stores,
    });
  } catch (error) {
    console.error("Get Stores Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};