// models/Store.js

import mongoose from "mongoose";

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    storeCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    ownerName: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      lowercase: true,
      trim: true
    },

    address: {
      line1: { type: String, trim: true },
      line2: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
      country: {
        type: String,
        default: "India",
        trim: true
      }
    },

    gstNumber: {
      type: String,
      trim: true
    },

    logo: {
      type: String // cloudinary URL
    },

    subscriptionPlan: {
      type: String,
      enum: ["FREE", "BASIC", "PRO"],
      default: "FREE"
    },

    subscriptionExpiry: {
      type: Date
    },

    trialEndsAt: {
      type: Date
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    settings: {
      lowStockThreshold: {
        type: Number,
        default: 5
      },

      allowNegativeStock: {
        type: Boolean,
        default: false
      },

      currency: {
        type: String,
        default: "INR"
      },

      enableCreditSystem: {
        type: Boolean,
        default: true
      }
    }
  },
  { timestamps: true }
);

// ===============================
// Indexes
// ===============================

storeSchema.index({ isActive: 1 });
storeSchema.index({ isDeleted: 1 });

export default mongoose.model("Store", storeSchema);