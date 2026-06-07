import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import { getData } from "../utils/apiResponse";

import "./Css/SalesReturnReport.css";

export default function SalesReturnReport() {
  const navigate = useNavigate();

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] =
    useState("all");

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  /* =====================================
     FETCH
  ===================================== */
  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const res = await api.get(
          "/sales/returns"
        );

        setReturns(
          getData(res) || []
        );

      } catch (error) {
        console.error(
          "Failed to load sales returns",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, []);

  /* =====================================
     FILTERS
  ===================================== */
  const filteredReturns =
    useMemo(() => {

      return returns.filter(
        (item) => {

          const customer =
            item.party?.name?.toLowerCase() ||
            "";

          const invoice =
            item.sale?.invoiceNumber?.toLowerCase() ||
            "";

          const query =
            search.toLowerCase();

          const matchesSearch =
            customer.includes(query) ||
            invoice.includes(query);

          const matchesType =
            typeFilter === "all"
              ? true
              : item.adjustmentType ===
                typeFilter;

          const returnDate =
            new Date(
              item.returnDate ||
                item.createdAt
            );

          const matchesStart =
            !startDate ||
            returnDate >=
              new Date(startDate);

          const matchesEnd =
            !endDate ||
            returnDate <=
              new Date(endDate);

          return (
            matchesSearch &&
            matchesType &&
            matchesStart &&
            matchesEnd
          );
        }
      );

    }, [
      returns,
      search,
      typeFilter,
      startDate,
      endDate,
    ]);

  /* =====================================
     SUMMARY
  ===================================== */

  const totalReturns =
    filteredReturns.reduce(
      (sum, item) =>
        sum +
        (item.totalAmount || 0),
      0
    );

  const refundAmount =
    filteredReturns
      .filter(
        (item) =>
          item.adjustmentType ===
          "REFUND"
      )
      .reduce(
        (sum, item) =>
          sum +
          (item.totalAmount || 0),
        0
      );

  const adjustAmount =
    filteredReturns
      .filter(
        (item) =>
          item.adjustmentType ===
          "ADJUST"
      )
      .reduce(
        (sum, item) =>
          sum +
          (item.totalAmount || 0),
        0
      );

  const replaceAmount =
    filteredReturns
      .filter(
        (item) =>
          item.adjustmentType ===
          "REPLACE"
      )
      .reduce(
        (sum, item) =>
          sum +
          (item.totalAmount || 0),
        0
      );

  /* =====================================
     BADGES
  ===================================== */

  const getTypeClass = (
    type
  ) => {
    switch (type) {
      case "REFUND":
        return "type-refund";

      case "ADJUST":
        return "type-adjust";

      case "REPLACE":
        return "type-replace";

      default:
        return "";
    }
  };

  const getImpact = (
    type
  ) => {
    switch (type) {

      case "REFUND":
        return "Cash Refunded";

      case "ADJUST":
        return "Customer Credit";

      case "REPLACE":
        return "Item Replaced";

      default:
        return "-";
    }
  };

  /* =====================================
     UI
  ===================================== */

  if (loading) {
    return (
      <p className="loading">
        Loading...
      </p>
    );
  }

  return (
    <div className="sales-return-report-page">

      {/* HEADER */}

      <div className="report-header">
        <h2>
          Sales Return Report
        </h2>
      </div>

      {/* FILTERS */}

      <div className="filters-card">

        <div className="filters">

          <div className="filter-group">
            <label>
              Search
            </label>

            <input
              type="text"
              placeholder="Customer / Invoice"
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
              Return Type
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

              <option value="REFUND">
                Refund
              </option>

              <option value="ADJUST">
                Adjust
              </option>

              <option value="REPLACE">
                Replace
              </option>

            </select>
          </div>

          <div className="filter-group">
            <label>
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }
            />
          </div>

          <div className="filter-group">
            <label>
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }
            />
          </div>

        </div>

      </div>

      {/* KPI */}

      <div className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-label">
            Total Return Value
          </div>

          <div className="kpi-value total-value">
            ₹
            {totalReturns.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Refunds
          </div>

          <div className="kpi-value refund-value">
            ₹
            {refundAmount.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Customer Credits
          </div>

          <div className="kpi-value adjust-value">
            ₹
            {adjustAmount.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Replacements
          </div>

          <div className="kpi-value replace-value">
            ₹
            {replaceAmount.toLocaleString()}
          </div>
        </div>

      </div>

      {/* HERO */}

      <div className="hero-card">

        <div className="hero-title">
          Total Return Impact
        </div>

        <div className="hero-value">
          ₹
          {totalReturns.toLocaleString()}
        </div>

        <div className="hero-subtitle">
          Combined value of all
          customer returns
        </div>

      </div>

      {/* TABLE */}

      <div className="table-card">

        <table className="report-table">

          <thead>

            <tr>
              <th>
                Return Date
              </th>

              <th>
                Sale Date
              </th>

              <th>
                Invoice
              </th>

              <th>
                Customer
              </th>

              <th>
                Sale Amount
              </th>

              <th>
                Paid
              </th>

              <th>
                Due
              </th>

              <th>
                Type
              </th>

              <th>
                Return Amount
              </th>

              <th>
                Impact
              </th>

              <th>
                Action
              </th>
            </tr>

          </thead>

          <tbody>

            {filteredReturns.length ===
            0 ? (
              <tr>
                <td
                  colSpan="11"
                  className="no-data"
                >
                  No sales returns
                  found
                </td>
              </tr>
            ) : (
              filteredReturns.map(
                (item) => (
                  <tr
                    key={item._id}
                  >

                    <td>
                      {new Date(
                        item.returnDate ||
                          item.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {item.sale
                        ?.saleDate
                        ? new Date(
                            item.sale.saleDate
                          ).toLocaleDateString()
                        : "—"}
                    </td>

                    <td>
                      {item.sale
                        ?.invoiceNumber ||
                        "—"}
                    </td>

                    <td>
                      {item.party
                        ?.name ||
                        "—"}
                    </td>

                    <td>
                      ₹
                      {(
                        item.sale
                          ?.totalAmount ||
                        0
                      ).toLocaleString()}
                    </td>

                    <td>
                      ₹
                      {(
                        item.sale
                          ?.paidAmount ||
                        0
                      ).toLocaleString()}
                    </td>

                    <td>

                      {(
                        item.sale
                          ?.dueAmount ||
                        0
                      ) > 0 ? (
                        <span className="due-text">
                          ₹
                          {item.sale.dueAmount.toLocaleString()}
                        </span>
                      ) : (
                        "—"
                      )}

                    </td>

                    <td>

                      <span
                        className={`type-badge ${getTypeClass(
                          item.adjustmentType
                        )}`}
                      >
                        {
                          item.adjustmentType
                        }
                      </span>

                    </td>

                    <td>
                      ₹
                      {(
                        item.totalAmount ||
                        0
                      ).toLocaleString()}
                    </td>

                    <td>
                      {getImpact(
                        item.adjustmentType
                      )}
                    </td>

                    <td>

                      <button
                        className="view-btn"
                        onClick={() =>
                          navigate(
                            `/dashboard/sales/returns/${item._id}`
                          )
                        }
                      >
                        View
                      </button>

                    </td>

                  </tr>
                )
              )
            )}

          </tbody>

        </table>

      </div>

    </div>
  );
}