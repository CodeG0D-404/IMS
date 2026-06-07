// =============================================
// 📁 src/pages/StoreDetails.jsx
// View Single Store Page (Fixed)
// =============================================

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import "./Css/StoreDetails.css";

function StoreDetails() {
  const { id } = useParams();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/stores/${id}`);

        console.log("Store Details API:", res.data);

        // ✅ FIX: extract store properly
        const storeData = res.data?.store || null;

        setStore(storeData);

      } catch (err) {
        setError(err.response?.data?.message || "Failed to load store");
        setStore(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [id]);

  if (loading) return <div>Loading store...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!store) return <div>No store found</div>;

  return (
    <div className="store-details-container">
      <h2>Store Details</h2>

      <div className="store-card">

        <div className="store-section">
          <h3>Basic Info</h3>
          <p><strong>Name:</strong> {store.name}</p>
          <p><strong>Store Code:</strong> {store.storeCode}</p>
          <p><strong>Owner:</strong> {store.ownerName}</p>
          <p><strong>Phone:</strong> {store.phone}</p>
          <p><strong>Email:</strong> {store.email || "-"}</p>
          <p><strong>GST:</strong> {store.gstNumber || "-"}</p>
        </div>

        <div className="store-section">
          <h3>Address</h3>
          <p>{store.address?.line1 || "-"}</p>
          <p>{store.address?.line2 || "-"}</p>
          <p>
            {store.address?.city || "-"}, {store.address?.state || "-"}
          </p>
          <p>{store.address?.pincode || "-"}</p>
          <p>{store.address?.country || "-"}</p>
        </div>

        <div className="store-section">
          <h3>Subscription</h3>
          <p><strong>Plan:</strong> {store.subscriptionPlan || "N/A"}</p>
          <p>
            <strong>Expiry:</strong>{" "}
            {store.subscriptionExpiry
              ? new Date(store.subscriptionExpiry).toLocaleDateString()
              : "N/A"}
          </p>
        </div>

        <div className="store-section">
          <h3>Settings</h3>
          <p>
            <strong>Low Stock Alert:</strong>{" "}
            {store.settings?.lowStockThreshold ?? "N/A"}
          </p>
          <p>
            <strong>Allow Negative Stock:</strong>{" "}
            {store.settings?.allowNegativeStock ? "Yes" : "No"}
          </p>
          <p>
            <strong>Currency:</strong>{" "}
            {store.settings?.currency || "N/A"}
          </p>
          <p>
            <strong>Credit System:</strong>{" "}
            {store.settings?.enableCreditSystem ? "Enabled" : "Disabled"}
          </p>
        </div>

      </div>
    </div>
  );
}

export default StoreDetails;