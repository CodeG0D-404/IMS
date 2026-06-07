import StockLot from "../models/StockLot.js";

/* =========================================
   GET ALL STOCK LOTS (FIFO VIEW)
========================================= */
export const getStockLots = async (req, res) => {
  try {
    const storeId = req.storeId;

    const lots = await StockLot.find({
        store: storeId,

        isDeleted: false,
        isActive: true,

        remainingQty: { $gt: 0 },
      })
      .populate("product", "name sku")
      .sort({ purchaseDate: 1 });

    return res.status(200).json({
      success: true,
      count: lots.length,
      data: lots,
    });
  } catch (error) {
    console.error("Get Stock Lots Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   ALIAS (FIX FOR ROUTES)
========================================= */
export const getAllStockLots = getStockLots;

/* =========================================
   GET STOCK LOTS BY PRODUCT
========================================= */
export const getStockLotsByProduct = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { productId } = req.params;

    const lots = await StockLot.find({
      store: storeId,
      product: productId,

      isDeleted: false,
      isActive: true,

      remainingQty: { $gt: 0 },
    }).sort({ purchaseDate: 1 });

    return res.status(200).json({
      success: true,
      count: lots.length,
      data: lots,
    });
  } catch (error) {
    console.error("Get Product Lots Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   GET SINGLE STOCK LOT
========================================= */
export const getStockLotById = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const lot = await StockLot.findOne({
      _id: id,
      store: storeId,

      isDeleted: false,
    }).populate("product purchase");

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Stock lot not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: lot,
    });
  } catch (error) {
    console.error("Get Stock Lot Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =========================================
   LOW STOCK LOTS
========================================= */
export const getLowStockLots = async (req, res) => {
  try {
    const storeId = req.storeId;
    const threshold = Number(req.query.threshold) || 5;

    const lots = await StockLot.find({
      store: storeId,

      isDeleted: false,
      isActive: true,

      remainingQty: { $lte: threshold },
    })
      .populate("product", "name sku")
      .sort({ remainingQty: 1 });

    return res.status(200).json({
      success: true,
      count: lots.length,
      data: lots,
    });
  } catch (error) {
    console.error("Low Stock Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};