import mongoose from "mongoose";

import Product from "../models/Product.js";
import StockLot from "../models/StockLot.js";

/* =========================================
   CREATE PRODUCT
========================================= */
export const createProduct = async (req, res) => {
  try {
    const storeId = req.storeId;

    const {
      name,
      sku,
      barcode,
      category, // OPTIONAL
      unit,
      description,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    /* =========================
       UNIQUE CHECK (PER STORE)
    ========================= */
    if (sku) {
      const existingSku = await Product.findOne({
        store: storeId,
        sku,
      });

      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: "SKU already exists",
        });
      }
    }

    if (barcode) {
      const existingBarcode = await Product.findOne({
        store: storeId,
        barcode,
      });

      if (existingBarcode) {
        return res.status(400).json({
          success: false,
          message: "Barcode already exists",
        });
      }
    }

    const product = await Product.create({
      store: storeId,
      createdBy: req.user._id, // ✅ FIX ADDED
      name,
      sku,
      barcode,
      category: category || null,
      unit,
      description,
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET PRODUCTS (STORE BASED)
========================================= */
export const getProductsByStore = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { search, category } = req.query;

    let filter = { store: storeId };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { barcode: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET PRODUCT BY ID
========================================= */
export const getProductById = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const product = await Product.findOne({
      _id: id,
      store: storeId,
    }).populate("category", "name");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get Product Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   UPDATE PRODUCT
========================================= */
export const updateProduct = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const updates = req.body;

    if (updates.category === "") {
      updates.category = null;
    }

    const product = await Product.findOneAndUpdate(
      { _id: id, store: storeId },
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   DELETE PRODUCT (SAFE)
========================================= */
export const deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const product = await Product.findOne({
      _id: id,
      store: storeId,
    }).session(session);

    if (!product) {
      throw new Error("Product not found");
    }

    const stockExists = await StockLot.exists({
      product: product._id,
      store: storeId,
    });

    if (stockExists) {
      throw new Error(
        "Cannot delete product with stock history"
      );
    }

    await product.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Delete Product Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};