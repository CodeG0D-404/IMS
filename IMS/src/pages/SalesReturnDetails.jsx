import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/PurchaseReturnDetails.css";

export default function SalesReturnDetails() {
  const { id } = useParams();

  const [returnData, setReturnData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/sales/returns/${id}`);
        const data = getData(res);

        setReturnData(data.salesReturn);
        setItems(data.items || []);
      } catch (err) {
        console.error("Failed to fetch sales return details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const getTypeClass = (type) => {
    switch (type) {
      case "ADJUST":
        return "tag adjust";
      case "REFUND":
        return "tag refund";
      case "REPLACE":
        return "tag replace";
      default:
        return "tag";
    }
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!returnData) return <p className="error">Return not found</p>;

  return (
    <div className="return-details-page">

      {/* HEADER */}
      <div className="details-header">
        <h2>Sales Return Details</h2>

        <span className={getTypeClass(returnData.adjustmentType)}>
          {returnData.adjustmentType}
        </span>
      </div>

      {/* SUMMARY */}
      <div className="details-summary">

        <div>
          <strong>Customer:</strong>
          <p>{returnData.party?.name}</p>
        </div>

        <div>
          <strong>Date:</strong>
          <p>
            {new Date(
              returnData.returnDate || returnData.createdAt
            ).toLocaleDateString()}
          </p>
        </div>

        <div>
          <strong>Total Return:</strong>
          <p>₹{returnData.totalAmount}</p>
        </div>

        <div>
          <strong>Reference:</strong>
          <p>{returnData.referenceNumber || "—"}</p>
        </div>

      </div>

      {/* ITEMS */}
      <div className="items-section">
        <h3>Returned Items</h3>

        <table className="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Lot</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-data">
                  No items found
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item._id}>
                  <td>{item.product?.name}</td>
                  <td>{item.stockLot?._id?.slice(-6)}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.salePrice || item.price}</td>
                  <td>₹{item.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}