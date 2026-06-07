import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
  {
    /* ======================================
       REFERENCES
    ====================================== */
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    stockLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLot",
      required: true,
      index: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    /* ======================================
       QUANTITY + PRICE
    ====================================== */
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ======================================
       TOTAL (AUTO CALCULATED)
    ====================================== */
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

/* ======================================
   AUTO CALCULATE TOTAL
====================================== */
purchaseItemSchema.pre("save", async function () {
  if (this.quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  if (this.costPrice < 0) {
    throw new Error("Cost price cannot be negative");
  }

  this.total = Number(
    (this.quantity * this.costPrice).toFixed(2)
  );
});

/* ======================================
   INDEXES
====================================== */

// Prevent duplicate product in same purchase
purchaseItemSchema.index(
  { purchase: 1, product: 1 },
  { unique: true }
);

// Fast lookups
purchaseItemSchema.index({ product: 1, stockLot: 1 });
purchaseItemSchema.index({ store: 1, purchase: 1 });

export default mongoose.model("PurchaseItem", purchaseItemSchema);