import express from "express";
import { adminLogout, createAdmin, verifyAdmin, getUsers, getProfiles, updateUser, deleteUser, updateProfile, deleteProfile, getAdminActivity, getAdminMe } from "../controllers/adminController.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import Admin from "../models/adminModel.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

router.post(
  "/",
  async (req, res, next) => {
    try {
      const count = await Admin.countDocuments();
      if (count === 0) return next();
      return adminAuthMiddleware(req, res, next);
    } catch (err) {
      return res.status(500).json({ message: "Failed to validate admin creation" });
    }
  },
  createAdmin
);
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

router.post("/login", adminLoginLimiter, verifyAdmin);
router.post("/logout", adminAuthMiddleware, adminLogout);
router.get("/me", adminAuthMiddleware, getAdminMe);
router.get("/users", adminAuthMiddleware, getUsers);
router.put("/users/:id", adminAuthMiddleware, updateUser);
router.delete("/users/:id", adminAuthMiddleware, deleteUser);
router.get("/profiles", adminAuthMiddleware, getProfiles);
router.get("/activity", adminAuthMiddleware, getAdminActivity);
router.put("/profiles/:id", adminAuthMiddleware, updateProfile);
router.delete("/profiles/:id", adminAuthMiddleware, deleteProfile);

export default router
