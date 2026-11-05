import express from "express";

import {
  getTermsAndConditions,
  createOrUpdateTermsAndConditions
} from "../controllers/termsAndConditionsController.js";


import {
  adminAuthMiddleware
} from "../middleware/adminAuthMiddleware.js";


const router = express.Router();



router.get(
  "/terms-and-conditions",
  getTermsAndConditions
);



router.post(
  "/terms-and-conditions",
  adminAuthMiddleware,
  createOrUpdateTermsAndConditions
);



export default router;