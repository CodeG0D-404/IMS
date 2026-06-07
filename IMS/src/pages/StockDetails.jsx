import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import api from "../services/api";
import { getData } from "../utils/apiResponse";

import "./Css/StockDetails.css";

export default function StockDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [lots, setLots] = useState([]);

  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchDetails = async () => {
      try {

        const [productRes, lotsRes] =
          await Promise.all([
            api.get(`/products/${id}`),
            api.get("/stock-lots"),
          ]);

        const productData =
          getData(productRes);

        const lotsData =
          getData(lotsRes) || [];

        const filteredLots =
          lotsData.filter(
            (lot) =>
              lot.product?._id === id
          );

        setProduct(productData);
        setLots(filteredLots);

      } catch (err) {
        console.error(
          "Failed to fetch stock details",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  /* ================= SUMMARY ================= */
  const totalStock = useMemo(() => {

    return lots.reduce(
      (sum, lot) =>
        sum + (lot.remainingQty || 0),
      0
    );

  }, [lots]);

  const totalValue = useMemo(() => {

    return lots.reduce(
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

  }, [lots]);

  /* ================= UI ================= */
  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  if (!product) {
    return (
      <p className="error">
        Product not found
      </p>
    );
  }

  return (
    <div className="stock-details-page">

      {/* HEADER */}
      <div className="details-header">

        <div>
          <h2>
            {product.name}
          </h2>

          <p>
            SKU:
            {" "}
            {product.sku || "—"}
          </p>
        </div>

      </div>

      {/* SUMMARY */}
      <div className="summary-grid">

        <div className="summary-card">

          <h4>Total Lots</h4>

          <p>{lots.length}</p>

        </div>

        <div className="summary-card">

          <h4>Total Stock</h4>

          <p>{totalStock}</p>

        </div>

        <div className="summary-card">

          <h4>Total Valuation</h4>

          <p>₹{totalValue}</p>

        </div>

      </div>

      {/* LOT TABLE */}
      <div className="table-wrapper">

        <table className="lots-table">

          <thead>
            <tr>
              <th>Lot ID</th>
              <th>Purchase Qty</th>
              <th>Remaining Qty</th>
              <th>Purchase Price</th>
              <th>Lot Value</th>
              <th>Status</th>
              <th>Purchase Date</th>
            </tr>
          </thead>

          <tbody>

            {lots.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="no-data"
                >
                  No lots found
                </td>
              </tr>
            ) : (
              lots.map((lot) => {

                const remaining =
                  lot.remainingQty || 0;

                const price =
                  lot.purchasePrice ||
                  lot.costPrice ||
                  0;

                const value =
                  remaining * price;

                return (
                  <tr key={lot._id}>

                    <td>
                      {lot._id.slice(-6)}
                    </td>

                    <td>
                      {lot.quantity || 0}
                    </td>

                    <td>
                      {remaining}
                    </td>

                    <td>
                      ₹{price}
                    </td>

                    <td>
                      ₹{value}
                    </td>

                    <td>
                      {remaining === 0 ? (
                        <span className="sold-out">
                          Sold Out
                        </span>
                      ) : remaining <= 5 ? (
                        <span className="low-stock">
                          Low Stock
                        </span>
                      ) : (
                        <span className="active">
                          Active
                        </span>
                      )}
                    </td>

                    <td>
                      {new Date(
                        lot.createdAt
                      ).toLocaleDateString()}
                    </td>

                  </tr>
                );
              })
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}