import express from "express";

import {
  getPrivacyPolicy,
  createOrUpdatePrivacyPolicy,
} from "../controllers/privacyPolicyController.js";

import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";


const router = express.Router();


// Public API
router.get(
  "/privacy-policy",
  getPrivacyPolicy
);


// Admin API
router.post(
  "/privacy-policy",
  adminAuthMiddleware,
  createOrUpdatePrivacyPolicy
);


export default router;