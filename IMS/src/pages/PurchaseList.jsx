// =============================================
// 📁 src/pages/PurchaseList.jsx
// Advanced Purchase List (With View Button)
// =============================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/PurchaseList.css";

export default function PurchaseList() {
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [parties, setParties] = useState([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [partyFilter, setPartyFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  /* =========================
     FETCH PURCHASES
  ========================= */
  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const res = await api.get("/purchases");
        const data = getData(res) || [];

        setPurchases(data);
        setFiltered(data);

        // Extract unique parties
        const uniqueParties = [];
        data.forEach((p) => {
          if (
            p.party &&
            !uniqueParties.find((u) => u._id === p.party._id)
          ) {
            uniqueParties.push(p.party);
          }
        });

        setParties(uniqueParties);

      } catch (err) {
        console.error("Failed to fetch purchases", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  /* =========================
     FILTER LOGIC
  ========================= */
  useEffect(() => {
    let data = [...purchases];

    if (search) {
      data = data.filter((p) =>
        p.party?.name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "ALL") {
      data = data.filter((p) => p.status === statusFilter);
    }

    if (partyFilter !== "ALL") {
      data = data.filter((p) => p.party?._id === partyFilter);
    }

    if (dateFrom) {
      data = data.filter(
        (p) => new Date(p.purchaseDate || p.createdAt) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      data = data.filter(
        (p) => new Date(p.purchaseDate || p.createdAt) <= new Date(dateTo)
      );
    }

    setFiltered(data);
  }, [search, statusFilter, partyFilter, dateFrom, dateTo, purchases]);

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
      default:
        return "status";
    }
  };

  /* =========================
     UI
  ========================= */
  if (loading) return <p className="loading">Loading purchases...</p>;

  return (
    <div className="purchase-page">
      {/* HEADER */}
      <div className="purchase-header">
        <h2>Purchases</h2>

        <button
          className="create-btn"
          onClick={() => navigate("/dashboard/purchase/create")}
        >
          + Create Purchase
        </button>
      </div>

      {/* FILTERS */}
      <div className="purchase-filters">
        <input
          type="text"
          placeholder="Search supplier..."
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
        </select>

        <select
          value={partyFilter}
          onChange={(e) => setPartyFilter(e.target.value)}
        >
          <option value="ALL">All Suppliers</option>
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
        <table className="purchase-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Supplier</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
              <th>Actions</th> {/* ✅ NEW */}
            </tr>
          </thead>

          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-data">
                  No purchases found
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr
                  key={p._id}
                  onClick={() =>
                    navigate(`/dashboard/purchase/${p._id}`)
                  }
                >
                  <td>
                    {new Date(
                      p.purchaseDate || p.createdAt
                    ).toLocaleDateString()}
                  </td>

                  <td>{p.party?.name || "N/A"}</td>

                  <td>₹{p.totalAmount}</td>
                  <td>₹{p.paidAmount}</td>
                  <td>₹{p.dueAmount}</td>

                  <td>
                    <span className={getStatusClass(p.status)}>
                      {p.status}
                    </span>
                  </td>

                  {/* ✅ VIEW BUTTON */}
                  <td>
                    <button
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/purchase/${p._id}`);
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