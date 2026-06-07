import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/SupplierAnalyticsReport.css";

export default function SupplierAnalyticsReport() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await api.get("/purchases");

        setPurchases(getData(res) || []);

      } catch (err) {
        console.error(
          "Failed to load supplier analytics",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  /* ================= BUILD ANALYTICS ================= */
  const supplierData = useMemo(() => {

    const map = {};

    purchases.forEach((purchase) => {

      const supplier =
        purchase.party;

      if (!supplier?._id) return;

      if (!map[supplier._id]) {
        map[supplier._id] = {
          _id: supplier._id,
          name: supplier.name,
          phone: supplier.phone,
          email: supplier.email,

          totalPurchases: 0,
          totalPaid: 0,
          totalDue: 0,

          billCount: 0,
        };
      }

      map[supplier._id].totalPurchases +=
        purchase.totalAmount || 0;

      map[supplier._id].totalPaid +=
        purchase.paidAmount || 0;

      map[supplier._id].totalDue +=
        (purchase.totalAmount || 0) -
        (purchase.paidAmount || 0);

      map[supplier._id].billCount += 1;

    });

    return Object.values(map);

  }, [purchases]);

  /* ================= FILTER ================= */
  const filteredSuppliers = useMemo(() => {

    return supplierData.filter((s) =>
      s.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  }, [supplierData, search]);

  /* ================= SUMMARY ================= */
  const totalSuppliers =
    filteredSuppliers.length;

  const totalPurchases =
    filteredSuppliers.reduce(
      (sum, s) =>
        sum + s.totalPurchases,
      0
    );

  const totalDue =
    filteredSuppliers.reduce(
      (sum, s) =>
        sum + s.totalDue,
      0
    );

  /* ================= UI ================= */
  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="supplier-analytics-page">

      <div className="report-header">
        <h2>Supplier Analytics</h2>
      </div>

      {/* FILTER */}
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

      </div>

      {/* SUMMARY */}
      <div className="summary-grid">

        <div className="summary-card">

          <h4>Total Suppliers</h4>

          <p>{totalSuppliers}</p>

        </div>

        <div className="summary-card purchase-card">

          <h4>Total Purchases</h4>

          <p>₹{totalPurchases}</p>

        </div>

        <div className="summary-card due-card">

          <h4>Total Due</h4>

          <p>₹{totalDue}</p>

        </div>

      </div>

      {/* TABLE */}
      <div className="table-wrapper">

        <table className="report-table">

          <thead>
            <tr>
              <th>Supplier</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Bills</th>
              <th>Total Purchase</th>
              <th>Total Paid</th>
              <th>Total Due</th>
            </tr>
          </thead>

          <tbody>

            {filteredSuppliers.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="no-data"
                >
                  No supplier data found
                </td>
              </tr>
            ) : (
              filteredSuppliers.map((s) => (
                <tr key={s._id}>

                  <td>
                    {s.name}
                  </td>

                  <td>
                    {s.phone || "—"}
                  </td>

                  <td>
                    {s.email || "—"}
                  </td>

                  <td>
                    {s.billCount}
                  </td>

                  <td>
                    ₹{s.totalPurchases}
                  </td>

                  <td>
                    ₹{s.totalPaid}
                  </td>

                  <td
                    className={
                      s.totalDue > 0
                        ? "due-text"
                        : "clear-text"
                    }
                  >
                    ₹{s.totalDue}
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