import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/ProfitLossReport.css";

export default function ProfitLossReport() {
  const [sales, setSales] = useState([]);
  const [saleItems, setSaleItems] = useState([]);
  const [salesReturns, setSalesReturns] = useState([]);

  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, itemsRes, returnsRes] =
          await Promise.all([
            api.get("/sales"),
            api.get("/sale-items"),
            api.get("/sales/returns"),
          ]);

        setSales(getData(salesRes) || []);
        setSaleItems(getData(itemsRes) || []);
        setSalesReturns(getData(returnsRes) || []);
      } catch (err) {
        console.error(
          "Failed to load profit report",
          err
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ==================================
     FILTER SALES
  ================================== */

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const saleDate = new Date(
        sale.saleDate || sale.createdAt
      );

      const matchesStart =
        !startDate ||
        saleDate >= new Date(startDate);

      const matchesEnd =
        !endDate ||
        saleDate <= new Date(endDate);

      return matchesStart && matchesEnd;
    });
  }, [sales, startDate, endDate]);

  /* ==================================
     SUMMARY
  ================================== */

  const totalRevenue = saleItems.reduce(
    (sum, item) =>
      sum + (item.totalRevenue || 0),
    0
  );

  const totalCost = saleItems.reduce(
    (sum, item) =>
      sum + (item.totalCost || 0),
    0
  );

  const grossProfit = saleItems.reduce(
    (sum, item) =>
      sum + (item.profit || 0),
    0
  );

  const returnImpact = saleItems.reduce(
    (sum, item) =>
      sum +
      (item.returnedProfitLoss || 0),
    0
  );

  const netProfit = saleItems.reduce(
    (sum, item) =>
      sum +
      (
        (item.profit || 0) -
        (item.returnedProfitLoss || 0)
      ),
    0
  );

  const totalDue = filteredSales.reduce(
    (sum, sale) =>
      sale.dueAmount > 0
        ? sum + sale.dueAmount
        : sum,
    0
  );

  const totalAdvance = filteredSales.reduce(
    (sum, sale) =>
      sale.dueAmount < 0
        ? sum + Math.abs(sale.dueAmount)
        : sum,
    0
  );

  const totalReturnedAmount =
    filteredSales.reduce(
      (sum, sale) =>
        sum +
        (sale.returnedAmount || 0),
      0
    );

  const totalReturnedQty =
    filteredSales.reduce(
      (sum, sale) =>
        sum +
        (sale.returnedQuantity || 0),
      0
    );

  /* ==================================
     RETURN MAP
  ================================== */

  const returnMap = {};

  salesReturns.forEach((ret) => {
    const saleId = ret.sale;

    if (!saleId) return;

    if (!returnMap[saleId]) {
      returnMap[saleId] = [];
    }

    returnMap[saleId].push(ret);
  });

  if (loading) {
    return (
      <p className="loading">
        Loading...
      </p>
    );
  }

  return (
    <div className="profit-loss-page">

      {/* HEADER */}

      <div className="report-header">
        <h2>Profit & Loss Report</h2>
      </div>

      {/* FILTERS */}

      <div className="filters-card">

        <div className="filters">

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
            Revenue
          </div>

          <div className="kpi-value revenue">
            ₹{totalRevenue.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Cost Of Goods Sold
          </div>

          <div className="kpi-value cost">
            ₹{totalCost.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Gross Profit
          </div>

          <div className="kpi-value profit">
            ₹{grossProfit.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Return Impact
          </div>

          <div className="kpi-value return">
            ₹{returnImpact.toLocaleString()}
          </div>
        </div>

      </div>

      {/* NET PROFIT */}

      <div
        className={
          netProfit >= 0
            ? "hero-profit"
            : "hero-loss"
        }
      >
        <div className="hero-title">
          Net Profit
        </div>

        <div className="hero-value">
          ₹
          {Math.abs(
            netProfit
          ).toLocaleString()}
        </div>
      </div>

      {/* SECONDARY KPI */}

      <div className="kpi-grid">

        <div className="kpi-card">
          <div className="kpi-label">
            Outstanding Due
          </div>

          <div className="kpi-value cost">
            ₹{totalDue.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Customer Advance
          </div>

          <div className="kpi-value profit">
            ₹{totalAdvance.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Returned Value
          </div>

          <div className="kpi-value return">
            ₹
            {totalReturnedAmount.toLocaleString()}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            Return Count
          </div>

          <div className="kpi-value">
            {salesReturns.length}
          </div>
        </div>

      </div>

      {/* TABLE */}

      <div className="table-card">

        <table className="report-table">

          <thead>

            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Received</th>
              <th>Due</th>
              <th>Advance</th>
              <th>Returns</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            {filteredSales.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="no-data"
                >
                  No sales found
                </td>
              </tr>
            ) : (
              filteredSales.map(
                (sale) => {

                  const due =
                    sale.dueAmount > 0
                      ? sale.dueAmount
                      : 0;

                  const advance =
                    sale.dueAmount < 0
                      ? Math.abs(
                          sale.dueAmount
                        )
                      : 0;

                  return (
                    <tr
                      key={sale._id}
                    >

                      <td>
                        {sale.invoiceNumber ||
                          "—"}
                      </td>

                      <td>
                        {sale.party?.name ||
                          "Walk-in"}
                      </td>

                      <td>
                        ₹
                        {(
                          sale.totalAmount ||
                          0
                        ).toLocaleString()}
                      </td>

                      <td>
                        ₹
                        {(
                          sale.paidAmount ||
                          0
                        ).toLocaleString()}
                      </td>

                      <td>
                        {due > 0 ? (
                          <span className="due">
                            ₹
                            {due.toLocaleString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {advance > 0 ? (
                          <span className="advance">
                            ₹
                            {advance.toLocaleString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {sale.returnCount >
                        0 ? (
                          <span>
                            {
                              sale.returnCount
                            }
                            {" "}
                            Return(s)
                            <br />
                            ₹
                            {(
                              sale.returnedAmount ||
                              0
                            ).toLocaleString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>

                        <span
                          className={`badge badge-${sale.status?.toLowerCase()}`}
                        >
                          {
                            sale.status
                          }
                        </span>

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