import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;

/* ===============================
   HANDLE CRASHES (VERY IMPORTANT)
=============================== */
process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("💥 UNHANDLED REJECTION:", err);
  process.exit(1);
});

/* ===============================
   MONGODB CONNECTION
=============================== */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("✅ MongoDB connected");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

    /* ===============================
       GRACEFUL SHUTDOWN
    =============================== */
    const shutdown = async () => {
      console.log("🛑 Shutting down server...");

      await mongoose.connection.close();

      server.close(() => {
        console.log("💤 Server closed");
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1);
  }
};

connectDB();