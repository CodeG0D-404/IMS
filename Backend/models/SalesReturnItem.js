import mongoose from "mongoose";

/* ======================================
   LOT BREAKDOWN (FIFO RETURN)
====================================== */
const returnLotSchema = new mongoose.Schema(
  {
    stockLot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockLot",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    /*
      Historical cost snapshot
    */
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const salesReturnItemSchema = new mongoose.Schema(
  {
    /* ======================================
       REFERENCES
    ====================================== */

    salesReturn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalesReturn",
      required: true,
      index: true,
    },

    saleItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SaleItem",
      required: true,
      index: true,
    },

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

    /* ======================================
       RETURN SNAPSHOT
    ====================================== */

    /*
      Returned quantity
    */
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    /*
      Historical selling price snapshot
    */
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ======================================
       RETURN CONDITION
    ====================================== */

    condition: {
      type: String,
      enum: ["good", "damaged"],
      default: "good",
    },

    reason: {
      type: String,
      trim: true,
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
       FIFO LOT BREAKDOWN
    ====================================== */

    lots: {
      type: [returnLotSchema],
      required: true,

      validate: [
        {
          validator: function (val) {
            return val && val.length > 0;
          },

          message:
            "At least one lot is required",
        },

        {
          validator: function (val) {
            const total = val.reduce(
              (sum, lot) =>
                sum + lot.quantity,
              0
            );

            return (
              Number(total.toFixed(2)) ===
              Number(this.quantity.toFixed(2))
            );
          },

          message:
            "Lot quantities must match return quantity",
        },
      ],
    },

    /* ======================================
       RETURN TOTALS
    ====================================== */

    totalRevenue: {
      type: Number,
      required: true,
      min: 0,
    },

    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
      Profit reversal/loss
    */
    profitLoss: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/* ======================================
   AUTO CALCULATIONS
====================================== */
salesReturnItemSchema.pre("save", async function () {
  /* ============================
     VALIDATIONS
  ============================ */

  if (this.quantity <= 0) {
    throw new Error(
      "Quantity must be greater than 0"
    );
  }

  if (this.price < 0) {
    throw new Error(
      "Price cannot be negative"
    );
  }

  /* ============================
     TOTAL REVENUE
  ============================ */

  this.totalRevenue = Number(
    (this.quantity * this.price).toFixed(2)
  );

  /* ============================
     TOTAL COST (FIFO)
  ============================ */

  const totalCost = this.lots.reduce(
    (sum, lot) =>
      sum + lot.quantity * lot.costPrice,
    0
  );

  this.totalCost = Number(
    totalCost.toFixed(2)
  );

  /* ============================
     PROFIT LOSS
  ============================ */

  this.profitLoss = Number(
    (
      this.totalCost - this.totalRevenue
    ).toFixed(2)
  );

  /* ============================
     STOCK EFFECT LOGIC
  ============================ */

  /*
    REPLACE
    -> usually no net stock increase
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

// Prevent duplicate return item
// inside same sales return
salesReturnItemSchema.index(
  { salesReturn: 1, saleItem: 1 },
  { unique: true }
);

// Fast queries
salesReturnItemSchema.index({
  store: 1,
  product: 1,
});

// FIFO tracing
salesReturnItemSchema.index({
  "lots.stockLot": 1,
});

export default mongoose.model(
  "SalesReturnItem",
  salesReturnItemSchema
);
