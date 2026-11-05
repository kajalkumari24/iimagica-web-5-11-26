import express from "express";
import { createContact, getContacts, deleteContact, getContactCount } from "../controllers/contactController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createContact);   // ➕ Save form data
router.get("/", getContacts);      // 📂 Get all
router.delete("/:id", deleteContact); // ❌ Delete

router.get("/count", getContactCount);

export default router;
