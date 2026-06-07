import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/PurchaseReturnReport.css";

export default function PurchaseReturnReport() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await api.get("/purchase-returns");

        setReturns(getData(res) || []);

      } catch (err) {
        console.error("Failed to fetch purchase returns", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);

  /* ================= FILTER ================= */
  const filteredReturns = useMemo(() => {
    return returns.filter((ret) => {

      const supplier =
        ret.party?.name?.toLowerCase() || "";

      const matchesSearch =
        supplier.includes(search.toLowerCase());

      const returnDate = new Date(
        ret.returnDate || ret.createdAt
      );

      const matchesStart =
        !startDate ||
        returnDate >= new Date(startDate);

      const matchesEnd =
        !endDate ||
        returnDate <= new Date(endDate);

      return (
        matchesSearch &&
        matchesStart &&
        matchesEnd
      );
    });
  }, [returns, search, startDate, endDate]);

  /* ================= SUMMARY ================= */
  const totalReturns = filteredReturns.reduce(
    (sum, r) => sum + (r.totalAmount || 0),
    0
  );

  const totalRefunds = filteredReturns
    .filter((r) => r.adjustmentType === "REFUND")
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const totalAdjustments = filteredReturns
    .filter((r) => r.adjustmentType === "ADJUST")
    .length;

  const totalReplacements = filteredReturns
    .filter((r) => r.adjustmentType === "REPLACE")
    .length;

  const getTypeClass = (type) => {
    switch (type) {
      case "ADJUST":
        return "tag adjust";

      case "REFUND":
        return "tag refund";

      case "REPLACE":
        return "tag replace";

      default:
        return "tag";
    }
  };

  /* ================= UI ================= */
  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="purchase-return-report-page">

      <div className="report-header">
        <h2>Purchase Return Report</h2>
      </div>

      {/* FILTERS */}
      <div className="filters">

        <div className="filter-group">

          <label>Search Supplier</label>

          <input
            type="text"
            placeholder="Supplier name..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

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

        <div className="summary-card">
          <h4>Total Return Amount</h4>
          <p>₹{totalReturns}</p>
        </div>

        <div className="summary-card refund-card">
          <h4>Total Refunds</h4>
          <p>₹{totalRefunds}</p>
        </div>

        <div className="summary-card adjust-card">
          <h4>Adjustments</h4>
          <p>{totalAdjustments}</p>
        </div>

        <div className="summary-card replace-card">
          <h4>Replacements</h4>
          <p>{totalReplacements}</p>
        </div>

      </div>

      {/* TABLE */}
      <div className="table-wrapper">

        <table className="report-table">

          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Supplier</th>
              <th>Type</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>

            {filteredReturns.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="no-data"
                >
                  No purchase returns found
                </td>
              </tr>
            ) : (
              filteredReturns.map((ret) => (
                <tr key={ret._id}>

                  <td>
                    {new Date(
                      ret.returnDate || ret.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    {ret.referenceNumber || "—"}
                  </td>

                  <td>
                    {ret.party?.name || "—"}
                  </td>

                  <td>
                    <span
                      className={getTypeClass(
                        ret.adjustmentType
                      )}
                    >
                      {ret.adjustmentType}
                    </span>
                  </td>

                  <td>
                    ₹{ret.totalAmount || 0}
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