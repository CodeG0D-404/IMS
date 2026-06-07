// =============================================
// 📁 src/App.jsx
// Main App Router — IMS
// =============================================

import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layouts
import Dashboard from "./components/Dashboard";

// Pages
import Login from "./pages/Login";
import SelectStore from "./pages/SelectStore";
import DashboardHome from "./pages/DashboardHome";

// Purchase Pages
import PurchaseList from "./pages/PurchaseList";
import PurchaseCreate from "./pages/PurchaseCreate";
import PurchaseDetails from "./pages/PurchaseDetails";
import PurchaseReturnList from "./pages/PurchaseReturnList";
import PurchaseReturnDetails from "./pages/PurchaseReturnDetails";

// Sales Pages
import SalesList from "./pages/SalesList";
import SalesCreate from "./pages/SalesCreate";
import SalesDetails from "./pages/SalesDetails";
import SalesReturnList from "./pages/SalesReturnList";
import SalesReturnDetails from "./pages/SalesReturnDetails";

// Store Pages
import StoreList from "./pages/StoreList";
import AddStore from "./pages/AddStore";
import StoreDetails from "./pages/StoreDetails";

// Product Pages
import Products from "./pages/Products";

// Other Pages
import CategoryPage from "./pages/CategoryPage";
import Employees from "./pages/Employees";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

// Report Pages
import SalesReport from "./pages/SalesReport";
import PurchaseReport from "./pages/PurchaseReport";
import ProfitLossReport from "./pages/ProfitLossReport";
import StockReport from "./pages/StockReport";
import StockDetails from "./pages/StockDetails";
import LedgerReport from "./pages/LedgerReport";
import SalesReturnReport from "./pages/SalesReturnReport";
import PurchaseReturnReport from "./pages/PurchaseReturnReport";
import StockMovementReport from "./pages/StockMovementReport";
import DeadStockReport from "./pages/DeadStockReport";
import DueReport from "./pages/DueReport";
import PaymentReport from "./pages/PaymentReport";
import CustomerAnalyticsReport from "./pages/CustomerAnalyticsReport";
import SupplierAnalyticsReport from "./pages/SupplierAnalyticsReport";

// Components
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =========================
            AUTH ROUTES
        ========================== */}

        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        {/* Store Selection After Login */}
        <Route
          path="/select-store"
          element={
            <ProtectedRoute>
              <SelectStore />
            </ProtectedRoute>
          }
        />

        {/* =========================
            DASHBOARD ROUTES
        ========================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >

          {/* Dashboard Home */}
          <Route index element={<DashboardHome />} />

          {/* Stores */}
          <Route path="stores" element={<StoreList />} />
          <Route path="stores/add" element={<AddStore />} />
          <Route path="stores/:id" element={<StoreDetails />} />

          {/* Products */}
          <Route path="products" element={<Products />} />

          {/* Categories */}
          <Route path="categories" element={<CategoryPage />} />

          {/* Purchases */}
          <Route path="purchase" element={<PurchaseList />} />
          <Route path="purchase/create" element={<PurchaseCreate />} />
          <Route path="purchase/returns" element={<PurchaseReturnList />} />
          <Route path="purchase/returns/:id" element={<PurchaseReturnDetails />} />
          <Route path="purchase/:id" element={<PurchaseDetails />} />

          {/* Sales */}
          <Route path="sales" element={<SalesList />} />
          <Route path="sales/create" element={<SalesCreate />} />
          <Route path="sales/returns" element={<SalesReturnList />} />
          <Route path="sales/returns/:id" element={<SalesReturnDetails />} />
          <Route path="sales/:id" element={<SalesDetails />} />

          {/* Employees */}
          <Route path="employees" element={<Employees />} />

          {/* Reports Home */}
          <Route path="reports" element={<Reports />} />

          {/* Report Pages */}
          <Route path="reports/sales" element={<SalesReport />} />
          <Route path="reports/purchases" element={<PurchaseReport />} />
          <Route path="reports/profit-loss" element={<ProfitLossReport />} />
          <Route path="reports/stock" element={<StockReport />} />
          <Route  path="reports/stock/:id"  element={<StockDetails />}/>
          <Route path="reports/ledger" element={<LedgerReport />} />
          <Route path="reports/sales-returns" element={<SalesReturnReport />} />
          <Route path="reports/purchase-returns" element={<PurchaseReturnReport />} />
          <Route path="reports/stock-movement" element={<StockMovementReport />} />
          <Route path="reports/dead-stock" element={<DeadStockReport />} />
          <Route path="reports/dues" element={<DueReport />} />
          <Route path="reports/payments" element={<PaymentReport />} />
          <Route
            path="reports/customer-analytics"
            element={<CustomerAnalyticsReport />}
          />
          <Route
            path="reports/supplier-analytics"
            element={<SupplierAnalyticsReport />}
          />

          {/* Settings */}
          <Route path="settings" element={<Settings />} />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;