import { useEffect, useMemo, useState } from "react";

import api from "../services/api";
import { getData } from "../utils/apiResponse";

import "./Css/DueReport.css";

export default function DueReport() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  /* ==================================
     FETCH DATA
  ================================== */
  useEffect(() => {
    const fetchDues = async () => {
      try {
        const [
          partiesRes,
          salesRes,
          purchasesRes,
        ] = await Promise.all([
          api.get("/parties"),
          api.get("/sales"),
          api.get("/purchases"),
        ]);

        const partiesData =
          getData(partiesRes) || [];

        const salesData =
          getData(salesRes) || [];

        const purchasesData =
          getData(purchasesRes) || [];

        const merged = partiesData.map(
          (party) => {

            const customerSales =
              salesData.filter(
                (sale) =>
                  sale.party?._id ===
                  party._id
              );

            const receivable =
              customerSales.reduce(
                (sum, sale) =>
                  sum +
                  Math.max(
                    sale.dueAmount || 0,
                    0
                  ),
                0
              );

            const supplierPurchases =
              purchasesData.filter(
                (purchase) =>
                  purchase.party?._id ===
                  party._id
              );

            const payable =
              supplierPurchases.reduce(
                (sum, purchase) =>
                  sum +
                  Math.max(
                    purchase.dueAmount ||
                      (
                        (purchase.totalAmount ||
                          0) -
                        (purchase.paidAmount ||
                          0)
                      ),
                    0
                  ),
                0
              );

            return {
              ...party,

              receivable,
              payable,

              netPosition:
                receivable -
                payable,
            };
          }
        );

        setParties(merged);

      } catch (err) {
        console.error(
          "Failed to fetch dues",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDues();
  }, []);

  /* ==================================
     FILTER
  ================================== */
  const filteredParties = useMemo(() => {

    return parties.filter((party) => {

      const matchesSearch =
        (
          party.name || ""
        )
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      let matchesType = true;

      if (
        typeFilter === "customer"
      ) {
        matchesType =
          party.types?.includes(
            "customer"
          );
      }

      if (
        typeFilter === "supplier"
      ) {
        matchesType =
          party.types?.includes(
            "supplier"
          );
      }

      return (
        matchesSearch &&
        matchesType
      );
    });

  }, [
    parties,
    search,
    typeFilter,
  ]);

  /* ==================================
     SUMMARY
  ================================== */

  const totalReceivable =
    filteredParties.reduce(
      (sum, p) =>
        sum +
        (p.receivable || 0),
      0
    );

  const totalPayable =
    filteredParties.reduce(
      (sum, p) =>
        sum +
        (p.payable || 0),
      0
    );

  const netPosition =
    totalReceivable -
    totalPayable;

  /* ==================================
     UI
  ================================== */

  if (loading) {
    return (
      <p className="loading">
        Loading...
      </p>
    );
  }

  return (
    <div className="due-report-page">

      {/* HEADER */}

      <div className="report-header">
        <h2>
          Receivables & Payables
        </h2>
      </div>

      {/* FILTERS */}

      <div className="filters-card">

        <div className="filters">

          <div className="filter-group">

            <label>
              Search Party
            </label>

            <input
              type="text"
              placeholder="Customer or supplier..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

          <div className="filter-group">

            <label>
              Party Type
            </label>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value
                )
              }
            >

              <option value="all">
                All
              </option>

              <option value="customer">
                Customers
              </option>

              <option value="supplier">
                Suppliers
              </option>

            </select>

          </div>

        </div>

      </div>

      {/* KPI */}

      <div className="kpi-grid">

        <div className="kpi-card">

          <div className="kpi-label">
            Receivables
          </div>

          <div className="kpi-value receivable-value">
            ₹
            {totalReceivable.toLocaleString()}
          </div>

          <div className="kpi-subtitle">
            Money To Receive
          </div>

        </div>

        <div className="kpi-card">

          <div className="kpi-label">
            Payables
          </div>

          <div className="kpi-value payable-value">
            ₹
            {totalPayable.toLocaleString()}
          </div>

          <div className="kpi-subtitle">
            Money To Pay
          </div>

        </div>

      </div>

      {/* NET POSITION */}

      <div
        className={
          netPosition >= 0
            ? "hero-positive"
            : "hero-negative"
        }
      >

        <div className="hero-title">
          Net Position
        </div>

        <div className="hero-value">
          ₹
          {Math.abs(
            netPosition
          ).toLocaleString()}
        </div>

        <div className="hero-subtitle">

          {netPosition >= 0
            ? "Expected Net Inflow"
            : "Expected Net Outflow"}

        </div>

      </div>

      {/* TABLE */}

      <div className="table-card">

        <table className="report-table">

          <thead>

            <tr>
              <th>Party</th>
              <th>Type</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Receivable</th>
              <th>Payable</th>
              <th>Net Position</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            {filteredParties.length === 0 ? (
              <tr>

                <td
                  colSpan="8"
                  className="no-data"
                >
                  No records found
                </td>

              </tr>
            ) : (
              filteredParties.map(
                (party) => {

                  const net =
                    party.netPosition ||
                    0;

                  return (
                    <tr
                      key={party._id}
                    >

                      <td>
                        {party.name}
                      </td>

                      <td>
                        {party.types?.join(
                          ", "
                        ) || "—"}
                      </td>

                      <td>
                        {party.phone ||
                          "—"}
                      </td>

                      <td>
                        {party.email ||
                          "—"}
                      </td>

                      <td>

                        {party.receivable >
                        0 ? (

                          <span className="receivable-text">
                            ₹
                            {party.receivable.toLocaleString()}
                          </span>

                        ) : (
                          "—"
                        )}

                      </td>

                      <td>

                        {party.payable >
                        0 ? (

                          <span className="payable-text">
                            ₹
                            {party.payable.toLocaleString()}
                          </span>

                        ) : (
                          "—"
                        )}

                      </td>

                      <td
                        className={
                          net >= 0
                            ? "net-positive"
                            : "net-negative"
                        }
                      >
                        ₹
                        {Math.abs(
                          net
                        ).toLocaleString()}
                      </td>

                      <td>

                        {party.receivable >
                        0 ? (

                          <span className="badge badge-receivable">
                            TO RECEIVE
                          </span>

                        ) : party.payable >
                          0 ? (

                          <span className="badge badge-payable">
                            TO PAY
                          </span>

                        ) : (

                          <span className="badge badge-settled">
                            SETTLED
                          </span>

                        )}

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