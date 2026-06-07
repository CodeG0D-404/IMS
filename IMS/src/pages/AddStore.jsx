import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/AddStore.css";

function AddStore() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    storeCode: "",
    ownerName: "",
    phone: "",
    email: "",
    gstNumber: "",
    employeeUsername: "",
    employeePassword: "",
    address: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },
  });

  const [loading, setLoading] = useState(false);

  /* =========================================
     HANDLE CHANGE
  ========================================= */
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const key = name.split(".")[1];

      setForm((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [key]: value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  /* =========================================
     SUBMIT
  ========================================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await api.post("/stores", form);

      const createdStore = getData(res);

      if (!createdStore) {
        throw new Error("Store creation failed");
      }

      alert("Store created successfully!");

      navigate("/dashboard/stores");

    } catch (error) {
      console.error("Create Store Error:", error);

      alert(
        error.response?.data?.message ||
        error.message ||
        "Error creating store"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================
     UI
  ========================================= */
  return (
    <div className="dashboard-page">

      <h2>Create Store</h2>

      <form onSubmit={handleSubmit} className="form-grid">

        {/* STORE INFO */}
        <h4>Store Information</h4>

        <input
          name="name"
          placeholder="Store Name"
          onChange={handleChange}
          required
        />

        <input
          name="storeCode"
          placeholder="Store Code"
          onChange={handleChange}
          required
        />

        <input
          name="ownerName"
          placeholder="Owner Name"
          onChange={handleChange}
          required
        />

        <input
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          required
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <input
          name="gstNumber"
          placeholder="GST Number"
          onChange={handleChange}
        />

        {/* ADDRESS */}
        <h4>Address</h4>

        <input
          name="address.line1"
          placeholder="Address Line 1"
          onChange={handleChange}
        />

        <input
          name="address.line2"
          placeholder="Address Line 2"
          onChange={handleChange}
        />

        <input
          name="address.city"
          placeholder="City"
          onChange={handleChange}
        />

        <input
          name="address.state"
          placeholder="State"
          onChange={handleChange}
        />

        <input
          name="address.pincode"
          placeholder="Pincode"
          onChange={handleChange}
        />

        <input
          name="address.country"
          placeholder="Country"
          onChange={handleChange}
        />

        {/* EMPLOYEE */}
        <h4>Default Employee Login</h4>

        <input
          name="employeeUsername"
          placeholder="Employee Username"
          onChange={handleChange}
          required
        />

        <input
          name="employeePassword"
          type="password"
          placeholder="Employee Password"
          onChange={handleChange}
          required
        />

        {/* ACTION */}
        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Store"}
        </button>

      </form>

    </div>
  );
}

export default AddStore;