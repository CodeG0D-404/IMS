import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/DeadStockReport.css";

export default function DeadStockReport() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState("sold");

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchLots = async () => {
      try {
        const res = await api.get("/stock-lots");

        setLots(getData(res) || []);

      } catch (err) {
        console.error(
          "Failed to fetch stock lots",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLots();
  }, []);

  /* ================= FILTER ================= */
  const filteredLots = useMemo(() => {

    return lots.filter((lot) => {

      const product =
        lot.product?.name?.toLowerCase() || "";

      const matchesSearch =
        product.includes(search.toLowerCase());

      let matchesFilter = true;

      if (filter === "sold") {
        matchesFilter =
          (lot.remainingQty || 0) === 0;
      }

      if (filter === "active") {
        matchesFilter =
          (lot.remainingQty || 0) > 0;
      }

      return (
        matchesSearch &&
        matchesFilter
      );
    });

  }, [lots, search, filter]);

  /* ================= SUMMARY ================= */
  const soldOutLots = lots.filter(
    (l) => (l.remainingQty || 0) === 0
  ).length;

  const activeLots = lots.filter(
    (l) => (l.remainingQty || 0) > 0
  ).length;

  const totalInventoryValue = lots.reduce(
    (sum, lot) =>
      sum +
      (
        (lot.remainingQty || 0) *
        (lot.purchasePrice ||
          lot.costPrice ||
          0)
      ),
    0
  );

  /* ================= UI ================= */
  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="dead-stock-page">

      <div className="report-header">
        <h2>Lot Status Report</h2>
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

          <label>Lot Status</label>

          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value)
            }
          >
            <option value="sold">
              Sold Out Lots
            </option>

            <option value="active">
              Active Lots
            </option>

          </select>

        </div>

      </div>

      {/* SUMMARY */}
      <div className="summary-grid">

        <div className="summary-card sold-card">

          <h4>Sold Out Lots</h4>

          <p>{soldOutLots}</p>

        </div>

        <div className="summary-card active-card">

          <h4>Active Lots</h4>

          <p>{activeLots}</p>

        </div>

        <div className="summary-card">

          <h4>Inventory Value</h4>

          <p>₹{totalInventoryValue}</p>

        </div>

      </div>

      {/* TABLE */}
      <div className="table-wrapper">

        <table className="report-table">

          <thead>
            <tr>
              <th>Lot</th>
              <th>Product</th>
              <th>Initial Qty</th>
              <th>Remaining Qty</th>
              <th>Purchase Price</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>

            {filteredLots.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="no-data"
                >
                  No lots found
                </td>
              </tr>
            ) : (
              filteredLots.map((lot) => (
                <tr key={lot._id}>

                  <td>
                    {lot._id.slice(-6)}
                  </td>

                  <td>
                    {lot.product?.name || "—"}
                  </td>

                  <td>
                    {lot.quantity || 0}
                  </td>

                  <td>
                    {lot.remainingQty || 0}
                  </td>

                  <td>
                    ₹{
                      lot.purchasePrice ||
                      lot.costPrice ||
                      0
                    }
                  </td>

                  <td>
                    {(lot.remainingQty || 0) === 0 ? (
                      <span className="sold-out">
                        Sold Out
                      </span>
                    ) : (
                      <span className="active">
                        Active
                      </span>
                    )}
                  </td>

                  <td>
                    {new Date(
                      lot.createdAt
                    ).toLocaleDateString()}
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