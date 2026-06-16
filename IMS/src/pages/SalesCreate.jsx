import { useEffect, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/SalesCreate.css";

export default function SalesCreate() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  const [party, setParty] = useState("");
  const [customerBalance, setCustomerBalance] = useState(0);

  const [items, setItems] = useState([]);

  const [paymentMode, setPaymentMode] = useState("cash");
  const [paidAmount, setPaidAmount] = useState(0);

  // 🔥 ADD CUSTOMER (LIKE PURCHASE)
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      const [custRes, prodRes] = await Promise.all([
        api.get("/parties?type=customer"),
        api.get("/products"),
      ]);

      setCustomers(getData(custRes) || []);
      setProducts(getData(prodRes) || []);
    };

    fetchData();
  }, []);

  /* ================= LOAD BALANCE ================= */
  useEffect(() => {
    if (!party) return;

    const loadBalance = async () => {
      try {
        const res = await api.get(`/ledger/party/${party}/balance`);

        setCustomerBalance(res.data?.data?.balance || 0);

      } catch {
        setCustomerBalance(0);
      }
    };

    loadBalance();
  }, [party]);

  const getTotalAvailable = (lots) =>
    lots.reduce((sum, l) => sum + l.remainingQty, 0);

  const getSelectedLotTotal = (item) =>
    item.selectedLots.reduce((sum, l) => sum + (l.quantity || 0), 0);

  const addItem = () => {
    setItems([
      ...items,
      {
        product: "",
        lots: [],
        selectedLots: [],
        quantity: "",
        price: "",
      },
    ]);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  const fetchLots = async (productId, index) => {
    const res = await api.get(
      `/stock-lots/product/${productId}`
    );

    const lots = getData(res) || [];

    setItems((prev) => {
      const updated = [...prev];
      updated[index].lots = lots;
      updated[index].selectedLots = [];
      return updated;
    });
  };

  const handleProductChange = (index, productId) => {
    const updated = [...items];
    updated[index].product = productId;
    setItems(updated);

    fetchLots(productId, index);
  };

  const handleChange = (index, field, value) => {
    const updated = [...items];
    const num = Number(value);

    if (field === "quantity") {
      const totalAvailable = getTotalAvailable(updated[index].lots);

      if (num > totalAvailable) {
        alert(`Only ${totalAvailable} available`);
        return;
      }

      updated[index].selectedLots = [];
    }

    updated[index][field] = value;
    setItems(updated);
  };

  const toggleLot = (index, lot) => {
    const updated = [...items];
    const selected = updated[index].selectedLots;

    const exists = selected.find((l) => l.stockLot === lot._id);

    if (exists) {
      updated[index].selectedLots = selected.filter(
        (l) => l.stockLot !== lot._id
      );
    } else {
      updated[index].selectedLots.push({
        stockLot: lot._id,
        available: lot.remainingQty,
        quantity: "",
      });
    }

    setItems(updated);
  };

  const handleLotQty = (i, lotIndex, qty) => {
    const updated = [...items];
    const value = Number(qty);

    const item = updated[i];
    const lot = item.selectedLots[lotIndex];

    if (value > lot.available) {
      alert(`Max available: ${lot.available}`);
      return;
    }

    const total = item.selectedLots.reduce(
      (sum, l, idx) =>
        sum + (idx === lotIndex ? value : Number(l.quantity) || 0),
      0
    );

    if (total > Number(item.quantity)) {
      alert("Lot qty exceeds total quantity");
      return;
    }

    updated[i].selectedLots[lotIndex].quantity = value;
    setItems(updated);
  };

  const totalAmount = items.reduce(
    (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.price) || 0),
    0
  );

  const dueAmount = totalAmount - (Number(paidAmount) || 0);

  const finalBalance =
    customerBalance + totalAmount - paidAmount;

  /* ================= CREATE CUSTOMER ================= */
  const createCustomer = async () => {
    try {
      const res = await api.post("/parties", {
        ...newCustomer,
        types: ["customer"],
      });

      const created = getData(res);

      setCustomers((prev) => [created, ...prev]);
      setParty(created._id);

      setShowModal(false);

      setNewCustomer({
        name: "",
        phone: "",
        email: "",
        address: "",
      });

    } catch (err) {
      alert(err.response?.data?.message || "Failed to create customer");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!party) return alert("Select customer");

      for (let i of items) {
        const total = getSelectedLotTotal(i);

        if (total !== Number(i.quantity)) {
          return alert("Lot qty must match total quantity");
        }
      }

      const formattedItems = items.map((i) => ({
        product: i.product,
        quantity: Number(i.quantity),
        sellingPrice: Number(i.price),
        lots: i.selectedLots.map((l) => ({
          stockLot: l.stockLot,
          quantity: Number(l.quantity),
        })),
      }));

      await api.post("/sales", {
        party,

        items: formattedItems,

        totalAmount,

        paidAmount: Number(paidAmount) || 0,

        paymentMode,
      });

      alert("Sale created");
      navigate("/dashboard/sales");

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error");
    }
  };

  return (
    <div className="sales-page">

      <h2>Create Sale</h2>

      {/* CUSTOMER */}
      <label>Select Customer</label>

      <select
        value={party}
        onChange={(e) => {
          if (e.target.value === "add") setShowModal(true);
          else setParty(e.target.value);
        }}
      >
        <option value="">Select Customer</option>
        <option value="add">+ Add Customer</option>

        {customers.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* BALANCE */}
      {party && (
        <p className="balance-info">
          Previous Balance: ₹{customerBalance}
        </p>
      )}

      <button onClick={addItem}>+ Add Product</button>

      {items.map((item, i) => (
        <div key={i} className="item-box">

          {/* ❌ REMOVE ITEM */}
          <button
            className="remove-btn"
            onClick={() => removeItem(i)}
          >
            X
          </button>

          <label>Select Product</label>

          <select
            value={item.product}
            onChange={(e) =>
              handleProductChange(i, e.target.value)
            }
          >
            <option value="">Select Product</option>

            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>

          <label>Quantity</label>

          <input
            type="number"
            min="1"
            placeholder="Qty"
            value={item.quantity || ""}
            onFocus={(e) => {
              if (e.target.value === "0") e.target.value = "";
            }}
            onChange={(e) =>
              handleChange(i, "quantity", e.target.value)
            }
          />

          <label>Selling Price</label>

          <input
            type="number"
            placeholder="Selling Price"
            value={item.price || ""}
            onFocus={(e) => {
              if (e.target.value === "0") e.target.value = "";
            }}
            onChange={(e) =>
              handleChange(i, "price", e.target.value)
            }
          />

          {/* LOTS */}
          <div className="lot-box">
            {item.lots.map((lot) => (
              <label key={lot._id}>
                <input
                  type="checkbox"
                  checked={item.selectedLots.some(
                    (l) => l.stockLot === lot._id
                  )}
                  onChange={() => toggleLot(i, lot)}
                />

                Lot {lot._id.slice(-5)} | Avl: {lot.remainingQty} | Cost: ₹
                {lot.purchasePrice || lot.costPrice || 0}
              </label>
            ))}
          </div>

          {/* LOT QTY */}
          {item.selectedLots.map((lot, li) => {
            const lotData = item.lots.find(
              (l) => l._id === lot.stockLot
            );

            return (
              <div key={li} className="lot-input-row">

                <label>
                  Lot {lotData?._id.slice(-5)} Quantity
                </label>

                <input
                  type="number"
                  value={lot.quantity || ""}
                  onFocus={(e) => {
                    if (e.target.value === "0") e.target.value = "";
                  }}
                  onChange={(e) =>
                    handleLotQty(i, li, e.target.value)
                  }
                />
              </div>
            );
          })}

          <p className="lot-warning">
            Remaining: {
              (Number(item.quantity) || 0) -
              getSelectedLotTotal(item)
            }
          </p>
        </div>
      ))}

      <h3>Total: ₹{totalAmount}</h3>

      <label>Paid Amount</label>

      <input
        type="number"
        placeholder="Paid Amount"
        value={paidAmount}
        onFocus={(e) => {
          if (e.target.value === "0") e.target.value = "";
        }}
        onChange={(e) => setPaidAmount(e.target.value)}
      />

      <label>Payment Mode</label>

      <select
        value={paymentMode}
        onChange={(e) => setPaymentMode(e.target.value)}
      >
        <option value="cash">Cash</option>
        <option value="upi">UPI</option>
        <option value="cheque">Cheque</option>
      </select>

      {/* 🔥 LEDGER BREAKDOWN */}
      <div className="ledger-box">

        <h3>Ledger Summary</h3>

        <div className="ledger-row">
          <span>Previous Balance</span>
          <span>₹{customerBalance}</span>
        </div>

        <div className="ledger-row plus">
          <span>+ Sale Amount</span>
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

      <button onClick={handleSubmit}>
        Create Sale
      </button>

      {/* MODAL */}
      {showModal && (
        <div className="modal">
          <div>

            <h3>Add Customer</h3>

            <input
              placeholder="Name"
              onChange={(e) =>
                setNewCustomer({
                  ...newCustomer,
                  name: e.target.value,
                })
              }
            />

            <input
              placeholder="Phone"
              onChange={(e) =>
                setNewCustomer({
                  ...newCustomer,
                  phone: e.target.value,
                })
              }
            />

            <input
              placeholder="Email"
              onChange={(e) =>
                setNewCustomer({
                  ...newCustomer,
                  email: e.target.value,
                })
              }
            />

            <input
              placeholder="Address"
              onChange={(e) =>
                setNewCustomer({
                  ...newCustomer,
                  address: e.target.value,
                })
              }
            />

            <button onClick={() => setShowModal(false)}>
              Cancel
            </button>

            <button onClick={createCustomer}>
              Save
            </button>

          </div>
        </div>
      )}
    </div>
  );
}