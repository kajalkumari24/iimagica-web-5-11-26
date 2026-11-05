
import express from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import {
  addFrame,
  getFramesByCategory,
  getAllFrames,
  updateFrameLayout,
  updateFrameImage,
  getFrameById,
  bulkDeleteFrames,
} from "../controllers/frameController.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import Frame from "../models/Frame.js";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();

/* ---------------------- MULTER MEMORY STORAGE ---------------------- */
// ✅ Important: Cloudinary upload ke liye memory storage chahiye (disk nahi)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'));
    }
    cb(null, true);
  },
  limits: { 
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 20
  }
});

/* ---------------------- FRAME ROUTES ---------------------- */

// Rate limiting for uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // allow normal admin usage without tripping limits too quickly
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const adminId = req?.admin?._id || req?.admin?.id;
    return adminId ? `admin:${adminId}` : req.ip;
  },
  handler: (req, res) => {
    const resetTime = req?.rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000))
      : undefined;
    return res.status(429).json({
      message: "Too many upload requests. Please wait and try again.",
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
    });
  },
});

// ✅ Upload frames (Cloudinary)
router.post(
  "/add",
  adminAuthMiddleware,
  uploadLimiter,
  (req, res, next) => {
    upload.array("frames", 20)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "One or more files exceed 2MB limit." });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({ message: "You can upload up to 20 files at a time." });
        }
        return res.status(400).json({ message: err.message || "Upload validation failed." });
      }
      return res.status(400).json({ message: err.message || "Invalid upload request." });
    });
  },
  addFrame
);

// ✅ Update layout
router.put("/update-layout/:id", updateFrameLayout);

// ✅ Update frame category
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    const updated = await Frame.findByIdAndUpdate(id, { category }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Frame not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Replace a single frame image
router.put("/update-image/:id", upload.single("frame"), updateFrameImage);

// ✅ Get distinct categories from DB (for dynamic filter dropdown)
router.get("/categories", async (req, res) => {
  try {
    const raw = await Frame.distinct("category");
    const categories = raw
      .filter(Boolean)
      .map((c) => String(c).toLowerCase().trim())
      .filter((c, i, arr) => arr.indexOf(c) === i)
      .sort();
    res.json({ categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get frames by category
router.get("/category/:category", getFramesByCategory);

// ✅ Count total frames (must be before /:id route)
router.get("/count", adminAuthMiddleware, async (req, res) => {
  try {
    const count = await Frame.countDocuments();
    res.json({ success: true, data: { count } });
  } catch (err) {
    console.error('Count error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get frame by id
router.get("/:id", getFrameById);

// ✅ Get all frames
router.get("/", getAllFrames);

// ✅ Bulk delete frames
router.delete('/bulk', bulkDeleteFrames);

// ✅ Delete frame by ID with Cloudinary cleanup
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const frame = await Frame.findById(id);

    if (!frame) {
      return res.status(404).json({ message: "Frame not found" });
    }

    // Delete from configured media provider (Cloudinary adapter now maps to ImageKit)
    if (frame.framePath) {
      try {
        await cloudinary.uploader.destroy(frame.framePath);
      } catch (cloudErr) {
        console.error('Cloudinary delete error:', cloudErr);
      }
    }

    await Frame.findByIdAndDelete(id);
    res.status(200).json({ message: "Frame deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete all frames from a category
router.delete("/category/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const result = await Frame.deleteMany({ category: category.toLowerCase() });
    res.status(200).json({
      message: `Deleted ${result.deletedCount} frame(s) from category '${category}'`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
