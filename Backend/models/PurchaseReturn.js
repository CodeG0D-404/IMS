import mongoose from "mongoose";

const purchaseReturnSchema = new mongoose.Schema(
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
      -> Supplier owes us later

      REFUND
      -> Supplier already paid us

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
purchaseReturnSchema.pre("save", async function () {
  /* ============================
     VALIDATION
  ============================ */
  if (this.totalAmount < 0) {
    throw new Error("Total amount cannot be negative");
  }

  this.totalAmount = Number(
    this.totalAmount.toFixed(2)
  );

  /* ============================
     AUTO EFFECT LOGIC
  ============================ */

  /*
    REPLACE
    -> no stock loss
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
    -> ledger affected
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

// Unique reference number per store
purchaseReturnSchema.index(
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

// Store queries
purchaseReturnSchema.index({
  store: 1,
  createdAt: -1,
});

// Filter by adjustment type
purchaseReturnSchema.index({
  store: 1,
  adjustmentType: 1,
});

// Purchase history
purchaseReturnSchema.index({
  purchase: 1,
  createdAt: -1,
});

export default mongoose.model(
  "PurchaseReturn",
  purchaseReturnSchema
);