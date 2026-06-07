// =============================================
// 📁 src/pages/Products.jsx
// Clean + Aligned Version
// =============================================

import { useEffect, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/Products.css";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    category: "",
    unit: "PCS",
    description: "",
  });

  /* =========================================
     LOAD DATA
  ========================================= */
  const loadData = async () => {
    try {
      setLoading(true);

      const [productRes, categoryRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);

      setProducts(getData(productRes) || []);
      setCategories(getData(categoryRes) || []);

    } catch (err) {
      console.error(err);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================
     FILTER
  ========================================= */
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  /* =========================================
     CREATE PRODUCT
  ========================================= */
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      return alert("Product name is required");
    }

    try {
      setActionLoading(true);

      const res = await api.post("/products", {
        name: form.name,
        category: form.category || undefined,
        unit: form.unit,
        description: form.description,
      });

      const newProduct = getData(res);

      if (newProduct) {
        setProducts((prev) => [newProduct, ...prev]);
      }

      setForm({
        name: "",
        category: "",
        unit: "PCS",
        description: "",
      });

      setShowModal(false);

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create product");
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================
     DELETE PRODUCT
  ========================================= */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      setActionLoading(true);

      await api.delete(`/products/${id}`);

      setProducts((prev) => prev.filter((p) => p._id !== id));

    } catch (err) {
      console.error(err);
      alert("Failed to delete product");
    } finally {
      setActionLoading(false);
    }
  };

  /* =========================================
     UI
  ========================================= */
  return (
    <div className="product-page">

      <h2>Products</h2>

      {/* Top Bar */}
      <div className="product-topbar">
        <button onClick={() => setShowModal(true)}>
          + Add Product
        </button>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Loading */}
      {loading ? (
        <p>Loading...</p>
      ) : filteredProducts.length === 0 ? (
        <p>No products found</p>
      ) : (
        <table className="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{p.unit}</td>
                <td>
                  <button
                    onClick={() => handleDelete(p._id)}
                    disabled={actionLoading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* =========================================
         MODAL
      ========================================= */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">

            <h3>Add Product</h3>

            <form onSubmit={handleCreate}>

              <input
                type="text"
                placeholder="Name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                <option value="">No Category</option>

                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <input
                type="text"
                placeholder="Unit"
                value={form.unit}
                onChange={(e) =>
                  setForm({ ...form, unit: e.target.value })
                }
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />

              <div className="modal-actions">
                <button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : "Add"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Products;