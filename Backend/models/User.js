import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["ADMIN", "EMPLOYEE"],
      required: true,
    },

    // ================= ADMIN FIELDS =================
    email: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true, // allows null for employee
    },

    // ================= EMPLOYEE FIELDS =================
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    store: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: function () {
        return this.role === "EMPLOYEE";
      },
    },

    // 🔐 Secure Refresh Token (Hashed)
    refreshToken: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* ===============================
   Password Hash Middleware
================================= */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

export default mongoose.model("User", userSchema);