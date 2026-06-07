// =============================================
// 📁 src/pages/DashboardHome.jsx
// IMS Executive Dashboard
// =============================================

import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import api from "../services/api";
import { getData } from "../utils/apiResponse";

import "./Css/DashboardHome.css";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#dc2626",
];

export default function DashboardHome() {
  const [loading, setLoading] =
    useState(true);

  const [profit, setProfit] =
    useState(null);

  const [partyOverview, setPartyOverview] =
    useState(null);

  const [inventory, setInventory] =
    useState(null);

  const [lowStock, setLowStock] =
    useState([]);

  const [customers, setCustomers] =
    useState([]);

  const [suppliers, setSuppliers] =
    useState([]);

  const [profitTrend, setProfitTrend] =
    useState([]);

  const [paymentModes, setPaymentModes] =
    useState([]);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const [
        profitRes,
        partyRes,
        inventoryRes,
        lowStockRes,
        customerRes,
        supplierRes,
        trendRes,
        paymentRes,
      ] = await Promise.all([
        api.get(
          "/reports/profit/overview"
        ),

        api.get(
          "/reports/parties/overview"
        ),

        api.get(
          "/stock/total-value"
        ),

        api.get(
          "/stock/low-stock"
        ),

        api.get(
          "/reports/parties/top-customers"
        ),

        api.get(
          "/reports/parties/top-suppliers"
        ),

        api.get(
          "/reports/profit/trend"
        ),

        api.get(
          "/reports/ledger/payment-modes"
        ),
      ]);

      setProfit(
        profitRes.data?.data || {}
      );

      setPartyOverview(
        partyRes.data?.data || {}
      );

      setInventory(
        inventoryRes.data?.data || {}
      );

      setLowStock(
        getData(lowStockRes) || []
      );

      setCustomers(
        getData(customerRes) || []
      );

      setSuppliers(
        getData(supplierRes) || []
      );

      const trend =
        getData(trendRes) || [];

      const formattedTrend =
        trend.map((item) => ({
          date: `${item._id.day}/${item._id.month}`,

          revenue:
            item.revenue || 0,

          profit:
            item.profit || 0,
        }));

      setProfitTrend(
        formattedTrend
      );

      const paymentData =
        getData(paymentRes) || [];

      const pieData =
        paymentData.map(
          (item) => ({
            name:
              item._id?.toUpperCase() ||
              "UNKNOWN",

            value:
              item.totalAmount || 0,
          })
        );

      setPaymentModes(
        pieData
      );
    } catch (error) {
      console.error(
        "Dashboard Error",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (
    value
  ) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        Loading Dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-home">

      {/* HEADER */}

      <div className="dashboard-header">
        <div>
          <h1>
            Business Dashboard
          </h1>

          <p>
            Real-time overview of
            your business
          </p>
        </div>
      </div>

      {/* KPI */}

      <div className="dashboard-grid">

        <div className="dashboard-card revenue">

          <h4>
            Total Revenue
          </h4>

          <h2>
            {formatCurrency(
              profit?.grossRevenue
            )}
          </h2>

        </div>

        <div className="dashboard-card profit">

          <h4>
            Net Profit
          </h4>

          <h2>
            {formatCurrency(
              profit?.netProfit
            )}
          </h2>

        </div>

        <div className="dashboard-card receivable">

          <h4>
            Receivables
          </h4>

          <h2>
            {formatCurrency(
              partyOverview?.receivables
            )}
          </h2>

        </div>

        <div className="dashboard-card payable">

          <h4>
            Payables
          </h4>

          <h2>
            {formatCurrency(
              partyOverview?.payables
            )}
          </h2>

        </div>

      </div>

      {/* CHARTS */}

      <div className="dashboard-row">

        <div className="dashboard-section">

          <div className="section-header">
            <h3>
              Profit Trend
            </h3>
          </div>

          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <LineChart
              data={
                profitTrend
              }
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
              />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="profit"
                stroke="#16a34a"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>

        </div>

        <div className="dashboard-section">

          <div className="section-header">
            <h3>
              Payment Modes
            </h3>
          </div>

          <ResponsiveContainer
            width="100%"
            height={320}
          >
            <PieChart>

              <Pie
                data={
                  paymentModes
                }
                dataKey="value"
                nameKey="name"
                outerRadius={
                  110
                }
                label
              >
                {paymentModes.map(
                  (
                    entry,
                    index
                  ) => (
                    <Cell
                      key={
                        index
                      }
                      fill={
                        COLORS[
                          index %
                            COLORS.length
                        ]
                      }
                    />
                  )
                )}
              </Pie>

              <Tooltip />

            </PieChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* CUSTOMERS & SUPPLIERS */}

      <div className="dashboard-row">

        <div className="dashboard-section">

          <div className="section-header">
            <h3>
              Top Customers
            </h3>
          </div>

          <div className="top-list">

            {customers
              .slice(0, 5)
              .map(
                (
                  customer
                ) => (
                  <div
                    key={
                      customer.partyId
                    }
                    className="top-item"
                  >
                    <div>
                      <strong>
                        {
                          customer.name
                        }
                      </strong>

                      <small>
                        {
                          customer.totalInvoices
                        }{" "}
                        invoices
                      </small>
                    </div>

                    <span>
                      {formatCurrency(
                        customer.totalSales
                      )}
                    </span>
                  </div>
                )
              )}

          </div>

        </div>

        <div className="dashboard-section">

          <div className="section-header">
            <h3>
              Top Suppliers
            </h3>
          </div>

          <div className="top-list">

            {suppliers
              .slice(0, 5)
              .map(
                (
                  supplier
                ) => (
                  <div
                    key={
                      supplier.partyId
                    }
                    className="top-item"
                  >
                    <div>
                      <strong>
                        {
                          supplier.name
                        }
                      </strong>

                      <small>
                        {
                          supplier.totalInvoices
                        }{" "}
                        invoices
                      </small>
                    </div>

                    <span>
                      {formatCurrency(
                        supplier.totalPurchases
                      )}
                    </span>
                  </div>
                )
              )}

          </div>

        </div>

      </div>

      {/* INVENTORY */}

      <div className="dashboard-row">

        <div className="dashboard-section">

          <div className="section-header">
            <h3>
              Inventory
            </h3>
          </div>

          <div className="inventory-card">

            <h2>
              {formatCurrency(
                inventory?.totalValue
              )}
            </h2>

            <p>
              Current Stock
              Value
            </p>

            <h3>
              Qty:{" "}
              {
                inventory?.totalQty
              }
            </h3>

          </div>

        </div>

        <div className="dashboard-section">

          <div className="section-header">
            <h3>
              Low Stock
              Alerts
            </h3>
          </div>

          <div className="alert-list">

            {lowStock.length ===
            0 ? (
              <p>
                No low stock
                products
              </p>
            ) : (
              lowStock
                .slice(0, 5)
                .map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.productId
                      }
                      className="alert-item"
                    >
                      <span>
                        {
                          item.name
                        }
                      </span>

                      <strong>
                        {
                          item.totalQty
                        }
                      </strong>
                    </div>
                  )
                )
            )}

          </div>

        </div>

      </div>

      {/* RETURNS */}

      <div className="dashboard-grid">

        <div className="dashboard-card return-card">

          <h4>
            Gross Profit
          </h4>

          <h2>
            {formatCurrency(
              profit?.grossProfit
            )}
          </h2>

        </div>

        <div className="dashboard-card return-card">

          <h4>
            Return Impact
          </h4>

          <h2>
            {formatCurrency(
              profit?.totalReturnLoss
            )}
          </h2>

        </div>

        <div className="dashboard-card return-card">

          <h4>
            Net Profit
          </h4>

          <h2>
            {formatCurrency(
              profit?.netProfit
            )}
          </h2>

        </div>

      </div>

    </div>
  );
}