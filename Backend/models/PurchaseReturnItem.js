import mongoose from "mongoose";

const purchaseReturnItemSchema = new mongoose.Schema(
  {
    /* ======================================
       REFERENCES
    ====================================== */
    purchaseReturn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseReturn",
      required: true,
      index: true,
    },

    purchaseItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseItem",
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
       RETURN SNAPSHOT
    ====================================== */

    /*
      Quantity returned
    */
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    /*
      Historical cost price snapshot
    */
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
      Total return value
    */
    total: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    /* ======================================
       RETURN BEHAVIOR SNAPSHOT
    ====================================== */

    adjustmentType: {
      type: String,
      enum: ["ADJUST", "REFUND", "REPLACE"],
      required: true,
      default: "ADJUST",
      index: true,
    },

    /*
      Did this item affect stock?
    */
    affectsStock: {
      type: Boolean,
      default: true,
    },

    /* ======================================
       OPTIONAL REASON
    ====================================== */
    reason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ======================================
   AUTO CALCULATE TOTAL
====================================== */
purchaseReturnItemSchema.pre("save", async function () {
  /* ============================
     VALIDATION
  ============================ */
  if (this.quantity <= 0) {
    throw new Error(
      "Quantity must be greater than 0"
    );
  }

  if (this.costPrice < 0) {
    throw new Error(
      "Cost price cannot be negative"
    );
  }

  /* ============================
     AUTO TOTAL
  ============================ */
  this.total = Number(
    (this.quantity * this.costPrice).toFixed(2)
  );

  /* ============================
     STOCK EFFECT LOGIC
  ============================ */

  /*
    REPLACE
    -> no stock reduction
  */
  if (this.adjustmentType === "REPLACE") {
    this.affectsStock = false;
  } else {
    this.affectsStock = true;
  }
});

/* ======================================
   INDEXES
====================================== */

// Prevent duplicate return of same purchase item
// inside same purchase return
purchaseReturnItemSchema.index(
  { purchaseReturn: 1, purchaseItem: 1 },
  { unique: true }
);

// Fast product/lot lookups
purchaseReturnItemSchema.index({
  product: 1,
  stockLot: 1,
});

// Store queries
purchaseReturnItemSchema.index({
  store: 1,
  purchaseReturn: 1,
});


export default mongoose.model(
  "PurchaseReturnItem",
  purchaseReturnItemSchema
);