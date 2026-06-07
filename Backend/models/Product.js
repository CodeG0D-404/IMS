import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    unit: {
      type: String,
      default: "PCS",
      trim: true,
      enum: ["PCS", "KG", "LTR", "BOX", "PACK"], // controlled list (expand later if needed)
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);


// ======================================
// AUTO GENERATE STRONG PRODUCT CODE
// ======================================
productSchema.pre("save", async function () {
  if (!this.sku) {
    const random = Math.floor(1000 + Math.random() * 9000);
    const timestamp = Date.now().toString().slice(-4);

    this.sku = `PRD-${timestamp}-${random}`;
  }
});


// ======================================
// INDEXES
// ======================================

// Unique product name per store
productSchema.index({ name: 1, store: 1 }, { unique: true });

// Unique sku per store
productSchema.index({ sku: 1, store: 1 }, { unique: true });

// Text search
productSchema.index({ name: "text" });

// Store filter
productSchema.index({ store: 1, isActive: 1 });


export default mongoose.model("Product", productSchema);