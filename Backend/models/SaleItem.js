import mongoose from "mongoose";

/* ======================================
   LOT BREAKDOWN (FIFO SUPPORT)
====================================== */
const lotSchema = new mongoose.Schema(
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

const saleItemSchema = new mongoose.Schema(
  {
    /* ======================================
       REFERENCES
    ====================================== */
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
      required: true,
      index: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },

    /* ======================================
       QUANTITY + PRICE
    ====================================== */

    /*
      Original sold quantity
      (immutable)
    */
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    /*
      Selling price snapshot
    */
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ======================================
       FIFO LOT BREAKDOWN
    ====================================== */
    lots: {
      type: [lotSchema],
      required: true,

      validate: {
        validator: function (val) {
          if (!val || val.length === 0) {
            return false;
          }

          const total = val.reduce(
            (sum, lot) => sum + lot.quantity,
            0
          );

          return (
            Number(total.toFixed(2)) ===
            Number(this.quantity.toFixed(2))
          );
        },

        message:
          "Lot quantities must match total quantity",
      },
    },

    /* ======================================
       ORIGINAL TOTALS
       (IMMUTABLE SNAPSHOT)
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

    profit: {
      type: Number,
      default: 0,
    },

    /* ======================================
       RETURN SUMMARY
       (INFORMATIONAL ONLY)
    ====================================== */

    returnedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    returnedRevenue: {
      type: Number,
      default: 0,
      min: 0,
    },

    returnedCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    returnedProfitLoss: {
      type: Number,
      default: 0,
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
  Net sold qty after returns
*/
saleItemSchema.virtual("netQuantity").get(function () {
  return Number(
    (this.quantity - this.returnedQuantity).toFixed(2)
  );
});

/*
  Net revenue after returns
*/
saleItemSchema.virtual("netRevenue").get(function () {
  return Number(
    (
      this.totalRevenue - this.returnedRevenue
    ).toFixed(2)
  );
});

/*
  Net profit after returns
*/
saleItemSchema.virtual("netProfit").get(function () {
  return Number(
    (
      this.profit - this.returnedProfitLoss
    ).toFixed(2)
  );
});

/* ======================================
   AUTO CALCULATIONS
====================================== */
saleItemSchema.pre("save", async function () {
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
     PROFIT
  ============================ */
  this.profit = Number(
    (
      this.totalRevenue - this.totalCost
    ).toFixed(2)
  );
});

/* ======================================
   INDEXES
====================================== */

// Prevent duplicate product in same sale
saleItemSchema.index(
  { sale: 1, product: 1 },
  { unique: true }
);

// Fast queries
saleItemSchema.index({
  store: 1,
  product: 1,
});

// FIFO tracing
saleItemSchema.index({
  "lots.stockLot": 1,
});

export default mongoose.model(
  "SaleItem",
  saleItemSchema
);