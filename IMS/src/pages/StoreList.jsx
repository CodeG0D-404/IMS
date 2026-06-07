// =============================================
// 📁 src/pages/StoreList.jsx
// View All Stores (Fixed for new backend)
// =============================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Css/StoreList.css";

function StoreList() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);

        const res = await api.get("/stores");

        console.log("StoreList API:", res.data);

        // ✅ FIX: correct parsing
        const storesData = res.data?.stores || [];

        setStores(storesData);

      } catch (err) {
        setError(err.response?.data?.message || "Failed to load stores");
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading) return <div>Loading stores...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="store-list-container">
      <div className="store-list-header">
        <h2>All Stores</h2>
        <Link to="/dashboard/stores/add" className="add-store-btn">
          + Add Store
        </Link>
      </div>

      <div className="store-table-wrapper">
        <table className="store-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Owner</th>
              <th>Phone</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {!Array.isArray(stores) || stores.length === 0 ? (
              <tr>
                <td colSpan="7">No stores found</td>
              </tr>
            ) : (
              stores.map((store) => (
                <tr key={store._id}>
                  <td>{store.name}</td>
                  <td>{store.storeCode}</td>
                  <td>{store.ownerName}</td>
                  <td>{store.phone}</td>

                  {/* Optional fields (safe fallback) */}
                  <td>{store.subscriptionPlan || "N/A"}</td>

                  <td>
                    {store.isActive !== false ? (
                      <span className="status active">Active</span>
                    ) : (
                      <span className="status inactive">Inactive</span>
                    )}
                  </td>

                  <td>
                    <Link
                      to={`/dashboard/stores/${store._id}`}
                      className="view-btn"
                    >
                      View
                    </Link>
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

export default StoreList;