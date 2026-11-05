import express from "express";
import {
  getDetailedCategories,
  getPublicCategories,
  createCategory,
  updateCategory,
  togglePrimaryStatus,
  deleteCategory,
  getCategoryStats,
  reorderCategories
} from "../controllers/categoryController.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// Public route for app developers (no auth required)
router.get("/public", getPublicCategories);

// All other routes require admin authentication
router.use(adminAuthMiddleware);

// Get all categories with detailed information
router.get("/detailed", getDetailedCategories);

// Get category statistics
router.get("/stats", getCategoryStats);

// Create new category
router.post("/", createCategory);

// Update category
router.put("/:id", updateCategory);

// Toggle primary status
router.patch("/:id/primary", togglePrimaryStatus);

// Reorder categories
router.patch("/reorder", reorderCategories);

// Delete category
router.delete("/:id", deleteCategory);

export default router;