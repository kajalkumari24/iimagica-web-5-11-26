
import express from "express";
import {
  addImage,
  getImagesByCategory,
  getAllCategories,
  deleteImagesByCategory,
  deleteSingleImage,
  createCategory,
  deleteImageById,
  deleteImageByUrl,
  initializePrimaryCategories,
  getFestivalsForCategories,
} from "../controllers/imageController.js";
import multer from "multer";
// import cloudinaryStoragePkg from "multer-storage-cloudinary";
// const CloudinaryStorage =
//   cloudinaryStoragePkg.CloudinaryStorage || cloudinaryStoragePkg;
// import cloudinary from "../config/cloudinary.js";
import imagekit from "../config/imagekit.js";
import Image from "../models/Image.js";
import Category from "../models/Category.js";
import Festival from "../models/Festival.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import path from "path";

const router = express.Router();

const hasImageKitConfig =
  !!process.env.IMAGEKIT_PUBLIC_KEY &&
  !!process.env.IMAGEKIT_PRIVATE_KEY &&
  !!process.env.IMAGEKIT_URL_ENDPOINT;
const useImageKitImages =
  process.env.USE_IMAGEKIT_IMAGES !== "false" && hasImageKitConfig;

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 100,
  },
  fileFilter: (req, file, cb) => {
    const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg", ".avif"]);
    const mimeOk = typeof file.mimetype === "string" && file.mimetype.startsWith("image/");
    const ext = path.extname(file.originalname || "").toLowerCase();
    const extOk = allowedExt.has(ext);

    // Accept image MIME; fallback to known image extension for clients that send generic MIME.
    if (mimeOk || extOk) return cb(null, true);
    return cb(new Error("Only image files are allowed"), false);
  }
});

const uploadImages = upload.fields([
  { name: "images", maxCount: 100 },
  { name: "image", maxCount: 100 },
  { name: "file", maxCount: 100 },
]);

const normalizeUploadedFiles = (filesPayload) => {
  if (!filesPayload) return [];
  if (Array.isArray(filesPayload)) return filesPayload;
  if (typeof filesPayload !== "object") return [];
  const merged = [];
  const keys = ["images", "image", "file"];
  keys.forEach((k) => {
    const arr = filesPayload[k];
    if (Array.isArray(arr) && arr.length) merged.push(...arr);
  });
  if (!merged.length) {
    Object.values(filesPayload).forEach((v) => {
      if (Array.isArray(v)) merged.push(...v);
    });
  }
  return merged;
};

const safeSegment = (value = "uncategorized") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "uncategorized";

const uploadImagesToImageKit = async (req, res, next) => {
  if (!Array.isArray(req.files) || req.files.length === 0) {
    return res.status(400).json({
      message: "No files received. Use form-data key: images",
      expectedField: "images",
      receivedKeys: Object.keys(req.body || {}),
    });
  }

  if (!useImageKitImages) {
    return next();
  }

  try {
    const category = req.body.category || "uncategorized";
    const folderCategory = safeSegment(category);
    const uploaded = [];

    for (const file of req.files) {
      if (!file?.buffer || !file.buffer.length) {
        return res.status(400).json({
          message: `File buffer missing for ${file?.originalname || "unknown-file"}`,
          hint: "Ensure multer memoryStorage is enabled and field name is images",
        });
      }
      const fileData = file.buffer.toString("base64");
      const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
      const mimeByExt = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
        ".bmp": "image/bmp",
        ".svg": "image/svg+xml",
        ".avif": "image/avif",
      };
      const resolvedMime = file.mimetype || mimeByExt[ext] || "application/octet-stream";
      const dataUri = `data:${resolvedMime};base64,${fileData}`;
      const base = path.basename(file.originalname || `img-${Date.now()}`, ext).replace(/[^a-zA-Z0-9._-]/g, "-");
      const uniqueName = `${base}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
      const result = await imagekit.files.upload({
        file: dataUri,
        fileName: uniqueName,
        folder: `/imagica/${folderCategory}`,
        useUniqueFileName: true,
      });

      uploaded.push({
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: result.url,
        secure_url: result.url,
        url: result.url,
        public_id: String(result.filePath || "").replace(/^\//, "").replace(/\.[a-zA-Z0-9]+$/, ""),
        provider: "imagekit",
      });
    }

    req.files = uploaded;
    return next();
  } catch (error) {
    console.error("images/upload: imagekit upload error", error);
    return res.status(500).json({
      message: "ImageKit upload failed",
      error: error.message,
      details: error?.help || error?.response?.data || null,
    });
  }
};

const uploadRemoveBg = multer({ storage: multer.memoryStorage() });
const WEBSITE_TEMPLATE_CATEGORY = "website_templates";
const forceWebsiteTemplateCategory = (req, res, next) => {
  req.params = { ...(req.params || {}), category: WEBSITE_TEMPLATE_CATEGORY };
  req.body = { ...(req.body || {}), category: WEBSITE_TEMPLATE_CATEGORY };
  next();
};



router.get("/count", adminAuthMiddleware, async (req, res) => {
  try {
    const count = await Image.countDocuments();
    return res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get count of images by category
router.get("/category/:category/count", async (req, res) => {
  try {
    const { category } = req.params;
    const count = await Image.countDocuments({ category });
    return res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Routes
router.post("/upload", adminAuthMiddleware, (req, res, next) => {
  req.on("aborted", () => {
    console.warn("images/upload: request aborted by client");
  });
  res.on("close", () => {
    if (!res.writableEnded) {
      console.warn("images/upload: response closed before finish");
    }
  });
  uploadImages(req, res, (err) => {
    if (err) {
      const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      console.error("images/upload: multer error", err);
      return res.status(status).json({ message: err.message || "Upload failed" });
    }
    req.files = normalizeUploadedFiles(req.files);
    if (req.fileValidationError) {
      return res.status(400).json({ message: req.fileValidationError });
    }
  
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded. Ensure frontend uses formData.append('images', file)",
      });
    }
    return next();
  });
}, uploadImagesToImageKit, addImage);
router.post("/remove-bg", uploadRemoveBg.single("file"), async (req, res) => {
  const { removeBg } = await import("../controllers/imageController.js");
  return removeBg(req, res);
});

// Website templates aliases (admin uploads + user listing)
router.get("/website-templates", forceWebsiteTemplateCategory, getImagesByCategory);
router.get("/website-templates/count", async (req, res) => {
  try {
    const count = await Image.countDocuments({ category: WEBSITE_TEMPLATE_CATEGORY });
    return res.status(200).json({ success: true, data: { count } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});
router.post(
  "/website-templates/upload",
  adminAuthMiddleware,
  forceWebsiteTemplateCategory,
  (req, res, next) => {
    uploadImages(req, res, (err) => {
      if (err) {
        const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(status).json({ message: err.message || "Upload failed" });
      }
      req.files = normalizeUploadedFiles(req.files);
      if (req.fileValidationError) {
        return res.status(400).json({ message: req.fileValidationError });
      }
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: "No files uploaded. Ensure frontend uses formData.append('images', file)",
        });
      }
      return next();
    });
  },
  uploadImagesToImageKit,
  addImage
);
router.delete("/website-templates/:id", adminAuthMiddleware, forceWebsiteTemplateCategory, deleteSingleImage);
router.delete("/website-templates", adminAuthMiddleware, forceWebsiteTemplateCategory, deleteImagesByCategory);

router.delete("/:id", deleteImageById);
router.delete("/", deleteImageByUrl);
router.post("/category", createCategory);
router.post("/initialize-primary", initializePrimaryCategories);
router.post("/cleanup-festivals", async (req, res) => {
  try {
    const unwantedFestivals = ["gyaras", "kohli birthday", "holi", "punam", "vaishak"];
    
    // Delete from festivals collection
    const deletedFests = await Festival.deleteMany({ 
      festivalName: { $in: unwantedFestivals.map(f => new RegExp(f, 'i')) } 
    });
    
    res.json({ 
      message: "Unwanted festivals deleted", 
      deleted: unwantedFestivals,
      deletedFestivals: deletedFests.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/debug-categories", async (req, res) => {
  try {
    const imageCategories = await Image.distinct('category');
    const storedCategories = await Category.find().lean();
    res.json({ imageCategories, storedCategories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/cleanup-categories", async (req, res) => {
  try {
    const unwantedCategories = ["GYARAS", "VAISHAKKOHLI BIRTHDAY", "HOLI", "PUNAM"];
    
    // Delete images with these categories
    let deletedImages = 0;
    for (const cat of unwantedCategories) {
      const result = await Image.deleteMany({ category: cat });
      deletedImages += result.deletedCount;
    }
    
    // Delete from categories collection
    const deletedCats = await Category.deleteMany({ name: { $in: unwantedCategories } });
    
    // Also delete any images with categories that contain these names (case insensitive)
    for (const cat of unwantedCategories) {
      const result = await Image.deleteMany({ category: { $regex: cat, $options: 'i' } });
      deletedImages += result.deletedCount;
    }
    
    res.json({ 
      message: "Unwanted categories deleted", 
      deleted: unwantedCategories,
      deletedImages,
      deletedCategories: deletedCats.deletedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/festivals/categories", getFestivalsForCategories);
router.get("/", getAllCategories);
router.get("/category/:category", getImagesByCategory);
router.delete("/category/:category", deleteImagesByCategory);
router.delete("/category/:category/:id", deleteSingleImage);

export default router;
