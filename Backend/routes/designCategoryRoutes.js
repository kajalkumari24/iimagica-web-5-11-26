// routes/designCategoryRoutes.js

import express from "express";

import {
  createDesignCategory,
  getDesignCategories,
  updateDesignCategory,
  deleteDesignCategory
} from "../controllers/designCategoryController.js";

const router = express.Router();

// Create
router.post("/", createDesignCategory);

// Get
router.get("/", getDesignCategories);

// Update
router.put("/:id", updateDesignCategory);

// Delete
router.delete("/:id", deleteDesignCategory);

export default router;
