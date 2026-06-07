import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { getData } from "../utils/apiResponse";

import "./Css/StockReport.css";

export default function StockReport() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchStock = async () => {
      try {

        const [productsRes, lotsRes] = await Promise.all([
          api.get("/products"),
          api.get("/stock-lots"),
        ]);

        const productsData =
          getData(productsRes) || [];

        const lotsData =
          getData(lotsRes) || [];

        /* =====================================
           MERGE STOCK INTO PRODUCTS
        ===================================== */
        const merged = productsData.map(
          (product) => {

            const productLots =
              lotsData.filter(
                (lot) =>
                  lot.product?._id ===
                  product._id
              );

            const stock =
              productLots.reduce(
                (sum, lot) =>
                  sum +
                  (lot.remainingQty || 0),
                0
              );

            const stockValue =
              productLots.reduce(
                (sum, lot) =>
                  sum +
                  (
                    (lot.remainingQty || 0) *
                    (
                      lot.purchasePrice ||
                      lot.costPrice ||
                      0
                    )
                  ),
                0
              );

            return {
              ...product,

              stock,

              stockValue,
            };
          }
        );

        setProducts(merged);

      } catch (err) {
        console.error(
          "Failed to fetch stock",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, []);

  /* ================= FILTER ================= */
  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [products, search]);

  /* ================= SUMMARY ================= */
  const totalProducts =
    filteredProducts.length;

  const totalStockQty =
    filteredProducts.reduce(
      (sum, p) =>
        sum + (p.stock || 0),
      0
    );

  const totalStockValue =
    filteredProducts.reduce(
      (sum, p) =>
        sum + (p.stockValue || 0),
      0
    );

  const lowStockCount =
    filteredProducts.filter(
      (p) => (p.stock || 0) <= 5
    ).length;

  /* ================= UI ================= */
  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="stock-report-page">

      <div className="report-header">
        <h2>Stock Report</h2>
      </div>

      {/* SEARCH */}
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

      </div>

      {/* SUMMARY */}
      <div className="summary-grid">

        <div className="summary-card">
          <h4>Total Products</h4>
          <p>{totalProducts}</p>
        </div>

        <div className="summary-card">
          <h4>Total Quantity</h4>
          <p>{totalStockQty}</p>
        </div>

        <div className="summary-card">
          <h4>Stock Value</h4>
          <p>₹{totalStockValue}</p>
        </div>

        <div className="summary-card warning">
          <h4>Low Stock Items</h4>
          <p>{lowStockCount}</p>
        </div>

      </div>

      {/* TABLE */}
      <div className="table-wrapper">

        <table className="report-table">

          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Stock</th>
              <th>Stock Value</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>

            {filteredProducts.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="no-data"
                >
                  No products found
                </td>
              </tr>
            ) : (
              filteredProducts.map(
                (product) => {

                  const stock =
                    product.stock || 0;

                  const value =
                    product.stockValue || 0;

                  return (
                    <tr key={product._id}>

                      <td>
                        {product.name}
                      </td>

                      <td>
                        {product.sku || "—"}
                      </td>

                      <td>
                        {product.category?.name ||
                          "—"}
                      </td>

                      <td>
                        {product.unit || "PCS"}
                      </td>

                      <td>
                        {stock}
                      </td>

                      <td>
                        ₹{value}
                      </td>

                      <td>
                        {stock === 0 ? (
                          <span className="out-stock">
                            Out of Stock
                          </span>
                        ) : stock <= 5 ? (
                          <span className="low-stock">
                            Low Stock
                          </span>
                        ) : (
                          <span className="in-stock">
                            In Stock
                          </span>
                        )}
                      </td>

                      <td>
                        <button
                          className="details-btn"
                          onClick={() =>
                            navigate(
                              `/dashboard/reports/stock/${product._id}`
                            )
                          }
                        >
                          Details
                        </button>
                      </td>

                    </tr>
                  );
                }
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}