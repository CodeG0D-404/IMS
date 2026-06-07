// =============================================
// 📁 src/dashboard/pages/ViewProducts.jsx
// Admin: List / Search / Delete Products
// =============================================

import React, { useEffect, useMemo, useState } from "react";
import "./styles/ViewProducts.css";

import {
  fetchProducts,
  deleteProduct,
} from "../services/product.service";

const PAGE_SIZE = 10;

const ViewProducts = () => {
  const storeId = localStorage.getItem("storeId");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts(storeId);
        if (mounted) setProducts(data || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProducts();
    return () => (mounted = false);
  }, [storeId]);

  const filteredProducts = useMemo(() => {
    const q = searchText.toLowerCase().trim();

    return products.filter((p) =>
      p.productName.toLowerCase().includes(q)
    );
  }, [products, searchText]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete product");
    }
  };

  return (
    <div className="product-page">
      <h2 className="product-title">Products</h2>

      <div className="product-topbar">
        <input
          type="text"
          placeholder="Search product..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      <div className="product-table-wrapper">
        <table className="product-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Selling Price</th>
              <th>Stock</th>
              <th>Sold</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7}>Loading…</td>
              </tr>
            )}

            {!loading &&
              pageSlice.map((p) => (
                <tr key={p._id}>
                  <td>{p.productName}</td>
                  <td>{p.category?.name || "—"}</td>
                  <td>₹{p.sellingPrice}</td>
                  <td>{p.totalStock}</td>
                  <td>{p.totalSold}</td>
                  <td>
                    {p.totalStock < p.lowStockThreshold ? (
                      <span className="product-low-badge">
                        Low Stock
                      </span>
                    ) : (
                      <span className="product-ok-badge">
                        OK
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="product-delete-btn"
                      onClick={() => handleDelete(p._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="product-pagination">
        <span>
          Page {currentPage} of {totalPages}
        </span>

        <div>
          <button
            disabled={currentPage <= 1}
            onClick={() =>
              setPage((p) => Math.max(1, p - 1))
            }
          >
            Prev
          </button>

          <button
            disabled={currentPage >= totalPages}
            onClick={() =>
              setPage((p) => Math.min(totalPages, p + 1))
            }
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewProducts;