import mongoose from "mongoose";

const stockTransactionSchema = new mongoose.Schema(
  {
    /* ======================================
       CORE REFERENCES
    ====================================== */

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    stockLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLot",
      required: true,
      index: true,
    },

    /* ======================================
       MOVEMENT TYPE
    ====================================== */

    /*
      Inventory movement event
    */
    transactionType: {
      type: String,

      enum: [
        "PURCHASE",
        "SALE",

        "PURCHASE_RETURN",
        "SALES_RETURN",

        "PURCHASE_REPLACEMENT_IN",
        "SALES_REPLACEMENT_OUT",

        "DAMAGE",
        "MANUAL_ADJUSTMENT",
      ],

      required: true,
      index: true,
    },

    /* ======================================
       MOVEMENT DIRECTION
    ====================================== */

    direction: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
      index: true,
    },

    /*
      Positive quantity only
      Direction determines movement
    */
    quantity: {
        type: Number,
        required: true,

        validate: {
          validator: function (v) {
            return v !== 0;
          },

          message: "Quantity cannot be zero",
        },
      },

    /* ======================================
       PRICING SNAPSHOTS
    ====================================== */

    /*
      Historical lot cost
    */
    costPrice: {
      type: Number,
      min: 0,
    },

    /*
      Historical selling price
    */
    sellingPrice: {
      type: Number,
      min: 0,
    },

    /*
      Snapshot totals
    */
    totalCost: {
      type: Number,
      min: 0,
    },

    totalRevenue: {
      type: Number,
      min: 0,
    },

    /*
      Snapshot profit
    */
    profit: {
      type: Number,
      default: 0,
    },

    /* ======================================
       VALUE IMPACT
    ====================================== */

    /*
      Does this movement affect
      inventory valuation?
    */
    affectsInventoryValue: {
      type: Boolean,
      default: true,
    },

    /* ======================================
       FLEXIBLE REFERENCES
    ====================================== */

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    referenceModel: {
      type: String,

      enum: [
        "Purchase",
        "Sale",

        "PurchaseReturn",
        "SalesReturn",

        "Adjustment",
      ],

      index: true,
    },

    /* ======================================
       TIMING
    ====================================== */

    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    /* ======================================
       META
    ====================================== */

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    /* ======================================
       SOFT DELETE
    ====================================== */

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ======================================
   VIRTUALS
====================================== */

/*
  Profit per unit
*/
stockTransactionSchema.virtual("unitProfit").get(
  function () {
    if (!this.quantity || !this.profit) {
      return 0;
    }

    return Number(
      (
        this.profit / this.quantity
      ).toFixed(2)
    );
  }
);

/* ======================================
   AUTO CALCULATIONS
====================================== */

stockTransactionSchema.pre("save", async function () {
  /* ============================
     ROUNDING
  ============================ */

  if (this.costPrice != null) {
    this.costPrice = Number(
      this.costPrice.toFixed(2)
    );
  }

  if (this.sellingPrice != null) {
    this.sellingPrice = Number(
      this.sellingPrice.toFixed(2)
    );
  }

  this.quantity = Number(
    this.quantity.toFixed(2)
  );

  /* ============================
     AUTO TOTALS
  ============================ */

  if (
    this.costPrice != null &&
    this.totalCost == null
  ) {
    this.totalCost = Number(
      (
        this.costPrice * this.quantity
      ).toFixed(2)
    );
  }

  if (
    this.sellingPrice != null &&
    this.totalRevenue == null
  ) {
    this.totalRevenue = Number(
      (
        this.sellingPrice * this.quantity
      ).toFixed(2)
    );
  }

  /* ============================
     PROFIT
  ============================ */

  if (
    this.totalRevenue != null &&
    this.totalCost != null
  ) {
    this.profit = Number(
      (
        this.totalRevenue -
        this.totalCost
      ).toFixed(2)
    );
  }
});

/* ======================================
   INDEXES
====================================== */

// Product inventory history
stockTransactionSchema.index({
  product: 1,
  store: 1,
});

// Store timeline
stockTransactionSchema.index({
  store: 1,
  transactionDate: -1,
});

// Reference linking
stockTransactionSchema.index({
  referenceId: 1,
  referenceModel: 1,
});

// Lot-level tracking
stockTransactionSchema.index({
  product: 1,
  store: 1,
  stockLot: 1,
});

// Movement analytics
stockTransactionSchema.index({
  store: 1,
  transactionType: 1,
  direction: 1,
});

export default mongoose.model(
  "StockTransaction",
  stockTransactionSchema
);