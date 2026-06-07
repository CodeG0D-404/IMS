import StockTransaction from "../models/StockTransaction.js";

export const logStockTransaction = async ({
  product,
  store,
  type,
  quantity,
  costPrice = 0,
  sellingPrice = 0,
  performedBy,
  stockLot,
  notes = "",
  session = null,
}) => {
  const totalCost = costPrice * quantity;
  const totalRevenue = sellingPrice * quantity;
  const profit = totalRevenue - totalCost;

  /* =========================
     FIX: direction mapping
     (UPDATED ONLY THIS PART)
  ========================= */
  const IN_TYPES = ["PURCHASE", "PURCHASE_DELETE", "SALES_RETURN"];
  const OUT_TYPES = ["SALE", "PURCHASE_RETURN"];

  const direction = IN_TYPES.includes(type) ? "IN" : "OUT";

  await StockTransaction.create(
    [
      {
        product,
        store,
        transactionType: type,
        direction,
        quantity,
        costPrice,
        sellingPrice,
        totalCost,
        totalRevenue,
        profit,
        performedBy,
        stockLot,
        notes,
      },
    ],
    { session }
  );
};