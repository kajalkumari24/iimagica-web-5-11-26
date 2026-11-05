import Admin from "../models/adminModel.js";
import User from "../models/User.js";
import Profile from "../models/Profile.js";
import Frame from "../models/Frame.js";
import Image from "../models/Image.js";
import Notification from "../models/Notification.js";
import Feedback from "../models/Feedback.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import BlacklistedToken from "../models/BlacklistedToken.js";
import AdminAuditLog from "../models/AdminAuditLog.js";

const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

const adminClearCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

const logAdminAction = async (req, adminId, action, meta = {}) => {
  try {
    await AdminAuditLog.create({
      adminId,
      action,
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
      meta,
    });
  } catch (err) {
    console.warn("Admin audit log failed:", err?.message || err);
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { adminId, password } = req.body;
    const admin = new Admin({ adminId, password });
    await admin.save();
    res.status(201).json(admin);
  } catch (error) {
    res.status(500).json({ message: "Error creating admin", error });
  }
};

export const verifyAdmin = async (req, res) => {
  try {
    const { adminId, password, remember = true } = req.body;
    const admin = await Admin.findOne({ adminId });

    if (!admin) {
      await logAdminAction(req, null, "login_failed", { adminId, reason: "not_found" });
      return res.status(404).json({ message: "Admin not found" });
    }
    let isValid = false;

    // Support legacy plaintext passwords and re-hash them on first successful login
    if (admin.password && admin.password.startsWith("$2")) {
      isValid = await bcrypt.compare(password, admin.password);
    } else {
      isValid = admin.password === password;
      if (isValid) {
        admin.password = password;
        await admin.save();
      }
    }

    if (!isValid) {
      await logAdminAction(req, admin?._id, "login_failed", { adminId, reason: "invalid_password" });
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: admin._id, adminId: admin.adminId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      ...(remember ? { maxAge: 1000 * 60 * 60 * 24 * 7 } : {}),
    };

    res.cookie("adminToken", token, cookieOptions);
    await logAdminAction(req, admin._id, "login_success");
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Error verifying admin", error });
  }
};

export const adminLogout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.decode(token);
      if (decoded?.exp) {
        await BlacklistedToken.create({
          token,
          expiresAt: new Date(decoded.exp * 1000),
        });
      }
    }
    if (req.cookies?.adminToken) {
      const decoded = jwt.decode(req.cookies.adminToken);
      if (decoded?.exp) {
        await BlacklistedToken.create({
          token: req.cookies.adminToken,
          expiresAt: new Date(decoded.exp * 1000),
        });
      }
    }
    res.clearCookie("adminToken", adminClearCookieOptions);
    await logAdminAction(req, req.admin?._id, "logout");
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out", error });
  }
};

export const getAdminMe = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: { admin: req.admin } });
  } catch (error) {
    res.status(500).json({ message: "Error fetching admin profile", error });
  }
};

export const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 50);
    const skip = (page - 1) * limit;

    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const role = String(req.query.role || "").trim();
    const verified = String(req.query.verified || "").trim();
    const subscriptionStatus = String(req.query.subscriptionStatus || "").trim();

    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { role: { $regex: search, $options: "i" } },
        { status: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (role) query.role = role;
    if (verified === "true" || verified === "false") {
      query.emailVerified = verified === "true";
    }
    if (subscriptionStatus) query.subscriptionStatus = subscriptionStatus;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-otp -otpExpiry")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    const hasMore = skip + users.length < total;
    res.status(200).json({
      success: true,
      data: { users, total, page, limit, hasMore },
      users,
      total,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

export const getProfiles = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 50);
    const skip = (page - 1) * limit;

    const search = String(req.query.search || "").trim();
    const status = String(req.query.status || "").trim();
    const type = String(req.query.type || "").trim().toLowerCase();

    const query = {};
    if (status === "active") query.isActive = { $ne: false };
    if (status === "inactive") query.isActive = false;
    if (type) {
      query.$or = [{ profileType: type }, { profiletype: type }];
    }
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      const searchOr = [
        { name: searchRegex },
        { email: searchRegex },
        { profileType: searchRegex },
        { profiletype: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    const [profiles, total] = await Promise.all([
      Profile.find(query)
        .populate("userId", "email lastLoginAt lastActiveAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Profile.countDocuments(query),
    ]);

    const hasMore = skip + profiles.length < total;
    res.status(200).json({
      success: true,
      data: { profiles, total, page, limit, hasMore },
      profiles,
      total,
      page,
      limit,
      hasMore,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profiles", error });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const user = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-otp -otpExpiry');
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.status(200).json({ message: "User updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user", error });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    // Also delete associated profiles
    await Profile.deleteMany({ userId: id });
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user", error });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const profile = await Profile.findByIdAndUpdate(id, updateData, { new: true }).populate('userId', 'email');
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    
    res.status(200).json({ message: "Profile updated successfully", profile });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const { id } = req.params;
    
    const profile = await Profile.findByIdAndDelete(id);
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    
    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting profile", error });
  }
};

export const getAdminActivity = async (req, res) => {
  try {
    const [
      latestProfiles,
      latestFrames,
      latestImages,
      latestNotifications,
      latestFeedbacks,
    ] = await Promise.all([
      Profile.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .select("profileType profiletype name createdAt")
        .lean(),
      Frame.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .select("category createdAt")
        .lean(),
      Image.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .select("category createdAt url")
        .lean(),
      Notification.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .select("title createdAt")
        .lean(),
      Feedback.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .select("createdAt")
        .lean(),
    ]);

    const items = [];

    latestProfiles.forEach((p) => {
      const pType = p.profileType || p.profiletype || "";
      items.push({
        id: p._id,
        type: "profile",
        title: `New profile ${pType ? `(${pType})` : ""}`.trim(),
        createdAt: p.createdAt,
        path: "/admin/user-profiles",
      });
    });

    latestFrames.forEach((f) => {
      items.push({
        id: f._id,
        type: "frame",
        title: `Frame uploaded${f.category ? ` (${f.category})` : ""}`,
        createdAt: f.createdAt,
        path: "/admin/manage-frames",
      });
    });

    latestImages.forEach((img) => {
      items.push({
        id: img._id,
        type: "image",
        title: `Image uploaded${img.category ? ` (${img.category})` : ""}`,
        createdAt: img.createdAt,
        path: "/admin/manage-images",
      });
    });

    latestNotifications.forEach((n) => {
      items.push({
        id: n._id,
        type: "notification",
        title: `Notification${n.title ? `: ${n.title}` : ""}`,
        createdAt: n.createdAt,
        path: "/admin/notifications",
      });
    });

    latestFeedbacks.forEach((f) => {
      items.push({
        id: f._id,
        type: "feedback",
        title: "New feedback submitted",
        createdAt: f.createdAt,
        path: "/admin/feedback",
      });
    });

    items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      data: { items: items.slice(0, 6) },
    });
  } catch (error) {
    console.error("Admin activity error:", error);
    res.status(500).json({ message: "Error fetching admin activity", error });
  }
};
