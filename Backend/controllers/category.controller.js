import mongoose from "mongoose";
import Category from "../models/Category.js";

/* ==============================================
   CREATE CATEGORY (ADMIN ONLY)
============================================== */
export const createCategory = async (req, res) => {
  try {
    const storeId = req.storeId;
    let { name, description } = req.body;

    /* ============================
       VALIDATION
    ============================ */
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Normalize
    name = name.trim();

    /* ============================
       DUPLICATE CHECK (CASE SAFE)
    ============================ */
    const existing = await Category.findOne({
      store: storeId,
      isActive: true,
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    /* ============================
       CREATE
    ============================ */
    const category = await Category.create({
      name,
      description,
      store: storeId,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      category,
    });

  } catch (error) {
    console.error("Create category error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ==============================================
   GET ALL CATEGORIES (STORE SAFE)
============================================== */
export const getCategories = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { page = 1, limit = 50 } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const [categories, total] = await Promise.all([
      Category.find({
        store: storeId,
        isActive: true,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),

      Category.countDocuments({
        store: storeId,
        isActive: true,
      }),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: parsedPage,
      pages: Math.ceil(total / parsedLimit),
      count: categories.length,
      categories,
    });

  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ==============================================
   DELETE CATEGORY (SOFT DELETE)
============================================== */
export const deleteCategory = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    /* ============================
       VALIDATION
    ============================ */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    /* ============================
       FIND CATEGORY
    ============================ */
    const category = await Category.findOne({
      _id: id,
      store: storeId,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    /* ============================
       SOFT DELETE
    ============================ */
    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category deleted",
    });

  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/* ==============================================
   UPDATE CATEGORY (ADMIN ONLY)
============================================== */
export const updateCategory = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;
    let { name, description } = req.body;

    /* ============================
       VALIDATION
    ============================ */
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    name = name.trim();

    /* ============================
       FIND CATEGORY
    ============================ */
    const category = await Category.findOne({
      _id: id,
      store: storeId,
      isActive: true,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    /* ============================
       DUPLICATE CHECK (EXCLUDE SELF)
    ============================ */
    const existing = await Category.findOne({
      _id: { $ne: id },
      store: storeId,
      isActive: true,
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    /* ============================
       UPDATE
    ============================ */
    category.name = name;
    category.description = description ?? category.description;

    await category.save();

    res.status(200).json({
      success: true,
      category,
    });

  } catch (error) {
    console.error("Update category error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};