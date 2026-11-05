
import express from "express";
import {
  requestOTP,
  verifyOTP,
  resendOTP,
  me,
  logout,
  refreshAccessToken,
  phoneLogin,
  googleLogin,
  issueUserSession,
  updateFCMToken,
  deleteAccount,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import { otpRateLimit, verifyOtpRateLimit } from "../middleware/otpRateLimit.js";
import User from "../models/User.js";
import passport from "../config/googleAuth.js";
import Profile from "../models/Profile.js";
import jwt from "jsonwebtoken";

const router = express.Router();

const getAllowedOrigins = () => {
  const originStr = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  const origins = originStr
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const expandedOrigins = new Set(origins);
  origins.forEach((o) => {
    if (o.startsWith("https://www.")) {
      expandedOrigins.add(o.replace("https://www.", "https://"));
    } else if (o.startsWith("https://") && !o.startsWith("https://www.")) {
      expandedOrigins.add(o.replace("https://", "https://www."));
    }
  });

  return Array.from(expandedOrigins);
};

const getFallbackFrontendOrigin = () => {
  const origins = getAllowedOrigins();
  if (process.env.NODE_ENV === "production") {
    const prodOrigin = origins.find(o => o.startsWith("https://"));
    if (prodOrigin) return prodOrigin;
  }
  return origins[0] || "http://localhost:5173";
};

const FRONTEND_ORIGIN = getFallbackFrontendOrigin();

// Google OAuth routes
router.get("/auth/google", (req, res, next) => {
  const origin = req.query.origin || "";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: origin ? Buffer.from(origin).toString("base64") : undefined
  })(req, res, next);
});

router.get("/auth/google/callback", (req, res, next) => {
  let targetOrigin = FRONTEND_ORIGIN;
  if (req.query.state) {
    try {
      const decodedOrigin = Buffer.from(req.query.state, "base64").toString("utf-8");
      const allowed = getAllowedOrigins();
      if (allowed.includes(decodedOrigin)) {
        targetOrigin = decodedOrigin;
      }
    } catch (e) {
      console.warn("Failed to decode state origin:", e);
    }
  }

  passport.authenticate("google", { session: false }, async (err, user, info) => {
    if (err) {
      console.error("Google auth callback error detail:", err);
      return res.redirect(`${targetOrigin}/LoginPage?error=auth_failed`);
    }

    if (!user) {
      console.warn("Google auth callback no user returned", info);
      return res.redirect(`${targetOrigin}/LoginPage?error=auth_failed`);
    }

    try {
      const email = String(user?.email || "").trim().toLowerCase();

      if (!email) {
        return res.redirect(`${targetOrigin}/LoginPage?error=auth_failed`);
      }

      // Find or create user
      let dbUser = await User.findOne({ $or: [{ googleId: user.id }, { email }] });
      if (!dbUser) {
        dbUser = new User({
          email,
          name: user.name || "",
          avatar: user.image || "",
          googleId: user.id,
          authProvider: "google",
          emailVerified: true,
        });
      } else {
        dbUser.email = dbUser.email || email;
        dbUser.name = user.name || dbUser.name || "";
        dbUser.avatar = user.image || dbUser.avatar || "";
        dbUser.googleId = user.id;
        dbUser.authProvider = "google";
        dbUser.emailVerified = true;
      }

      dbUser.lastLoginAt = new Date();
      dbUser.loginCount = (dbUser.loginCount || 0) + 1;
      await dbUser.save();

      await issueUserSession(res, dbUser, true);

      // Live server par cross-origin cookie drop issue ko solve karne ke liye token bhejein
      const token = jwt.sign(
        { id: dbUser._id, userId: dbUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      res.redirect(`${targetOrigin}/LoginPage?token=${token}`);
    } catch (error) {
      console.error("Google auth callback save error:", error);
      res.redirect(`${targetOrigin}/LoginPage?error=auth_failed`);
    }
  })(req, res, next);
});

// PUBLIC ROUTES
router.post("/request-otp", otpRateLimit, requestOTP);
router.post("/verify-otp", verifyOtpRateLimit, verifyOTP);
router.post("/resend-otp", otpRateLimit, resendOTP);
router.post("/refresh-token", refreshAccessToken);
router.post("/phone-login", phoneLogin);
router.post("/google-login", googleLogin);
// PROTECTED ROUTES
router.get("/me", authMiddleware, me);
router.post("/update-fcm-token", authMiddleware, updateFCMToken);
router.delete("/delete-account", authMiddleware, deleteAccount);
router.post("/logout", logout);

// ADMIN ROUTES
router.get("/count", adminAuthMiddleware, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/", adminAuthMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const status = req.query.status;
    const role = req.query.role;
    
    let query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (role) query.role = role;
    
    let sortObj = {};
    sortObj[sortBy] = sortOrder;
    
    const users = await User.find(query)
      .select("-otp -otpExpiry -password")
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
      
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user statistics
router.get("/stats", adminAuthMiddleware, async (req, res) => {
  try {
    const [totalUsers, activeUsers, suspendedUsers, bannedUsers, recentUsers] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.countDocuments({ status: 'suspended' }),
      User.countDocuments({ status: 'banned' }),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } })
    ]);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        bannedUsers,
        recentUsers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update user status
router.patch("/:id/status", adminAuthMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select("-otp -otpExpiry -password");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({ success: true, data: user, message: `User ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update user role
router.patch("/:id/role", adminAuthMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-otp -otpExpiry -password");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({ success: true, data: user, message: `User role updated to ${role}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk status update
router.patch("/bulk/status", adminAuthMiddleware, async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "User IDs are required" });
    }
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    
    const result = await User.updateMany(
      { _id: { $in: ids } },
      { status }
    );
    
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} user(s) ${status}`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update profile completion status
router.patch("/:id/profile-completed", adminAuthMiddleware, async (req, res) => {
  try {
    const { profileCompleted } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { profileCompleted },
      { new: true }
    ).select("-otp -otpExpiry -password");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.json({ success: true, data: user, message: "Profile completion status updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", adminAuthMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk delete users
router.delete("/bulk", adminAuthMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "User IDs are required" });
    }
    
    const result = await User.deleteMany({ _id: { $in: ids } });
    res.json({ 
      success: true, 
      message: `${result.deletedCount} user(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;