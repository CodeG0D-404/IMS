import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    /* ======================================
       PARTY (CUSTOMER)
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

    saleDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    /* ======================================
       ORIGINAL SALE AMOUNTS
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
      > 0  => Customer owes us
      = 0  => Settled
      < 0  => Customer advance / store credit
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
       SALE SUMMARY
    ====================================== */
    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalProfit: {
      type: Number,
      default: 0,
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
  Net sale after returns
*/
saleSchema.virtual("netAmount").get(function () {
  return Number(
    (this.totalAmount - this.returnedAmount).toFixed(2)
  );
});

/* ======================================
   AUTO CALCULATIONS
====================================== */
saleSchema.pre("save", async function () {
  /* ============================
     VALIDATIONS
  ============================ */
  if (this.paidAmount < 0) {
    throw new Error(
      "Paid amount cannot be negative"
    );
  }

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
saleSchema.index(
  { invoiceNumber: 1, store: 1 },
  {
    unique: true,
    partialFilterExpression: {
      invoiceNumber: {
        $type: "string",
        $ne: "",
      },
    },
  }
);

// Store timeline
saleSchema.index({
  store: 1,
  createdAt: -1,
});

// Customer history
saleSchema.index({
  party: 1,
  store: 1,
  saleDate: -1,
});

export default mongoose.model(
  "Sale",
  saleSchema
);