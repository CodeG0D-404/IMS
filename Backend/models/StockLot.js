import mongoose from "mongoose";

const stockLotSchema = new mongoose.Schema(
  {
    /* ======================================
       REFERENCES
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

    /*
      Source purchase
      that created this lot
    */
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      required: true,
      index: true,
    },

    /* ======================================
       FIFO CONTROL
    ====================================== */

    /*
      Used for FIFO ordering
    */
    purchaseDate: {
      type: Date,
      required: true,
      index: true,
    },

    /* ======================================
       LOT PRICING
    ====================================== */

    /*
      Historical purchase price
      for this lot
    */
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ======================================
       QUANTITY
    ====================================== */

    /*
      Original purchased quantity
      (immutable)
    */
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    /*
      Remaining available quantity
    */
    remainingQty: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },

    /* ======================================
       LOT STATUS
    ====================================== */

    /*
      Active FIFO lot
    */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* ======================================
       META
    ====================================== */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  Consumed quantity
*/
stockLotSchema.virtual("usedQty").get(function () {
  return Number(
    (this.quantity - this.remainingQty).toFixed(2)
  );
});

/*
  Current remaining stock value
*/
stockLotSchema.virtual("remainingValue").get(function () {
  return Number(
    (
      this.remainingQty * this.purchasePrice
    ).toFixed(2)
  );
});

/* ======================================
   VALIDATION
====================================== */

stockLotSchema.pre("save", async function () {
  /* ============================
     VALIDATIONS
  ============================ */

  if (this.remainingQty > this.quantity) {
    throw new Error(
      "Remaining qty cannot exceed quantity"
    );
  }

  if (this.remainingQty < 0) {
    throw new Error(
      "Remaining qty cannot be negative"
    );
  }

  /* ============================
     AUTO STATUS
  ============================ */

  // Auto deactivate empty lots
  this.isActive = this.remainingQty > 0;

  /* ============================
     ROUNDING
  ============================ */

  this.purchasePrice = Number(
    this.purchasePrice.toFixed(2)
  );

  this.quantity = Number(
    this.quantity.toFixed(2)
  );

  this.remainingQty = Number(
    this.remainingQty.toFixed(2)
  );
});

/* ======================================
   INDEXES
====================================== */

// Basic filtering
stockLotSchema.index({
  product: 1,
  store: 1,
});

// FIFO lookup
stockLotSchema.index({
  product: 1,
  store: 1,
  purchaseDate: 1,
});

// Fast available stock lookup
stockLotSchema.index({
  product: 1,
  store: 1,
  remainingQty: 1,
});

// Active FIFO lookup
stockLotSchema.index({
  store: 1,
  product: 1,
  isActive: 1,
  purchaseDate: 1,
});

// Purchase tracking
stockLotSchema.index({
  purchase: 1,
  product: 1,
});

export default mongoose.model(
  "StockLot",
  stockLotSchema
);