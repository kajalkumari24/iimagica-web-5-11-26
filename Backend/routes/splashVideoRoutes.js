import express from "express";
import multer from "multer";
import { uploadSplashVideo, getLatestSplashVideo } from "../controllers/splashVideoController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) return cb(null, true);
    return cb(new Error("Only video files are allowed"), false);
  },
});

router.post("/upload", upload.single("video"), uploadSplashVideo);
router.get("/latest", getLatestSplashVideo);

export default router;
