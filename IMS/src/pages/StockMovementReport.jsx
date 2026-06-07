import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/StockMovementReport.css";

export default function StockMovementReport() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await api.get("/stock-transactions");

        setTransactions(getData(res) || []);

      } catch (err) {
        console.error(
          "Failed to fetch stock movements",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  /* ================= FILTER ================= */
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {

      const product =
        tx.product?.name?.toLowerCase() || "";

      const matchesSearch =
        product.includes(search.toLowerCase());

      const matchesType =
        !typeFilter ||
        tx.type === typeFilter;

      const txDate = new Date(
        tx.createdAt
      );

      const matchesStart =
        !startDate ||
        txDate >= new Date(startDate);

      const matchesEnd =
        !endDate ||
        txDate <= new Date(endDate);

      return (
        matchesSearch &&
        matchesType &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [
    transactions,
    search,
    typeFilter,
    startDate,
    endDate,
  ]);

  /* ================= SUMMARY ================= */
  const totalIn = filteredTransactions
    .filter((t) => t.quantity > 0)
    .reduce(
      (sum, t) => sum + (t.quantity || 0),
      0
    );

  const totalOut = filteredTransactions
    .filter((t) => t.quantity < 0)
    .reduce(
      (sum, t) =>
        sum + Math.abs(t.quantity || 0),
      0
    );

  /* ================= TYPE BADGE ================= */
  const getTypeClass = (type) => {
    switch (type) {
      case "PURCHASE_IN":
        return "purchase";

      case "SALE_OUT":
        return "sale";

      case "SALES_RETURN_IN":
        return "sales-return";

      case "PURCHASE_RETURN_OUT":
        return "purchase-return";

      case "ADJUSTMENT":
        return "adjustment";

      default:
        return "default";
    }
  };

  /* ================= UI ================= */
  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="stock-movement-page">

      <div className="report-header">
        <h2>Stock Movement Report</h2>
      </div>

      {/* FILTERS */}
      <div className="filters">

        <div className="filter-group">

          <label>Search Product</label>

          <input
            type="text"
            placeholder="Product name..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

        </div>

        <div className="filter-group">

          <label>Movement Type</label>

          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value)
            }
          >
            <option value="">
              All Types
            </option>

            <option value="PURCHASE_IN">
              PURCHASE_IN
            </option>

            <option value="SALE_OUT">
              SALE_OUT
            </option>

            <option value="SALES_RETURN_IN">
              SALES_RETURN_IN
            </option>

            <option value="PURCHASE_RETURN_OUT">
              PURCHASE_RETURN_OUT
            </option>

            <option value="ADJUSTMENT">
              ADJUSTMENT
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

        <div className="summary-card in-card">

          <h4>Total Stock In</h4>

          <p>{totalIn}</p>

        </div>

        <div className="summary-card out-card">

          <h4>Total Stock Out</h4>

          <p>{totalOut}</p>

        </div>

        <div className="summary-card">

          <h4>Total Transactions</h4>

          <p>{filteredTransactions.length}</p>

        </div>

      </div>

      {/* TABLE */}
      <div className="table-wrapper">

        <table className="report-table">

          <thead>
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Reference</th>
            </tr>
          </thead>

          <tbody>

            {filteredTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="no-data"
                >
                  No stock movements found
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => (
                <tr key={tx._id}>

                  <td>
                    {new Date(
                      tx.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    {tx.product?.name || "—"}
                  </td>

                  <td>
                    <span
                      className={`tag ${getTypeClass(
                        tx.type
                      )}`}
                    >
                      {tx.type}
                    </span>
                  </td>

                  <td
                    className={
                      tx.quantity > 0
                        ? "in-text"
                        : "out-text"
                    }
                  >
                    {tx.quantity > 0 ? "+" : ""}
                    {tx.quantity}
                  </td>

                  <td>
                    {tx.reference || "—"}
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