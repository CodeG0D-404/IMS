import mongoose from "mongoose";

const partySchema = new mongoose.Schema(
  {
    /* ======================================
       STORE (MULTI-TENANT - CRITICAL)
    ====================================== */
    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
      index: true,
    },

    /* ======================================
       BASIC INFO
    ====================================== */
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    /* ======================================
       PARTY TYPE (CUSTOMER / SUPPLIER)
    ====================================== */
    types: [
      {
        type: String,
        enum: ["customer", "supplier"],
      },
    ],

    /* ======================================
       BALANCE (CREDIT SYSTEM)
       +ve  → they owe you
       -ve  → you owe them
    ====================================== */
    balance: {
      type: Number,
      default: 0,
      index: true,
    },

    /* ======================================
       STATUS (SOFT DELETE SUPPORT)
    ====================================== */
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

/* ======================================
   UNIQUE CONSTRAINT (IMPORTANT)
====================================== */
partySchema.index(
  { phone: 1, store: 1 },
  { unique: true, sparse: true }
);

/* ======================================
   CLEAN TYPES (REMOVE DUPLICATES)
====================================== */
partySchema.pre("save", async function () {
  if (this.types && this.types.length > 0) {
    this.types = [...new Set(this.types)];
  }
});

export default mongoose.model("Party", partySchema);