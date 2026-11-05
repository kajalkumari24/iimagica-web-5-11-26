import express from "express";
import {
  createPlan,
  getPlans,
  getSinglePlan,
  updatePlan,
  deletePlan,
} from "../controllers/planController.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// CREATE
router.post("/create", adminAuthMiddleware, createPlan);

// READ
router.get("/all", getPlans);
router.get("/:id", getSinglePlan);

// UPDATE
router.put("/:id", adminAuthMiddleware, updatePlan);

// DELETE
router.delete("/:id", adminAuthMiddleware, deletePlan);

export default router;