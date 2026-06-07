import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { getData } from "../utils/apiResponse";

import "./Css/SalesReport.css";

export default function SalesReport() {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [paymentModes, setPaymentModes] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  /* ===============================
     FETCH DATA
  =============================== */
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const [salesRes, paymentRes] =
          await Promise.all([
            api.get("/sales"),
            api.get(
              "/ledger/sales-payment-modes"
            ),
          ]);

        const salesData =
          getData(salesRes) || [];

        const paymentData =
          getData(paymentRes) || [];

        const paymentMap = {};

        paymentData.forEach((entry) => {
          paymentMap[
            entry.referenceId
          ] = entry.paymentMode;
        });

        setSales(salesData);
        setPaymentModes(paymentMap);

      } catch (error) {
        console.error(
          "Failed to load sales report",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  /* ===============================
     FILTER
  =============================== */
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {

      const customer =
        sale.party?.name?.toLowerCase() ||
        "";

      const invoice =
        sale.invoiceNumber?.toLowerCase() ||
        "";

      const searchText =
        search.toLowerCase();

      const matchesSearch =
        customer.includes(searchText) ||
        invoice.includes(searchText);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : sale.status ===
            statusFilter;

      const saleDate = new Date(
        sale.saleDate ||
          sale.createdAt
      );

      const matchesStart =
        !startDate ||
        saleDate >=
          new Date(startDate);

      const matchesEnd =
        !endDate ||
        saleDate <=
          new Date(endDate);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [
    sales,
    search,
    statusFilter,
    startDate,
    endDate,
  ]);

  /* ===============================
     SUMMARY
  =============================== */

  const totalSales =
    filteredSales.reduce(
      (sum, sale) =>
        sum +
        (sale.totalAmount || 0),
      0
    );

  const totalReceived =
    filteredSales.reduce(
      (sum, sale) =>
        sum +
        (sale.paidAmount || 0),
      0
    );

  const totalDue =
    filteredSales.reduce(
      (sum, sale) =>
        sum +
        Math.max(
          sale.dueAmount || 0,
          0
        ),
      0
    );

  const totalAdvance =
    filteredSales.reduce(
      (sum, sale) =>
        sale.dueAmount < 0
          ? sum +
            Math.abs(
              sale.dueAmount
            )
          : sum,
      0
    );

  const collectionRate =
    totalSales > 0
      ? (
          (totalReceived /
            totalSales) *
          100
        ).toFixed(1)
      : 0;

  /* ===============================
     BADGES
  =============================== */

  const getStatusClass = (
    status
  ) => {
    switch (status) {
      case "PAID":
        return "status-paid";

      case "PARTIAL":
        return "status-partial";

      case "UNPAID":
        return "status-unpaid";

      case "ADVANCE":
        return "status-advance";

      default:
        return "";
    }
  };

  const getPaymentClass = (
    mode
  ) => {
    switch (
      mode?.toLowerCase()
    ) {
      case "cash":
        return "payment-cash";

      case "upi":
        return "payment-upi";

      case "cheque":
        return "payment-cheque";

      case "bank":
        return "payment-bank";

      default:
        return "payment-unknown";
    }
  };

  /* ===============================
     UI
  =============================== */

  if (loading) {
    return (
      <p className="loading">
        Loading...
      </p>
    );
  }

  return (
    <div className="sales-report-page">

      {/* HEADER */}

      <div className="report-header">
        <h2>Sales Report</h2>
      </div>

      {/* FILTERS */}

      <div className="filters-card">

        <div className="filters">

          <div className="filter-group">
            <label>
              Search
            </label>

            <input
              type="text"
              placeholder="Customer / Invoice"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />
          </div>

          <div className="filter-group">
            <label>
              Status
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
            >
              <option value="all">
                All
              </option>

              <option value="PAID">
                Paid
              </option>

              <option value="PARTIAL">
                Partial
              </option>

              <option value="UNPAID">
                Unpaid
              </option>

              <option value="ADVANCE">
                Advance
              </option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }
            />
          </div>

          <div className="filter-group">
            <label>
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }
            />
          </div>

        </div>

      </div>

      {/* KPI */}

      <div className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-label">
            Total Sales
          </div>

          <div className="kpi-value sales-value">
            ₹
            {totalSales.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Amount Received
          </div>

          <div className="kpi-value received-value">
            ₹
            {totalReceived.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Receivables
          </div>

          <div className="kpi-value due-value">
            ₹
            {totalDue.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Customer Advance
          </div>

          <div className="kpi-value advance-value">
            ₹
            {totalAdvance.toLocaleString()}
          </div>
        </div>

      </div>

      {/* HERO */}

      <div className="hero-card">

        <div className="hero-title">
          Collection Rate
        </div>

        <div className="hero-value">
          {collectionRate}%
        </div>

        <div className="hero-subtitle">
          Amount Received ÷ Total
          Sales
        </div>

      </div>

      {/* TABLE */}

      <div className="table-card">

        <table className="report-table">

          <thead>

            <tr>
              <th>Date</th>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Received</th>
              <th>Due</th>
              <th>Payment Mode</th>
              <th>Status</th>
              <th>Action</th>
            </tr>

          </thead>

          <tbody>

            {filteredSales.length ===
            0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="no-data"
                >
                  No sales found
                </td>
              </tr>
            ) : (
              filteredSales.map(
                (sale) => (
                  <tr
                    key={sale._id}
                  >

                    <td>
                      {new Date(
                        sale.saleDate ||
                          sale.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {sale.invoiceNumber ||
                        "—"}
                    </td>

                    <td>
                      {sale.party
                        ?.name ||
                        "Walk-in"}
                    </td>

                    <td>
                      ₹
                      {(
                        sale.totalAmount ||
                        0
                      ).toLocaleString()}
                    </td>

                    <td>
                      ₹
                      {(
                        sale.paidAmount ||
                        0
                      ).toLocaleString()}
                    </td>

                    <td>
                      {(sale.dueAmount ||
                        0) >
                      0 ? (
                        <span className="due-text">
                          ₹
                          {sale.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td>

                      <span
                        className={`payment-badge ${getPaymentClass(
                          paymentModes[
                            sale._id
                          ]
                        )}`}
                      >
                        {paymentModes[
                          sale._id
                        ] || "—"}
                      </span>

                    </td>

                    <td>

                      <span
                        className={`status-badge ${getStatusClass(
                          sale.status
                        )}`}
                      >
                        {
                          sale.status
                        }
                      </span>

                    </td>

                    <td>

                      <button
                        className="view-btn"
                        onClick={() =>
                          navigate(
                            `/dashboard/sales/${sale._id}`
                          )
                        }
                      >
                        View
                      </button>

                    </td>

                  </tr>
                )
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}