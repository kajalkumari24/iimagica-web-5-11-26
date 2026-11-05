import express from "express";
import {
  getProfileTypes,
  addProfileType,
  updateProfileType,
  deleteProfileType,
} from "../controllers/profileTypeController.js";

const router = express.Router();

// 🔓 User side (dropdown)
router.get("/:type", getProfileTypes);

// 🔐 Admin side
router.post("/", addProfileType);
router.put("/:id", updateProfileType);
router.delete("/:id", deleteProfileType);

export default router;