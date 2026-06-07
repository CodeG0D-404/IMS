// =============================================
// 📁 src/pages/SelectStore.jsx
// Shopify-style Store Selector (Fixed)
// =============================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Css/SelectStore.css";

function SelectStore() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);

        const res = await api.get("/stores");

        console.log("Stores API response:", res.data);

        // ✅ FIX: backend returns { success, stores }
        const storesData = res.data?.stores || [];

        setStores(storesData);

        // ✅ Auto-select if only one store (employee flow)
        if (storesData.length === 1) {
          handleSelect(storesData[0]);
        }

      } catch (err) {
        console.error("Failed to load stores", err);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleSelect = (store) => {
    if (!store?._id) return;

    localStorage.setItem("storeId", store._id);
    localStorage.setItem("storeName", store.name);

    navigate("/dashboard");
  };

  /* ============================
     LOADING STATE
  ============================ */
  if (loading) {
    return (
      <div className="select-store-page">
        <p>Loading stores...</p>
      </div>
    );
  }

  return (
    <div className="select-store-page">

      <div className="store-selector">

        <h1>Select Store</h1>
        <p>Choose a store to manage</p>

        <div className="store-grid">

          {Array.isArray(stores) && stores.length > 0 ? (
            stores.map((store) => (
              <div
                key={store._id}
                className="store-card"
                onClick={() => handleSelect(store)}
              >
                <div className="store-icon">
                  🏬
                </div>

                <h3>{store.name}</h3>

                <p className="store-code">
                  Code: {store.storeCode}
                </p>
              </div>
            ))
          ) : (
            <p>No stores available</p>
          )}

        </div>

      </div>

    </div>
  );
}

export default SelectStore;