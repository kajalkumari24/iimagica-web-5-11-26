import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import {
  getUserSubscription,
  startFreeTrial,
  upgradeSubscription,
  checkSubscriptionExpiry,
  adminGetUserSubscription,
  adminResetUserFreeTrial,
  verifyIosPurchase,
} from "../controllers/subscriptionController.js";

const router = express.Router();

// Admin routes (Needs to be placed before the global authMiddleware)
router.get("/admin/user/:userId", adminAuthMiddleware, adminGetUserSubscription);
router.post("/admin/user/:userId/reset-trial", adminAuthMiddleware, adminResetUserFreeTrial);

// All user routes require authentication
router.use(authMiddleware);

// Verify iOS App Store In-App Purchase
router.post("/verify-ios-purchase", verifyIosPurchase);

// Get user's current subscription
router.get("/me", getUserSubscription);

// Start free trial for new user
router.post("/start-trial", startFreeTrial);

// Upgrade subscription
router.post("/upgrade", upgradeSubscription);

// Check subscription expiry
router.get("/expiry-check", checkSubscriptionExpiry);

export default router;
