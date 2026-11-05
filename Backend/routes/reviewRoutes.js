import express from "express";
import {
  submitReview,
  getMyReview,
  getVisibleReviews,
  getAllReviews,
  toggleReviewVisibility,
  deleteReview,
} from "../controllers/reviewController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// ── Public ─────────────────────────────────────────────────────────────────────
router.get("/visible", getVisibleReviews);

// ── User (JWT required) ────────────────────────────────────────────────────────
router.post("/submit", authMiddleware, submitReview);
router.get("/my-review", authMiddleware, getMyReview);

// ── Admin ──────────────────────────────────────────────────────────────────────
router.get("/all", adminAuthMiddleware, getAllReviews);
router.patch("/:id/toggle-visibility", adminAuthMiddleware, toggleReviewVisibility);
router.delete("/:id", adminAuthMiddleware, deleteReview);

export default router;
