import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { getData } from "../utils/apiResponse";

import "./Css/PurchaseReport.css";

export default function PurchaseReport() {
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState([]);
  const [paymentModes, setPaymentModes] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  /* =====================================
     FETCH DATA
  ===================================== */
  useEffect(() => {
    const fetchData = async () => {
      try {

        const [
          purchasesRes,
          paymentRes,
        ] = await Promise.all([
          api.get("/purchases"),
          api.get(
            "/ledger/purchase-payment-modes"
          ),
        ]);

        const purchasesData =
          getData(purchasesRes) || [];

        const paymentData =
          getData(paymentRes) || [];

        const paymentMap = {};

        paymentData.forEach((entry) => {
          paymentMap[
            entry.referenceId
          ] = entry.paymentMode;
        });

        setPurchases(
          purchasesData
        );

        setPaymentModes(
          paymentMap
        );

      } catch (error) {
        console.error(
          "Failed to load purchase report",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* =====================================
     FILTER
  ===================================== */
  const filteredPurchases =
    useMemo(() => {

      return purchases.filter(
        (purchase) => {

          const supplier =
            purchase.party?.name?.toLowerCase() ||
            "";

          const invoice =
            purchase.invoiceNumber?.toLowerCase() ||
            "";

          const searchText =
            search.toLowerCase();

          const matchesSearch =
            supplier.includes(
              searchText
            ) ||
            invoice.includes(
              searchText
            );

          let matchesStatus =
            true;

          const due =
            purchase.dueAmount ??
            (
              (purchase.totalAmount ||
                0) -
              (purchase.paidAmount ||
                0)
            );

          if (
            statusFilter ===
            "PAID"
          ) {
            matchesStatus =
              due === 0;
          }

          if (
            statusFilter ===
            "PARTIAL"
          ) {
            matchesStatus =
              due > 0 &&
              purchase.paidAmount >
                0;
          }

          if (
            statusFilter ===
            "UNPAID"
          ) {
            matchesStatus =
              due > 0 &&
              (
                purchase.paidAmount ||
                0
              ) === 0;
          }

          if (
            statusFilter ===
            "ADVANCE"
          ) {
            matchesStatus =
              due < 0;
          }

          const purchaseDate =
            new Date(
              purchase.purchaseDate ||
                purchase.createdAt
            );

          const matchesStart =
            !startDate ||
            purchaseDate >=
              new Date(
                startDate
              );

          const matchesEnd =
            !endDate ||
            purchaseDate <=
              new Date(
                endDate
              );

          return (
            matchesSearch &&
            matchesStatus &&
            matchesStart &&
            matchesEnd
          );
        }
      );
    }, [
      purchases,
      search,
      statusFilter,
      startDate,
      endDate,
    ]);

  /* =====================================
     SUMMARY
  ===================================== */

  const totalPurchases =
    filteredPurchases.reduce(
      (sum, purchase) =>
        sum +
        (
          purchase.totalAmount ||
          0
        ),
      0
    );

  const totalPaid =
    filteredPurchases.reduce(
      (sum, purchase) =>
        sum +
        (
          purchase.paidAmount ||
          0
        ),
      0
    );

  const totalPayable =
    filteredPurchases.reduce(
      (sum, purchase) => {

        const due =
          purchase.dueAmount ??
          (
            (purchase.totalAmount ||
              0) -
            (purchase.paidAmount ||
              0)
          );

        return (
          sum +
          Math.max(
            due,
            0
          )
        );
      },
      0
    );

  const totalAdvance =
    filteredPurchases.reduce(
      (sum, purchase) => {

        const due =
          purchase.dueAmount ??
          (
            (purchase.totalAmount ||
              0) -
            (purchase.paidAmount ||
              0)
          );

        return due < 0
          ? sum +
              Math.abs(
                due
              )
          : sum;
      },
      0
    );

  const settlementRate =
    totalPurchases > 0
      ? (
          (totalPaid /
            totalPurchases) *
          100
        ).toFixed(1)
      : 0;

  /* =====================================
     BADGES
  ===================================== */

  const getStatus = (
    purchase
  ) => {

    const due =
      purchase.dueAmount ??
      (
        (purchase.totalAmount ||
          0) -
        (purchase.paidAmount ||
          0)
      );

    if (due < 0)
      return "ADVANCE";

    if (due === 0)
      return "PAID";

    if (
      purchase.paidAmount >
      0
    )
      return "PARTIAL";

    return "UNPAID";
  };

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

  /* =====================================
     UI
  ===================================== */

  if (loading) {
    return (
      <p className="loading">
        Loading...
      </p>
    );
  }

  return (
    <div className="purchase-report-page">

      {/* HEADER */}

      <div className="report-header">
        <h2>
          Purchase Report
        </h2>
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
              placeholder="Supplier / Invoice"
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
              value={
                statusFilter
              }
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
            Total Purchases
          </div>

          <div className="kpi-value purchases-value">
            ₹
            {totalPurchases.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Amount Paid
          </div>

          <div className="kpi-value paid-value">
            ₹
            {totalPaid.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Payables
          </div>

          <div className="kpi-value due-value">
            ₹
            {totalPayable.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Supplier Advance
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
          Settlement Rate
        </div>

        <div className="hero-value">
          {settlementRate}%
        </div>

        <div className="hero-subtitle">
          Amount Paid ÷ Total Purchases
        </div>

      </div>

      {/* TABLE */}

      <div className="table-card">

        <table className="report-table">

          <thead>
            <tr>
              <th>Date</th>
              <th>Invoice</th>
              <th>Supplier</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Payable</th>
              <th>Payment Mode</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredPurchases.length ===
            0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="no-data"
                >
                  No purchases found
                </td>
              </tr>
            ) : (
              filteredPurchases.map(
                (
                  purchase
                ) => {

                  const due =
                    purchase.dueAmount ??
                    (
                      (
                        purchase.totalAmount ||
                        0
                      ) -
                      (
                        purchase.paidAmount ||
                        0
                      )
                    );

                  const status =
                    getStatus(
                      purchase
                    );

                  return (
                    <tr
                      key={
                        purchase._id
                      }
                    >

                      <td>
                        {new Date(
                          purchase.purchaseDate ||
                            purchase.createdAt
                        ).toLocaleDateString()}
                      </td>

                      <td>
                        {purchase.invoiceNumber ||
                          "—"}
                      </td>

                      <td>
                        {purchase
                          .party
                          ?.name ||
                          "—"}
                      </td>

                      <td>
                        ₹
                        {(
                          purchase.totalAmount ||
                          0
                        ).toLocaleString()}
                      </td>

                      <td>
                        ₹
                        {(
                          purchase.paidAmount ||
                          0
                        ).toLocaleString()}
                      </td>

                      <td>
                        {due >
                        0 ? (
                          <span className="due-text">
                            ₹
                            {due.toLocaleString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>

                        <span
                          className={`payment-badge ${getPaymentClass(
                            paymentModes[
                              purchase
                                ._id
                            ]
                          )}`}
                        >
                          {paymentModes[
                            purchase
                              ._id
                          ] ||
                            "—"}
                        </span>

                      </td>

                      <td>

                        <span
                          className={`status-badge ${getStatusClass(
                            status
                          )}`}
                        >
                          {
                            status
                          }
                        </span>

                      </td>

                      <td>

                        <button
                          className="view-btn"
                          onClick={() =>
                            navigate(
                              `/dashboard/purchase/${purchase._id}`
                            )
                          }
                        >
                          View
                        </button>

                      </td>

                    </tr>
                  );
                }
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}