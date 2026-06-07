import mongoose from "mongoose";

import Party from "../models/Party.js";
import Ledger from "../models/Ledger.js";

/* =========================================
   CREATE PARTY
========================================= */
export const createParty = async (req, res) => {
  try {
    const storeId = req.storeId;

    const {
      name,
      phone,
      email,
      address,
      types, // ["supplier"] / ["customer"]
    } = req.body;

    /* =========================
       VALIDATION
    ========================= */
    if (!name || !types || types.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name and types are required",
      });
    }

    const existing = await Party.findOne({
      store: storeId,
      phone,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Party with this phone already exists",
      });
    }

    const party = await Party.create({
      store: storeId,
      name,
      phone,
      email,
      address,
      types,
    });

    return res.status(201).json({
      success: true,
      data: party,
    });

  } catch (error) {
    console.error("Create Party Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================
   GET ALL PARTIES
========================================= */
export const getParties = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { type, search } = req.query;

    let filter = { store: storeId };

    /* =========================
       FILTER BY TYPE (ARRAY FIX)
    ========================= */
    if (type) {
      filter.types = type; // 🔥 IMPORTANT FIX
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const parties = await Party.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: parties.length,
      data: parties,
    });

  } catch (error) {
    console.error("Get Parties Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================
   GET PARTY BY ID
========================================= */
export const getPartyById = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const party = await Party.findOne({
      _id: id,
      store: storeId,
    });

    if (!party) {
      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: party,
    });

  } catch (error) {
    console.error("Get Party Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================
   UPDATE PARTY
========================================= */
export const updateParty = async (req, res) => {
  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const updates = req.body;

    const party = await Party.findOneAndUpdate(
      { _id: id, store: storeId },
      updates,
      { new: true, runValidators: true }
    );

    if (!party) {
      return res.status(404).json({
        success: false,
        message: "Party not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: party,
    });

  } catch (error) {
    console.error("Update Party Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* =========================================
   DELETE PARTY (SAFE)
========================================= */
export const deleteParty = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const storeId = req.storeId;
    const { id } = req.params;

    const party = await Party.findOne({
      _id: id,
      store: storeId,
    }).session(session);

    if (!party) {
      throw new Error("Party not found");
    }

    const ledgerExists = await Ledger.exists({
      party: party._id,
      store: storeId,
    });

    if (ledgerExists) {
      throw new Error(
        "Cannot delete party with existing transactions"
      );
    }

    await party.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Party deleted successfully",
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Delete Party Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};