
import express from "express";
import multer from "multer";
// import cloudinaryStoragePkg from "multer-storage-cloudinary";
// const CloudinaryStorage =
//   cloudinaryStoragePkg.CloudinaryStorage || cloudinaryStoragePkg;
// import cloudinary from "../config/cloudinary.js";
import imagekit from "../config/imagekit.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import Notification from "../models/Notification.js";
import {
  getNotifications,
  createNotification,
  updateNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });
const hasImageKitConfig =
  !!process.env.IMAGEKIT_PUBLIC_KEY &&
  !!process.env.IMAGEKIT_PRIVATE_KEY &&
  !!process.env.IMAGEKIT_URL_ENDPOINT;
const useImageKitNotifications =
  process.env.USE_IMAGEKIT_NOTIFICATIONS !== "false" && hasImageKitConfig;

const safeSegment = (value = "notifications") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "notifications";

const uploadNotificationToImageKit = async (req, res, next) => {
  if (!useImageKitNotifications || !req.file) return next();

  try {
    const category = req.body.category || "notifications";
    const folderCategory = safeSegment(category);
    const original = req.file.originalname || `notification-${Date.now()}.png`;
    const ext = (original.includes(".") ? `.${original.split(".").pop()}` : ".png").replace(/[^a-zA-Z0-9.]/g, "");
    const base = original.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9._-]/g, "-");
    const safeName = `${base}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    const mime = req.file.mimetype || "image/png";
    const dataUri = `data:${mime};base64,${req.file.buffer.toString("base64")}`;
    const result = await imagekit.files.upload({
      file: dataUri,
      fileName: safeName,
      folder: `/imagica/${folderCategory}`,
      useUniqueFileName: true,
    });

    req.file.path = result.url;
    req.file.secure_url = result.url;
    req.file.url = result.url;
    req.file.public_id = String(result.filePath || "").replace(/^\//, "").replace(/\.[a-zA-Z0-9]+$/, "");
    return next();
  } catch (error) {
    console.error("notification upload imagekit error:", error);
    return res.status(500).json({
      message: "ImageKit upload failed",
      error: error.message,
      details: error?.help || error?.response?.data || null,
    });
  }
};

// Routes
router.get("/", getNotifications);
router.post("/", upload.single("coverImage"), uploadNotificationToImageKit, createNotification);
router.put("/:id", upload.single("coverImage"), uploadNotificationToImageKit, updateNotification);

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Notification not found" });
      
    if (global.io) {
      global.io.emit('notificationUpdated', { action: 'deleted', id: req.params.id });
    }
      
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting notification", error });
  }
});

router.get("/count", adminAuthMiddleware, async (req, res) => {
  try {
    const count = await Notification.countDocuments();
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ message: "Error counting notifications", error });
  }
});

export default router;
