// =============================================
// 📁 src/pages/SalesList.jsx
// Sales List (Same as Purchase List)
// =============================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/SalesList.css";

export default function SalesList() {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [parties, setParties] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [partyFilter, setPartyFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* =========================
     FETCH SALES
  ========================= */
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await api.get("/sales");
        const data = getData(res) || [];

        setSales(data);
        setFiltered(data);

        // Extract unique customers
        const uniqueParties = [];
        data.forEach((s) => {
          if (
            s.party &&
            !uniqueParties.find((u) => u._id === s.party._id)
          ) {
            uniqueParties.push(s.party);
          }
        });

        setParties(uniqueParties);

      } catch (err) {
        console.error("Failed to fetch sales", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  /* =========================
     FILTER LOGIC
  ========================= */
  useEffect(() => {
    let data = [...sales];

    if (search) {
      data = data.filter((s) =>
        s.party?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "ALL") {
      data = data.filter((s) => s.status === statusFilter);
    }

    if (partyFilter !== "ALL") {
      data = data.filter((s) => s.party?._id === partyFilter);
    }

    if (dateFrom) {
      data = data.filter(
        (s) => new Date(s.saleDate || s.createdAt) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      data = data.filter(
        (s) => new Date(s.saleDate || s.createdAt) <= new Date(dateTo)
      );
    }

    setFiltered(data);
  }, [search, statusFilter, partyFilter, dateFrom, dateTo, sales]);

  /* =========================
     STATUS STYLE
  ========================= */
  const getStatusClass = (status) => {
    switch (status) {
      case "PAID":
        return "status paid";
      case "PARTIAL":
        return "status partial";
      case "UNPAID":
        return "status unpaid";

      case "ADVANCE":
        return "status advance";

      default:
        return "status";
    }
  };

  /* =========================
     UI
  ========================= */
  if (loading) return <p className="loading">Loading sales...</p>;

  return (
    <div className="sales-page">

      {/* HEADER */}
      <div className="sales-header">
        <h2>Sales</h2>

        <button
          className="create-btn"
          onClick={() => navigate("/dashboard/sales/create")}
        >
          + Create Sale
        </button>
      </div>

      {/* FILTERS */}
      <div className="sales-filters">
        <input
          type="text"
          placeholder="Search customer..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
          <option value="UNPAID">Unpaid</option>
          <option value="ADVANCE">Advance</option>
        </select>

        <select
          value={partyFilter}
          onChange={(e) => setPartyFilter(e.target.value)}
        >
          <option value="ALL">All Customers</option>
          {parties.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />

        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="sales-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No sales found
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr
                  key={s._id}
                  onClick={() =>
                    navigate(`/dashboard/sales/${s._id}`)
                  }
                >
                  <td>
                    {new Date(
                      s.saleDate || s.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td>{s.party?.name || "N/A"}</td>

                  <td>₹{s.totalAmount}</td>
                  <td>₹{s.paidAmount}</td>
                  <td>₹{s.dueAmount}</td>

                  <td>
                    <span className={getStatusClass(s.status)}>
                      {s.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/sales/${s._id}`);
                      }}
                    >
                      View
                    </button>
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