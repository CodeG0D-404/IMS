import { useEffect, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/PurchaseCreate.css";

const emptyRow = {
  product: "",
  quantity: 1,
  costPrice: 0,
  total: 0,
};

export default function PurchaseCreate() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);

  const [supplier, setSupplier] = useState("");
  const [supplierBalance, setSupplierBalance] = useState(0);

  const [items, setItems] = useState([emptyRow]);

  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paidAmount, setPaidAmount] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const [loading, setLoading] = useState(false);

  /* ================= LOAD ================= */
  useEffect(() => {
    const load = async () => {
      const [pRes, prodRes] = await Promise.all([
        api.get("/parties?type=supplier"),
        api.get("/products"),
      ]);

      setSuppliers(getData(pRes) || []);
      setProducts(getData(prodRes) || []);
    };

    load();
  }, []);

  /* ================= LOAD BALANCE ================= */
  useEffect(() => {
    if (!supplier) return;

    const loadBalance = async () => {
      try {
        const res = await api.get(`/ledger/party/${supplier}/balance`);
        setSupplierBalance(res.data?.data?.balance || 0);
      } catch {
        setSupplierBalance(0);
      }
    };

    loadBalance();
  }, [supplier]);

  /* ================= ITEMS ================= */
  const handleItemChange = (i, field, value) => {
    const updated = [...items];
    updated[i][field] = value;

    const qty = Number(updated[i].quantity) || 0;
    const cost = Number(updated[i].costPrice) || 0;

    updated[i].total = qty * cost;

    setItems(updated);
  };

  const addRow = () => setItems([...items, { ...emptyRow }]);

  const removeRow = (i) => {
    const updated = items.filter((_, idx) => idx !== i);
    setItems(updated.length ? updated : [emptyRow]);
  };

  /* ================= TOTAL ================= */
  const totalAmount = items.reduce((sum, i) => sum + i.total, 0);
  const dueAmount = totalAmount - (Number(paidAmount) || 0);
  const finalBalance = supplierBalance + totalAmount - paidAmount;

  /* ================= CREATE SUPPLIER ================= */
  const createSupplier = async () => {
    try {
      const res = await api.post("/parties", {
        ...newSupplier,
        types: ["supplier"],
      });

      const created = getData(res);

      setSuppliers((prev) => [created, ...prev]);
      setSupplier(created._id);

      setShowModal(false);
      setNewSupplier({
        name: "",
        phone: "",
        email: "",
        address: "",
      });

    } catch (err) {
      alert(err.response?.data?.message || "Failed to create supplier");
    }
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (!supplier) return alert("Select supplier");

    if (items.some((i) => !i.product)) {
      return alert("Select all products");
    }

    try {
      setLoading(true);

      await api.post("/purchases", {
        supplier,
        items: items.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity),
          costPrice: Number(i.costPrice),
        })),
        totalAmount,
        paidAmount,
        paymentMode,
      });

      alert("Purchase Created");
      window.location.reload();

    } catch (err) {
      alert(err.response?.data?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="purchase-page">

      <h2>Create Purchase</h2>

      {/* SUPPLIER */}
      <select
        value={supplier}
        onChange={(e) => {
          if (e.target.value === "add") setShowModal(true);
          else setSupplier(e.target.value);
        }}
      >
        <option value="">Select Supplier</option>
        <option value="add">+ Add Supplier</option>
        {suppliers.map((s) => (
          <option key={s._id} value={s._id}>{s.name}</option>
        ))}
      </select>

      {/* BALANCE */}
      {supplier && (
        <p className="balance-info">
          Previous Balance: ₹{supplierBalance}
        </p>
      )}

      {/* TABLE */}
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th>Qty</th>
            <th>Cost</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {items.map((row, i) => (
            <tr key={i}>
              <td>
                <select
                  value={row.product}
                  onChange={(e) =>
                    handleItemChange(i, "product", e.target.value)
                  }
                >
                  <option value="">Select</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </td>

              <td>
                <input
                  type="number"
                  value={row.quantity}
                  onChange={(e) =>
                    handleItemChange(i, "quantity", e.target.value)
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  value={row.costPrice}
                  onChange={(e) =>
                    handleItemChange(i, "costPrice", e.target.value)
                  }
                />
              </td>

              <td>{row.total}</td>

              <td>
                <button onClick={() => removeRow(i)}>X</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={addRow}>+ Add Row</button>

      {/* PAYMENT */}
      <div className="payment-section">
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
        >
          <option>CASH</option>
          <option>UPI</option>
          <option>CHEQUE</option>
        </select>

        <input
          type="number"
          placeholder="Paid Amount"
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
        />
      </div>

      {/* 🔥 LEDGER BREAKDOWN */}
      <div className="ledger-box">

        <h3>Ledger Summary</h3>

        <div className="ledger-row">
          <span>Previous Balance</span>
          <span>₹{supplierBalance}</span>
        </div>

        <div className="ledger-row plus">
          <span>+ Purchase Amount</span>
          <span>₹{totalAmount}</span>
        </div>

        <div className="ledger-row minus">
          <span>- Paid Amount</span>
          <span>₹{paidAmount}</span>
        </div>

        <div className="ledger-divider"></div>

        <div className="ledger-row final">
          <span>Final Balance</span>
          <span>₹{finalBalance}</span>
        </div>

      </div>

      {/* ACTION */}
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Saving..." : "Create Purchase"}
      </button>

      {/* MODAL */}
      {showModal && (
        <div className="modal">
          <div>
            <h3>Add Supplier</h3>

            <input placeholder="Name"
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, name: e.target.value })
              } />

            <input placeholder="Phone"
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, phone: e.target.value })
              } />

            <input placeholder="Email"
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, email: e.target.value })
              } />

            <input placeholder="Address"
              onChange={(e) =>
                setNewSupplier({ ...newSupplier, address: e.target.value })
              } />

            <button onClick={() => setShowModal(false)}>Cancel</button>
            <button onClick={createSupplier}>Save</button>
          </div>
        </div>
      )}

    </div>
  );
}