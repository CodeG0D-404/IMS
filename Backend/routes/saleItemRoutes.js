import express from "express";

import SaleItem from "../models/SaleItem.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";
import { allowRoles } from "../middleware/allowRoles.js";

const router = express.Router();

/* =========================================
   GLOBAL MIDDLEWARE
========================================= */
router.use(protect, attachStore);

/* =========================================
   GET ALL SALE ITEMS
========================================= */
router.get(
  "/",
  allowRoles("ADMIN", "EMPLOYEE"),

  async (req, res) => {
    try {

      const items =
        await SaleItem.find({
          store: req.storeId,
        })
          .populate(
            "product",
            "name sku"
          )
          .populate({
            path: "sale",
            select:
              "invoiceNumber totalAmount paidAmount dueAmount status saleDate hasReturn returnCount returnedAmount totalProfit",
            populate: {
              path: "party",
              select: "name phone",
            },
          })
          .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });

    } catch (error) {
      console.error(
        "Get Sale Items Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

export default router;