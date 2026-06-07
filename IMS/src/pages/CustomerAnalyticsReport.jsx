import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/CustomerAnalyticsReport.css";

export default function CustomerAnalyticsReport() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await api.get("/sales");

        setSales(getData(res) || []);

      } catch (err) {
        console.error(
          "Failed to load customer analytics",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  /* ================= BUILD ANALYTICS ================= */
  const customerData = useMemo(() => {

    const map = {};

    sales.forEach((sale) => {

      const customer =
        sale.party;

      if (!customer?._id) return;

      if (!map[customer._id]) {
        map[customer._id] = {
          _id: customer._id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,

          totalPurchases: 0,
          totalPaid: 0,
          totalDue: 0,

          invoiceCount: 0,
        };
      }

      map[customer._id].totalPurchases +=
        sale.totalAmount || 0;

      map[customer._id].totalPaid +=
        sale.paidAmount || 0;

      map[customer._id].totalDue +=
        (sale.totalAmount || 0) -
        (sale.paidAmount || 0);

      map[customer._id].invoiceCount += 1;

    });

    return Object.values(map);

  }, [sales]);

  /* ================= FILTER ================= */
  const filteredCustomers = useMemo(() => {

    return customerData.filter((c) =>
      c.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
    );

  }, [customerData, search]);

  /* ================= SUMMARY ================= */
  const totalCustomers =
    filteredCustomers.length;

  const totalRevenue =
    filteredCustomers.reduce(
      (sum, c) =>
        sum + c.totalPurchases,
      0
    );

  const totalDue =
    filteredCustomers.reduce(
      (sum, c) =>
        sum + c.totalDue,
      0
    );

  /* ================= UI ================= */
  if (loading) {
    return <p className="loading">Loading...</p>;
  }

  return (
    <div className="customer-analytics-page">

      <div className="report-header">
        <h2>Customer Analytics</h2>
      </div>

      {/* FILTER */}
      <div className="filters">

        <div className="filter-group">

          <label>Search Customer</label>

          <input
            type="text"
            placeholder="Customer name..."
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

          <h4>Total Customers</h4>

          <p>{totalCustomers}</p>

        </div>

        <div className="summary-card revenue-card">

          <h4>Total Revenue</h4>

          <p>₹{totalRevenue}</p>

        </div>

        <div className="summary-card due-card">

          <h4>Total Due</h4>

          <p>₹{totalDue}</p>

        </div>

      </div>

      {/* TABLE */}
      <div className="table-wrapper">

        <table className="report-table">

          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Invoices</th>
              <th>Total Purchase</th>
              <th>Total Paid</th>
              <th>Total Due</th>
            </tr>
          </thead>

          <tbody>

            {filteredCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="no-data"
                >
                  No customer data found
                </td>
              </tr>
            ) : (
              filteredCustomers.map((c) => (
                <tr key={c._id}>

                  <td>
                    {c.name}
                  </td>

                  <td>
                    {c.phone || "—"}
                  </td>

                  <td>
                    {c.email || "—"}
                  </td>

                  <td>
                    {c.invoiceCount}
                  </td>

                  <td>
                    ₹{c.totalPurchases}
                  </td>

                  <td>
                    ₹{c.totalPaid}
                  </td>

                  <td
                    className={
                      c.totalDue > 0
                        ? "due-text"
                        : "clear-text"
                    }
                  >
                    ₹{c.totalDue}
                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}