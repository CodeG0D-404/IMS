import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/PaymentReport.css";

export default function PaymentReport() {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);

  const [loading, setLoading] = useState(true);

  const [typeFilter, setTypeFilter] =
    useState("all");

  const [modeFilter, setModeFilter] =
    useState("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, purchaseRes] =
          await Promise.all([
            api.get("/sales"),
            api.get("/purchases"),
          ]);

        setSales(getData(salesRes) || []);
        setPurchases(getData(purchaseRes) || []);

      } catch (err) {
        console.error(
          "Failed to load payment report",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ================= MERGE DATA ================= */
  const allPayments = useMemo(() => {

    const salesPayments = sales.map((s) => ({
      ...s,
      source: "SALE",
      partyName:
        s.party?.name || "Walk-in",
    }));

    const purchasePayments =
      purchases.map((p) => ({
        ...p,
        source: "PURCHASE",
        partyName:
          p.party?.name || "—",
      }));

    return [
      ...salesPayments,
      ...purchasePayments,
    ];

  }, [sales, purchases]);

  /* ================= FILTER ================= */
  const filteredPayments = useMemo(() => {

    return allPayments.filter((item) => {

      const matchesType =
        typeFilter === "all" ||
        item.source === typeFilter;

      const matchesMode =
        modeFilter === "all" ||
        item.paymentMode?.toLowerCase() ===
          modeFilter.toLowerCase();

      const itemDate = new Date(
        item.createdAt
      );

      const matchesStart =
        !startDate ||
        itemDate >= new Date(startDate);

      const matchesEnd =
        !endDate ||
        itemDate <= new Date(endDate);

      return (
        matchesType &&
        matchesMode &&
        matchesStart &&
        matchesEnd
      );
    });

  }, [
    allPayments,
    typeFilter,
    modeFilter,
    startDate,
    endDate,
  ]);

  /* ================= SUMMARY ================= */
  const totalReceived = filteredPayments
    .filter((p) => p.source === "SALE")
    .reduce(
      (sum, p) =>
        sum + (p.paidAmount || 0),
      0
    );

  const totalPaid = filteredPayments
    .filter((p) => p.source === "PURCHASE")
    .reduce(
      (sum, p) =>
        sum + (p.paidAmount || 0),
      0
    );

  const cashTotal = filteredPayments
    .filter(
      (p) =>
        p.paymentMode?.toLowerCase() ===
        "cash"
    )
    .reduce(
      (sum, p) =>
        sum + (p.paidAmount || 0),
      0
    );

  const upiTotal = filteredPayments
    .filter(
      (p) =>
        p.paymentMode?.toLowerCase() ===
        "upi"
    )
    .reduce(
      (sum, p) =>
        sum + (p.paidAmount || 0),
      0
    );

  /* ================= UI ================= */
  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="payment-report-page">

      <div className="report-header">
        <h2>Payment Report</h2>
      </div>

      {/* FILTERS */}
      <div className="filters">

        <div className="filter-group">

          <label>Transaction Type</label>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value)
            }
          >
            <option value="all">
              All
            </option>

            <option value="SALE">
              Sales
            </option>

            <option value="PURCHASE">
              Purchases
            </option>

          </select>

        </div>

        <div className="filter-group">

          <label>Payment Mode</label>

          <select
            value={modeFilter}
            onChange={(e) =>
              setModeFilter(e.target.value)
            }
          >
            <option value="all">
              All
            </option>

            <option value="cash">
              Cash
            </option>

            <option value="upi">
              UPI
            </option>

            <option value="cheque">
              Cheque
            </option>

          </select>

        </div>

        <div className="filter-group">

          <label>Start Date</label>

          <input
            type="date"
            value={startDate}
            onChange={(e) =>
              setStartDate(e.target.value)
            }
          />

        </div>

        <div className="filter-group">

          <label>End Date</label>

          <input
            type="date"
            value={endDate}
            onChange={(e) =>
              setEndDate(e.target.value)
            }
          />

        </div>

      </div>

      {/* SUMMARY */}
      <div className="summary-grid">

        <div className="summary-card receive-card">

          <h4>Total Received</h4>

          <p>₹{totalReceived}</p>

        </div>

        <div className="summary-card paid-card">

          <h4>Total Paid</h4>

          <p>₹{totalPaid}</p>

        </div>

        <div className="summary-card cash-card">

          <h4>Cash Transactions</h4>

          <p>₹{cashTotal}</p>

        </div>

        <div className="summary-card upi-card">

          <h4>UPI Transactions</h4>

          <p>₹{upiTotal}</p>

        </div>

      </div>

      {/* TABLE */}
      <div className="table-wrapper">

        <table className="report-table">

          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Party</th>
              <th>Invoice</th>
              <th>Payment Mode</th>
              <th>Paid Amount</th>
            </tr>
          </thead>

          <tbody>

            {filteredPayments.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="no-data"
                >
                  No payments found
                </td>
              </tr>
            ) : (
              filteredPayments.map((item) => (
                <tr key={item._id}>

                  <td>
                    {new Date(
                      item.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    <span
                      className={
                        item.source === "SALE"
                          ? "sale-type"
                          : "purchase-type"
                      }
                    >
                      {item.source}
                    </span>
                  </td>

                  <td>
                    {item.partyName}
                  </td>

                  <td>
                    {item.invoiceNumber || "—"}
                  </td>

                  <td>
                    {item.paymentMode || "—"}
                  </td>

                  <td>
                    ₹{item.paidAmount || 0}
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}