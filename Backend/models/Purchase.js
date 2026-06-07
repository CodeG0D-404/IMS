import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema(
  {
    /* ======================================
       PARTY (SUPPLIER)
    ====================================== */
    party: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
      required: true,
      index: true,
    },

    /* ======================================
       INVOICE
    ====================================== */
    invoiceNumber: {
      type: String,
      trim: true,
    },

    purchaseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    /* ======================================
       ORIGINAL PURCHASE AMOUNTS
       (IMMUTABLE INVOICE SNAPSHOT)
    ====================================== */
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
      > 0  => You owe supplier
      = 0  => Settled
      < 0  => Supplier advance / excess paid
    */
    dueAmount: {
      type: Number,
      default: 0,
    },

    /* ======================================
       STATUS
    ====================================== */
    status: {
      type: String,
      enum: ["PAID", "PARTIAL", "UNPAID", "ADVANCE"],
      default: "UNPAID",
      index: true,
    },

    /* ======================================
       RETURN SUMMARY
       (INFORMATIONAL ONLY)
    ====================================== */
    hasReturn: {
      type: Boolean,
      default: false,
      index: true,
    },

    returnCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    returnedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    returnedAmount: {
      type: Number,
      default: 0,
      min: 0,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* ======================================
   VIRTUALS
====================================== */

/*
  Net amount after returns
  (UI/helper only)
*/
purchaseSchema.virtual("netAmount").get(function () {
  return Number(
    (this.totalAmount - this.returnedAmount).toFixed(2)
  );
});

/* ======================================
   AUTO CALCULATIONS
====================================== */
purchaseSchema.pre("save", async function () {
  /* ============================
     CALCULATE DUE
  ============================ */
  this.dueAmount = Number(
    (this.totalAmount - this.paidAmount).toFixed(2)
  );

  /* ============================
     STATUS LOGIC
  ============================ */
  if (this.dueAmount > 0) {
    if (this.paidAmount === 0) {
      this.status = "UNPAID";
    } else {
      this.status = "PARTIAL";
    }
  } else if (this.dueAmount === 0) {
    this.status = "PAID";
  } else {
    this.status = "ADVANCE";
  }
});

/* ======================================
   INDEXES
====================================== */

// Unique invoice per store
purchaseSchema.index(
  { invoiceNumber: 1, store: 1 },
  {
    unique: true,
    partialFilterExpression: {
      invoiceNumber: { $type: "string", $ne: "" },
    },
  }
);

// Store queries
purchaseSchema.index({
  store: 1,
  createdAt: -1,
});

// Supplier history
purchaseSchema.index({
  party: 1,
  store: 1,
  purchaseDate: -1,
});

export default mongoose.model("Purchase", purchaseSchema);