import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/PurchaseDetails.css";

export default function PurchaseDetails() {
  const { id } = useParams();

  const [purchase, setPurchase] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // RETURN MODAL STATE
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState([]);

  // NEW STATES
  const [adjustmentType, setAdjustmentType] = useState("ADJUST");
  const [paymentMode, setPaymentMode] = useState("cash");

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/purchases/${id}`);
        const data = getData(res);

        setPurchase(data.purchase);
        setItems(data.items || []);
      } catch (err) {
        console.error("Failed to fetch purchase details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  /* =========================
     INIT RETURN DATA
  ========================= */
  const openReturnModal = () => {
    const init = items.map((item) => ({
      itemId: item._id,
      product: item.product,
      stockLot: item.stockLot,
      quantity: item.quantity,
      costPrice: item.costPrice,
      returnQty: 0,
    }));

    setReturnItems(init);
    setAdjustmentType("ADJUST");
    setPaymentMode("cash");
    setShowReturnModal(true);
  };

  /* =========================
     HANDLE RETURN INPUT
  ========================= */
  const updateReturnQty = (index, value) => {
    const qty = Number(value);

    setReturnItems((prev) => {
      const updated = [...prev];

      if (qty < 0) return prev;
      if (qty > updated[index].quantity) return prev;

      updated[index].returnQty = qty;
      return updated;
    });
  };

  /* =========================
     CALCULATE TOTAL
  ========================= */
  const returnTotal = returnItems.reduce(
    (sum, item) => sum + item.returnQty * item.costPrice,
    0
  );

  /* =========================
     CONFIRM RETURN
  ========================= */
  const handleConfirmReturn = async () => {
    try {
      const itemsToReturn = returnItems
        .filter((i) => i.returnQty > 0)
        .map((i) => ({
          purchaseItemId: i.itemId,
          quantity: i.returnQty,
        }));

      if (itemsToReturn.length === 0) {
        alert("Please enter return quantity");
        return;
      }

      await api.post("/purchase-returns", {
        purchaseId: id,
        items: itemsToReturn,
        adjustmentType,
        paymentMode:
          adjustmentType === "REFUND" ? paymentMode : undefined,
      });

      alert("Return successful");

      setShowReturnModal(false);

      // REFRESH DATA
      const res = await api.get(`/purchases/${id}`);
      const data = getData(res);

      setPurchase(data.purchase);
      setItems(data.items || []);

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Return failed");
    }
  };

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

  if (loading) return <p className="loading">Loading...</p>;
  if (!purchase) return <p className="error">Purchase not found</p>;

  return (
    <div className="purchase-details-page">

      {/* HEADER */}
      <div className="details-header">
        <h2>Purchase Details</h2>

        <div className="header-actions">
          <span className={getStatusClass(purchase.status)}>
            {purchase.status}
          </span>

          <button className="return-btn" onClick={openReturnModal}>
            Return Items
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="details-summary">
        <div>
          <strong>Supplier:</strong>
          <p>{purchase.party?.name}</p>
        </div>

        <div>
          <strong>Date:</strong>
          <p>
            {new Date(
              purchase.purchaseDate || purchase.createdAt
            ).toLocaleDateString()}
          </p>
        </div>

        <div>
          <strong>Total:</strong>
          <p>₹{purchase.totalAmount}</p>
        </div>

        <div>
          <strong>Paid:</strong>
          <p>₹{purchase.paidAmount}</p>
        </div>

        <div>
          <strong>Due:</strong>
          <p>₹{purchase.dueAmount}</p>
        </div>
      </div>

      {/* ITEMS */}
      <div className="items-section">
        <h3>Items</h3>

        <table className="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Lot</th>
              <th>Qty</th>
              <th>Cost</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{item.product?.name}</td>
                <td>{item.stockLot?._id?.slice(-6)}</td>
                <td>{item.quantity}</td>
                <td>₹{item.costPrice}</td>
                <td>₹{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RETURN MODAL */}
      {showReturnModal && (
        <div className="modal-overlay">
          <div className="modal">

            <h3>Return Items</h3>

            <table className="return-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Lot</th>
                  <th>Purchased</th>
                  <th>Return Qty</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {returnItems.map((item, i) => (
                  <tr key={i}>
                    <td>{item.product?.name}</td>
                    <td>{item.stockLot?._id?.slice(-6)}</td>
                    <td>{item.quantity}</td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={item.returnQty}
                        onChange={(e) =>
                          updateReturnQty(i, e.target.value)
                        }
                      />
                    </td>

                    <td>
                      ₹{item.returnQty * item.costPrice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="return-total">
              <strong>Total Return:</strong> ₹{returnTotal}
            </div>

            {/* ADJUSTMENT TYPE */}
            <div style={{ marginTop: "15px" }}>
              <label>Return Type:</label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value)}
              >
                <option value="ADJUST">Adjust</option>
                <option value="REFUND">Refund</option>
                <option value="REPLACE">Replace</option>
              </select>
            </div>

            {/* PAYMENT MODE */}
            {adjustmentType === "REFUND" && (
              <div style={{ marginTop: "10px" }}>
                <label>Payment Mode:</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowReturnModal(false)}>
                Cancel
              </button>

              <button
                className="confirm-btn"
                onClick={handleConfirmReturn}
              >
                Confirm Return
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}