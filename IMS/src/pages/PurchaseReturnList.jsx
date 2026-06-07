import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/PurchaseReturnList.css";

export default function PurchaseReturnList() {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await api.get("/purchase-returns");
        const data = getData(res);
        setReturns(data || []);
      } catch (err) {
        console.error("Failed to fetch returns", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);

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

  return (
    <div className="return-list-page">
      <h2>Purchase Returns</h2>

      <table className="return-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Supplier</th>
            <th>Amount</th>
            <th>Type</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {returns.length === 0 ? (
            <tr>
              <td colSpan="5" className="no-data">
                No returns found
              </td>
            </tr>
          ) : (
            returns.map((ret) => (
              <tr key={ret._id}>
                <td>
                  {new Date(
                    ret.returnDate || ret.createdAt
                  ).toLocaleDateString()}
                </td>

                <td>{ret.party?.name}</td>

                <td>₹{ret.totalAmount}</td>

                <td>
                  <span className={getTypeClass(ret.adjustmentType)}>
                    {ret.adjustmentType}
                  </span>
                </td>

                <td>
                  <button
                    className="details-btn"
                    onClick={() =>
                      navigate(`/dashboard/purchase/returns/${ret._id}`)
                    }
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}