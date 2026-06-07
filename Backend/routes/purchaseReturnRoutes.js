   import express from "express";

   import {
   createPurchaseReturn,
   getPurchaseReturns,
   getPurchaseReturnById,
   } from "../controllers/purchaseReturnController.js";

   import { protect } from "../middleware/auth.js";
   import { attachStore } from "../middleware/attachStore.js";
   import { allowRoles } from "../middleware/allowRoles.js";

   const router = express.Router();

   /* =========================================
      GLOBAL MIDDLEWARE
   ========================================= */
   router.use(protect, attachStore);

   /* =========================================
      PURCHASE RETURNS
   ========================================= */

   // Create purchase return (ADMIN ONLY)
   router.post("/", allowRoles("ADMIN"), createPurchaseReturn);

   // Get all purchase returns
   router.get("/", allowRoles("ADMIN", "EMPLOYEE"), getPurchaseReturns);

   // Get single purchase return
   router.get("/:id", allowRoles("ADMIN", "EMPLOYEE"), getPurchaseReturnById);

   export default router;