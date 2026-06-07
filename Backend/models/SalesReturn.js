import mongoose from "mongoose";

const salesReturnSchema = new mongoose.Schema(
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

    party: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
      index: true,
    },

    /* ======================================
       RETURN INFO
    ====================================== */
    referenceNumber: {
      type: String,
      trim: true,
    },

    returnDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    /*
      Total return value
      (snapshot amount)
    */
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ======================================
       RETURN BEHAVIOR
    ====================================== */

    /*
      ADJUST
      -> We owe customer later

      REFUND
      -> Customer already refunded

      REPLACE
      -> Product replaced
    */
    adjustmentType: {
      type: String,
      enum: ["ADJUST", "REFUND", "REPLACE"],
      default: "ADJUST",
      required: true,
      index: true,
    },

    /* ======================================
       EFFECT FLAGS
       (AUDIT SAFETY)
    ====================================== */

    /*
      Did this return affect stock?
    */
    affectsStock: {
      type: Boolean,
      default: true,
    },

    /*
      Did this return affect ledger?
    */
    affectsLedger: {
      type: Boolean,
      default: true,
    },

    /*
      Was refund already settled?
    */
    refundProcessed: {
      type: Boolean,
      default: false,
    },

    /* ======================================
       REASON / NOTES
    ====================================== */
    reason: {
      type: String,
      trim: true,
    },

    notes: {
      type: String,
      trim: true,
    },

    /* ======================================
       PROFIT IMPACT
    ====================================== */
    totalProfitLoss: {
      type: Number,
      default: 0,
    },

    /* ======================================
       META
    ====================================== */
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

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
   AUTO LOGIC
====================================== */
salesReturnSchema.pre("save", async function () {
  /* ============================
     VALIDATION
  ============================ */
  if (this.totalAmount < 0) {
    throw new Error(
      "Total amount cannot be negative"
    );
  }

  this.totalAmount = Number(
    this.totalAmount.toFixed(2)
  );

  /* ============================
     AUTO EFFECT LOGIC
  ============================ */

  /*
    REPLACE
    -> usually no stock gain
    -> no ledger impact
  */
  if (this.adjustmentType === "REPLACE") {
    this.affectsStock = false;
    this.affectsLedger = false;
    this.refundProcessed = false;
  }

  /*
    REFUND
    -> stock affected
    -> refund already settled
  */
  if (this.adjustmentType === "REFUND") {
    this.affectsStock = true;
    this.affectsLedger = false;
    this.refundProcessed = true;
  }

  /*
    ADJUST
    -> stock affected
    -> customer credit created
  */
  if (this.adjustmentType === "ADJUST") {
    this.affectsStock = true;
    this.affectsLedger = true;
    this.refundProcessed = false;
  }
});

/* ======================================
   INDEXES
====================================== */

// Unique reference per store
salesReturnSchema.index(
  { referenceNumber: 1, store: 1 },
  {
    unique: true,
    partialFilterExpression: {
      referenceNumber: {
        $type: "string",
        $ne: "",
      },
    },
  }
);

// Store timeline
salesReturnSchema.index({
  store: 1,
  createdAt: -1,
});

// Filter by adjustment type
salesReturnSchema.index({
  store: 1,
  adjustmentType: 1,
});

// Sale history
salesReturnSchema.index({
  sale: 1,
  createdAt: -1,
});

export default mongoose.model(
  "SalesReturn",
  salesReturnSchema
);