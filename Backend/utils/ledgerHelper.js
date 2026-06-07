import Ledger from "../models/Ledger.js";

/* =========================================
   CREATE LEDGER ENTRY
========================================= */
export const createLedgerEntry = async ({
  party,
  store,
  entryType,
  type,
  amount,
  paymentMode = null,
  referenceId = null,
  referenceModel = null,
  createdBy,
  note = "",
  impact = 0,
  session = null,
}) => {

  /* =========================
     GET PREVIOUS BALANCE
  ========================= */
  const lastEntry = await Ledger.findOne({
    party,
    store,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .session(session);

  const previousBalance = lastEntry
    ? Number(lastEntry.balance)
    : 0;

  /* =========================
     CALCULATE NEW BALANCE
  ========================= */
  const newBalance = previousBalance + impact;

  /* =========================
     CREATE LEDGER ENTRY
  ========================= */
  const [ledgerEntry] = await Ledger.create(
    [
      {
        party,
        store,

        entryType,
        type,

        amount,

        balance: newBalance,

        paymentMode,

        referenceId,
        referenceModel,

        createdBy,

        note,
      },
    ],
    { session }
  );

  return ledgerEntry;
};