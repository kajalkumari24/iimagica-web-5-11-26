import express from "express";
import multer from "multer";
import path from "path";
import imagekit from "../config/imagekit.js";
import {
  getBlogs,
  getSingleBlog,
  getLatestBlogs,
  getPopularBlogs,
  getRelatedBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleBlogStatus,
  reorderBlogs,
} from "../controllers/blogController.js";
import {
  getBlogCategories,
  createBlogCategory,
  updateBlogCategory,
  deleteBlogCategory,
} from "../controllers/blogCategoryController.js";
import { validateBlog, validateBlogCategory } from "../validators/blogValidator.js";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";

const router = express.Router();

// --- MULTER MEMORY STORAGE FOR IMAGEKIT UPLOADS ---
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif|svg|avif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

// --- PUBLIC BLOG ROUTES ---
router.get("/blogs", getBlogs);
router.get("/blogs/latest", getLatestBlogs);
router.get("/blogs/popular", getPopularBlogs);
router.get("/blogs/related/:slug", getRelatedBlogs);
router.get("/blogs/:slug", getSingleBlog);

// --- PUBLIC BLOG CATEGORIES ROUTES ---
router.get("/blog-categories", getBlogCategories);

// --- ADMIN PROTECTED ROUTES ---
// Admin Blog CRUD
router.post("/admin/blogs", adminAuthMiddleware, validateBlog, createBlog);
router.put("/admin/blogs/reorder", adminAuthMiddleware, reorderBlogs);
router.put("/admin/blogs/:id", adminAuthMiddleware, validateBlog, updateBlog);
router.delete("/admin/blogs/:id", adminAuthMiddleware, deleteBlog);
router.patch("/admin/blogs/:id/status", adminAuthMiddleware, toggleBlogStatus);

// Admin Category CRUD
router.post("/admin/blog-categories", adminAuthMiddleware, validateBlogCategory, createBlogCategory);
router.put("/admin/blog-categories/:id", adminAuthMiddleware, validateBlogCategory, updateBlogCategory);
router.delete("/admin/blog-categories/:id", adminAuthMiddleware, deleteBlogCategory);

// Admin File Upload endpoint (Uploads directly to ImageKit)
router.post(
  "/admin/blogs/upload",
  adminAuthMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Please upload a file" });
      }

      const original = req.file.originalname || `blog-${Date.now()}.png`;
      const ext = path.extname(original).toLowerCase() || ".png";
      const base = path.basename(original, ext).replace(/[^a-zA-Z0-9._-]/g, "-");
      const safeName = `blog-${base}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
      const mime = req.file.mimetype || "image/png";
      const dataUri = `data:${mime};base64,${req.file.buffer.toString("base64")}`;

      const result = await imagekit.files.upload({
        file: dataUri,
        fileName: safeName,
        folder: "/imagica/blogs",
        useUniqueFileName: true,
      });

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully to ImageKit",
        url: result.url,
        fileId: result.fileId,
      });
    } catch (err) {
      console.error("Blog ImageKit upload error:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Failed to upload image to ImageKit",
      });
    }
  }
);

export default router;
