import SplashVideo from "../models/SplashVideo.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadSplashVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No video uploaded" });
    }

    const uploaded = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "splash-videos", resource_type: "video" },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
    const url = uploaded?.secure_url || uploaded?.url;

    const doc = await SplashVideo.create({
      url,
      filename: req.file.originalname || "splash-video",
      size: req.file.size,
      mimeType: req.file.mimetype,
    });

    return res.status(200).json({
      success: true,
      videoUrl: url,
      video: doc,
    });
  } catch (err) {
    console.error("uploadSplashVideo error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getLatestSplashVideo = async (req, res) => {
  try {
    const latest = await SplashVideo.findOne().sort({ createdAt: -1 }).lean();
    if (!latest) {
      return res.status(404).json({ success: false, message: "No splash video found" });
    }
    return res.status(200).json({ success: true, videoUrl: latest.url, video: latest });
  } catch (err) {
    console.error("getLatestSplashVideo error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
