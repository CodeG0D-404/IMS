import express from "express";
import {
  createParty,
  getParties,
  getPartyById,
  updateParty,
  deleteParty,
} from "../controllers/partyController.js";

import { protect } from "../middleware/auth.js";
import { attachStore } from "../middleware/attachStore.js";

const router = express.Router();

router.use(protect, attachStore);

router.post("/", createParty);
router.get("/", getParties);
router.get("/:id", getPartyById);
router.put("/:id", updateParty);
router.delete("/:id", deleteParty);

export default router;