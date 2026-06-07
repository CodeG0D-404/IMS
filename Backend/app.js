import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

const app = express();

/* ===============================
   1️⃣ MIDDLEWARES
=============================== */
app.use(helmet()); // security headers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ===============================
   2️⃣ CORS CONFIG
=============================== */
const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) || [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman / mobile apps
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("❌ Blocked by CORS:", origin);
      return callback(null, false);
    },
    credentials: true,
  })
);

/* ===============================
   3️⃣ ROUTES
=============================== */

// Core
import authRoutes from "./routes/authRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";

// Master Data
import categoryRoutes from "./routes/category.routes.js";
import productRoutes from "./routes/product.routes.js";
import partyRoutes from "./routes/partyRoutes.js";

// Transactions
import purchaseRoutes from "./routes/purchaseRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import salesReturnRoutes from "./routes/salesReturnRoutes.js";
import purchaseReturnRoutes from "./routes/purchaseReturnRoutes.js";

// Inventory
import stockLotRoutes from "./routes/stockLotRoutes.js";
import stockTransactionRoutes from "./routes/stockTransaction.routes.js";
import stockRoutes from "./routes/stockRoutes.js";

// Finance
import ledgerRoutes from "./routes/ledgerRoutes.js";

/* ===============================
   REPORT ROUTES
=============================== */

// Dashboard
import dashboardRoutes from "./routes/dashboardRoutes.js";

// Reports
import salesReportRoutes from "./routes/salesReportRoutes.js";
import purchaseReportRoutes from "./routes/purchaseReportRoutes.js";
import inventoryReportRoutes from "./routes/inventoryReportRoutes.js";
import ledgerReportRoutes from "./routes/ledgerReportRoutes.js";
import productReportRoutes from "./routes/productReportRoutes.js";
import partyReportRoutes from "./routes/partyReportRoutes.js";
import profitReportRoutes from "./routes/profitReportRoutes.js";
import saleItemRoutes from "./routes/saleItemRoutes.js";

// Audit + Analytics
import auditRoutes from "./routes/auditRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

/* ===============================
   API ROUTES
=============================== */

// Core
app.use("/api/auth", authRoutes);
app.use("/api/stores", storeRoutes);

// Master Data
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/parties", partyRoutes);

// Transactions
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/sales-returns", salesReturnRoutes);
app.use("/api/purchase-returns", purchaseReturnRoutes);

// Inventory
app.use("/api/stock-lots", stockLotRoutes);
app.use(
  "/api/stock-transactions",
  stockTransactionRoutes
);
app.use("/api/stock", stockRoutes);

// Finance
app.use("/api/ledger", ledgerRoutes);

/* ===============================
   REPORT APIs
=============================== */

// Dashboard
app.use("/api/dashboard", dashboardRoutes);

// Reports
app.use(
  "/api/reports/sales",
  salesReportRoutes
);

app.use(
  "/api/reports/purchases",
  purchaseReportRoutes
);

app.use(
  "/api/reports/inventory",
  inventoryReportRoutes
);

app.use(
  "/api/reports/ledger",
  ledgerReportRoutes
);

app.use(
  "/api/reports/products",
  productReportRoutes
);

app.use("/api/sale-items", saleItemRoutes);

app.use(
  "/api/reports/parties",
  partyReportRoutes
);

app.use(
  "/api/reports/profit",
  profitReportRoutes
);

// Audit
app.use("/api/audit", auditRoutes);

// Analytics
app.use(
  "/api/analytics",
  analyticsRoutes
);

/* ===============================
   4️⃣ HEALTH CHECK
=============================== */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server running 🚀",
  });
});

/* ===============================
   5️⃣ 404 HANDLER
=============================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ===============================
   6️⃣ GLOBAL ERROR HANDLER
=============================== */
app.use((err, req, res, next) => {
  console.error("🔥 ERROR:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

export default app;