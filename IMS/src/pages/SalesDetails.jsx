import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/SalesDetails.css";

export default function SalesDetails() {
  const { id } = useParams();

  const [sale, setSale] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     🔥 NEW STATES (RETURN)
  ========================= */
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState([]);
  const [paymentMode, setPaymentMode] =
    useState("cash");

  const [adjustmentType, setAdjustmentType] =
    useState("ADJUST");

  /* =========================
     FETCH DATA
  ========================= */
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/sales/${id}`);
        const data = getData(res);

        setSale(data.sale);
        setItems(data.items || []);
      } catch (err) {
        console.error("Failed to fetch sale details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  /* =========================
     🔥 OPEN RETURN MODAL
  ========================= */
  const openReturnModal = () => {
    const init = items.map((item) => ({
      saleItemId: item._id,
      product: item.product,
      quantity: item.quantity,
      price: item.price,
      returnQty: 0,
      lots: item.lots.map((lot) => ({
        stockLot: lot.stockLot,
        quantity: lot.quantity,
        returnQty: 0,
        costPrice: lot.costPrice,
      })),
    }));

    setReturnItems(init);
    setPaymentMode("cash");
    setAdjustmentType("ADJUST");
    setShowReturnModal(true);
  };

  /* =========================
     UPDATE RETURN QTY
  ========================= */
  const updateLotQty = (itemIndex, lotIndex, value) => {
    const qty = Number(value);

    setReturnItems((prev) => {
      const updated = [...prev];
      const lot = updated[itemIndex].lots[lotIndex];

      if (qty < 0) return prev;
      if (qty > lot.quantity) return prev;

      lot.returnQty = qty;

      // update total item return qty
      updated[itemIndex].returnQty = updated[itemIndex].lots.reduce(
        (sum, l) => sum + l.returnQty,
        0
      );

      return updated;
    });
  };

  /* =========================
     CALCULATE TOTAL
  ========================= */
  const returnTotal = returnItems.reduce(
    (sum, item) => sum + item.returnQty * item.price,
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
          saleItemId: i.saleItemId,
          quantity: i.returnQty,
          condition: "good",
          lots: i.lots
            .filter((l) => l.returnQty > 0)
            .map((l) => ({
              stockLot: l.stockLot,
              quantity: l.returnQty,
              costPrice: l.costPrice,
            })),
        }));

      if (itemsToReturn.length === 0) {
        alert("Please enter return quantity");
        return;
      }

      await api.post("/sales-returns", {
        saleId: id,

        adjustmentType,

        items: itemsToReturn,

        paymentMode:
          adjustmentType === "REFUND"
            ? paymentMode
            : undefined,
      });

      alert("Sales return successful");
      setShowReturnModal(false);

      // refresh
      const res = await api.get(`/sales/${id}`);
      const data = getData(res);

      setSale(data.sale);
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
      case "ADVANCE":
        return "status advance";
      default:
        return "status";
    }
  };

  if (loading) return <p className="loading">Loading...</p>;
  if (!sale) return <p className="error">Sale not found</p>;

  return (
    <div className="sales-details-page">

      {/* HEADER */}
      <div className="details-header">
        <h2>Sale Details</h2>

        <div className="header-actions">
          <span className={getStatusClass(sale.status)}>
            {sale.status}
          </span>

          {/* 🔥 NEW BUTTON */}
          <button className="return-btn" onClick={openReturnModal}>
            Return Items
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="details-summary">
        <div>
          <strong>Customer:</strong>
          <p>{sale.party?.name}</p>
        </div>

        <div>
          <strong>Date:</strong>
          <p>
            {new Date(
              sale.saleDate || sale.createdAt
            ).toLocaleDateString()}
          </p>
        </div>

        <div>
          <strong>Total:</strong>
          <p>₹{sale.totalAmount}</p>
        </div>

        <div>
          <strong>Paid:</strong>
          <p>₹{sale.paidAmount}</p>
        </div>

        <div>
          <strong>Due:</strong>
          <p>₹{sale.dueAmount}</p>
        </div>

        <div>
          <strong>Total Profit:</strong>
          <p className="profit">₹{sale.totalProfit}</p>
        </div>
      </div>

      {/* ITEMS */}
      <div className="items-section">
        <h3>Items</h3>

        <table className="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Selling Price</th>
              <th>Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => (
              <>
                <tr key={item._id}>
                  <td>{item.product?.name}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.price}</td>
                  <td>₹{item.totalRevenue}</td>
                  <td>₹{item.totalCost}</td>
                  <td className="profit">₹{item.profit}</td>
                </tr>

                <tr className="lot-row">
                  <td colSpan="6">
                    <div className="lot-breakdown">
                      {item.lots.map((lot, i) => (
                        <div key={i} className="lot-chip">
                          Lot {lot.stockLot?.slice(-5)} | Qty: {lot.quantity} | Cost: ₹{lot.costPrice}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔥 RETURN MODAL */}
      {showReturnModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Sales Return</h3>

            {returnItems.map((item, i) => (
              <div key={i} className="return-item-block">
                <strong>{item.product?.name}</strong>

                {item.lots.map((lot, j) => (
                  <div key={j} className="lot-input">
                    <span>
                      Lot {lot.stockLot?.slice(-5)} (Max {lot.quantity})
                    </span>

                    <input
                      type="number"
                      min="0"
                      max={lot.quantity}
                      value={lot.returnQty}
                      onChange={(e) =>
                        updateLotQty(i, j, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            ))}

            <div className="return-total">
              Total Return: ₹{returnTotal}
            </div>
            <div>
              <label>Return Type:</label>

              <select
                value={adjustmentType}
                onChange={(e) =>
                  setAdjustmentType(e.target.value)
                }
              >
                <option value="ADJUST">
                  Adjust Next Sale
                </option>

                <option value="REFUND">
                  Refund Customer
                </option>

                <option value="REPLACE">
                  Replace Product
                </option>
              </select>
            </div>

              {adjustmentType === "REFUND" && (
              <div>
                <label>Payment Mode:</label>

                <select
                  value={paymentMode}
                  onChange={(e) =>
                    setPaymentMode(e.target.value)
                  }
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

              <button className="confirm-btn" onClick={handleConfirmReturn}>
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}