import express from "express";
import multer from "multer";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";
import {
  createHomeSlide,
  deleteHomeSlide,
  getAdminHomeSlides,
  getPublicHomeSlides,
  updateHomeSlide,
} from "../controllers/homeSlideController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (typeof file?.mimetype === "string" && file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Only image files are allowed"), false);
  },
});

router.get("/public", getPublicHomeSlides);
router.get("/admin", adminAuthMiddleware, getAdminHomeSlides);
router.post("/", adminAuthMiddleware, upload.single("image"), createHomeSlide);
router.put("/:id", adminAuthMiddleware, upload.single("image"), updateHomeSlide);
router.delete("/:id", adminAuthMiddleware, deleteHomeSlide);

export default router;
