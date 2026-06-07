import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    /* ======================================
       CORE REFERENCES
    ====================================== */
    party: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party",
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
       TRANSACTION TYPE
    ====================================== */
    entryType: {
      type: String,
      enum: [
        "SALE",
        "PURCHASE",
        "PAYMENT_IN",
        "PAYMENT_OUT",
        "SALES_RETURN",
        "PURCHASE_RETURN",
      ],
      required: true,
      index: true,
    },

    /* ======================================
       CREDIT / DEBIT SYSTEM
    ====================================== */
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /* ======================================
       RUNNING BALANCE
    ====================================== */
    balance: {
      type: Number,
      required: true,
    },

    /* ======================================
       PAYMENT DETAILS
    ====================================== */
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank", "cheque"],
    },

    /* ======================================
       FLEXIBLE REFERENCE
    ====================================== */
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },

    referenceModel: {
      type: String,
      enum: [
        "Sale",
        "Purchase",
        "SalesReturn",
        "PurchaseReturn",
        "Payment",
      ],
      index: true,
    },

    /* ======================================
       META
    ====================================== */
    transactionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },

    note: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

/* ======================================
   INDEXES
====================================== */

// Party ledger history
ledgerSchema.index({ party: 1, store: 1, transactionDate: 1 });

// Fast lookup by reference
ledgerSchema.index({ referenceId: 1, referenceModel: 1 });

export default mongoose.model("Ledger", ledgerSchema);