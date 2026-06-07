import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { getData } from "../utils/apiResponse";
import "./Css/LedgerReport.css";

export default function LedgerReport() {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState("");
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD PARTIES ================= */
  useEffect(() => {
    const loadParties = async () => {
      try {
        const res = await api.get("/parties");
        setParties(getData(res) || []);
      } catch (err) {
        console.error(err);
      }
    };

    loadParties();
  }, []);

  /* ================= LOAD LEDGER ================= */
  useEffect(() => {
    if (!selectedParty) {
      setLedger([]);
      return;
    }

    const loadLedger = async () => {
      try {
        setLoading(true);

        const res = await api.get(
          `/ledger/party/${selectedParty}`
        );

        setLedger(getData(res) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadLedger();
  }, [selectedParty]);

  /* ================= SUMMARY ================= */

  const totalDebit = useMemo(
    () =>
      ledger.reduce(
        (sum, l) =>
          l.type === "DEBIT"
            ? sum + (l.amount || 0)
            : sum,
        0
      ),
    [ledger]
  );

  const totalCredit = useMemo(
    () =>
      ledger.reduce(
        (sum, l) =>
          l.type === "CREDIT"
            ? sum + (l.amount || 0)
            : sum,
        0
      ),
    [ledger]
  );

  const latestBalance =
    ledger.length > 0
      ? ledger[ledger.length - 1].balance || 0
      : 0;

  const getTypeLabel = (type) => {
    switch (type) {
      case "SALE":
        return "Sale";

      case "PURCHASE":
        return "Purchase";

      case "SALES_RETURN":
        return "Sales Return";

      case "PURCHASE_RETURN":
        return "Purchase Return";

      case "PAYMENT_IN":
        return "Payment In";

      case "PAYMENT_OUT":
        return "Payment Out";

      default:
        return type;
    }
  };

  return (
    <div className="ledger-report-page">

      <div className="report-header">
        <h2>Ledger Report</h2>
      </div>

      {/* PARTY SELECT */}

      <div className="filters">

        <div className="filter-group">

          <label>Select Party</label>

          <select
            value={selectedParty}
            onChange={(e) =>
              setSelectedParty(
                e.target.value
              )
            }
          >
            <option value="">
              Select Party
            </option>

            {parties.map((party) => (
              <option
                key={party._id}
                value={party._id}
              >
                {party.name}
              </option>
            ))}
          </select>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="summary-grid">

        <div className="summary-card debit">
          <h4>Total Debit</h4>
          <p>₹{totalDebit}</p>
        </div>

        <div className="summary-card credit">
          <h4>Total Credit</h4>
          <p>₹{totalCredit}</p>
        </div>

        <div
          className={
            latestBalance >= 0
              ? "summary-card positive"
              : "summary-card negative"
          }
        >
          <h4>
            Current Balance
          </h4>

          <p>
            ₹
            {Math.abs(
              latestBalance
            )}
          </p>
        </div>

      </div>

      {/* TABLE */}

      <div className="table-wrapper">

        <table className="report-table">

          <thead>

            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Amount</th>
              <th>Payment Mode</th>
              <th>Status</th>
            </tr>

          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td
                  colSpan="7"
                  className="no-data"
                >
                  Select Party
                </td>
              </tr>
            ) : ledger.length === 0 ? (
              <tr>
                <td
                  colSpan="7"
                  className="no-data"
                >
                  No ledger entries found
                </td>
              </tr>
            ) : (
              ledger.map(
                (entry) => (
                  <tr
                    key={entry._id}
                  >

                    <td>
                      {new Date(
                        entry.transactionDate ||
                          entry.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {getTypeLabel(
                        entry.entryType
                      )}
                    </td>

                    <td className="debit-text">
                      {entry.type ===
                      "DEBIT"
                        ? `₹${entry.amount}`
                        : "—"}
                    </td>

                    <td className="credit-text">
                      {entry.type ===
                      "CREDIT"
                        ? `₹${entry.amount}`
                        : "—"}
                    </td>

                    <td>
                      ₹{entry.amount}
                    </td>

                    <td>
                      {entry.paymentMode?.toUpperCase() ||
                        "—"}
                    </td>

                    <td>
                      {entry.balance >=
                      0 ? (
                        <span className="owe-us">
                          They Owe
                        </span>
                      ) : (
                        <span className="we-owe">
                          We Owe
                        </span>
                      )}
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