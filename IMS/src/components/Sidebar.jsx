// =============================================
// 📁 src/components/Sidebar.jsx
// IMS Admin Sidebar — Fixed + Stable
// =============================================

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Css/Sidebar.css";

import {
  LayoutDashboard,
  Store,
  Package,
  Boxes,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

import api from "../services/api";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [openMenu, setOpenMenu] = useState(null);
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);
  const [stores, setStores] = useState([]);

  const currentStore = localStorage.getItem("storeName");

  const toggleMenu = (menuKey) =>
    setOpenMenu(openMenu === menuKey ? null : menuKey);

  const isActive = (path) =>
    location.pathname.startsWith(path);

  const handleLogout = () => {
    localStorage.removeItem("storeId");
    localStorage.removeItem("storeName");
    localStorage.removeItem("user");

    window.location.href = "/";
  };

  /* =========================================
     FETCH STORES
  ========================================= */
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get("/stores");

        const storesData = res.data?.stores || [];

        setStores(storesData);

      } catch (err) {
        console.error("Failed to load stores", err);
        setStores([]);
      }
    };

    fetchStores();
  }, []);

  /* =========================================
     SWITCH STORE
  ========================================= */
  const switchStore = (store) => {
    if (!store?._id) return;

    localStorage.setItem("storeId", store._id);
    localStorage.setItem("storeName", store.name);

    setStoreMenuOpen(false);

    window.location.reload();
  };

  const menuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      path: "/dashboard",
    },

    // ✅ ONLY ONE STORE DROPDOWN NOW
    {
      key: "stores",
      label: "Stores",
      icon: <Store size={18} />,
      children: [
        { label: "All Stores", path: "/dashboard/stores" },
        { label: "Add Store", path: "/dashboard/stores/add" },
      ],
    },

    // ✅ PRODUCTS DIRECT LINK
    {
      key: "products",
      label: "Products",
      icon: <Package size={18} />,
      path: "/dashboard/products",
    },

    {
      key: "categories",
      label: "Categories",
      icon: <Boxes size={18} />,
      path: "/dashboard/categories",
    },

    {
      key: "purchase",
      label: "Purchase",
      icon: <Package size={18} />,
      children: [
        { label: "All Purchases", path: "/dashboard/purchase" },
        { label: "Create Purchase", path: "/dashboard/purchase/create" },
        { label: "Purchase Returns", path: "/dashboard/purchase/returns" },
      ],
    },

    {
      key: "sales",
      label: "Sales",
      icon: <BarChart3 size={18} />,
      children: [
        { label: "All Sales", path: "/dashboard/sales" },
        { label: "Create Sale", path: "/dashboard/sales/create" },
        { label: "Sales Returns", path: "/dashboard/sales/returns" },
      ],
    },

    {
      key: "employees",
      label: "Employees",
      icon: <Users size={18} />,
      path: "/dashboard/employees",
    },

    // ✅ REPORTS DROPDOWN
    {
      key: "reports",
      label: "Reports",
      icon: <BarChart3 size={18} />,
      children: [
        { label: "Sales Report", path: "/dashboard/reports/sales" },
        { label: "Purchase Report", path: "/dashboard/reports/purchases" },
        { label: "Profit & Loss", path: "/dashboard/reports/profit-loss" },
        { label: "Stock Report", path: "/dashboard/reports/stock" },
        { label: "Ledger Report", path: "/dashboard/reports/ledger" },
        { label: "Sales Return Report", path: "/dashboard/reports/sales-returns" },
        { label: "Purchase Return Report", path: "/dashboard/reports/purchase-returns" },
        { label: "Stock Movement", path: "/dashboard/reports/stock-movement" },
        { label: "Dead Stock Report", path: "/dashboard/reports/dead-stock" },
        { label: "Due Report", path: "/dashboard/reports/dues" },
        { label: "Payment Report", path: "/dashboard/reports/payments" },
        { label: "Customer Analytics", path: "/dashboard/reports/customer-analytics" },
        { label: "Supplier Analytics", path: "/dashboard/reports/supplier-analytics" },
      ],
    },

    {
      key: "settings",
      label: "Settings",
      icon: <Settings size={18} />,
      path: "/dashboard/settings",
    },
  ];

  return (
    <aside className="ims-sidebar">

      {/* Header */}
      <div className="ims-sidebar-header">

        <div className="sidebar-title">
          IMS Admin
        </div>

      </div>

      {/* Navigation */}
      <ul className="ims-sidebar-nav">

        {menuItems.map((item) =>
          item.children ? (
            <li key={item.key}>
              <button
                type="button"
                className={`ims-nav-item ims-dropdown ${
                  openMenu === item.key ? "open" : ""
                }`}
                onClick={() => toggleMenu(item.key)}
              >
                <span className="ims-nav-left">
                  {item.icon}
                  <span>{item.label}</span>
                </span>

                <span className="ims-arrow">
                  {openMenu === item.key ? "▲" : "▼"}
                </span>
              </button>

              {openMenu === item.key && (
                <ul className="ims-submenu">

                  {item.children.map((sub) => (
                    <li key={sub.path}>
                      <Link
                        to={sub.path}
                        className={
                          isActive(sub.path) ? "active" : ""
                        }
                      >
                        {sub.label}
                      </Link>
                    </li>
                  ))}

                </ul>
              )}

            </li>
          ) : (
            <li key={item.key}>
              <Link
                to={item.path}
                className={`ims-nav-item ${
                  isActive(item.path) ? "active" : ""
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            </li>
          )
        )}

      </ul>

      {/* Footer */}
      <div className="ims-sidebar-footer">

        <button
          className="ims-nav-item logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
};

export default Sidebar;