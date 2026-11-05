// routes/feedbackRoutes.js
import express from "express";
import { checkFeedbackStatus, addFeedback, getAllFeedbacks, getFeedbackCount, deleteFeedback } from "../controllers/feedbackController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// ✅ Protected routes
router.get("/check-feedback", authMiddleware, checkFeedbackStatus);
router.post("/add-feedback", authMiddleware, addFeedback);
router.get("/all", adminAuthMiddleware, getAllFeedbacks);
router.get("/count", adminAuthMiddleware, getFeedbackCount);
router.delete("/:id", adminAuthMiddleware, deleteFeedback);

export default router;
