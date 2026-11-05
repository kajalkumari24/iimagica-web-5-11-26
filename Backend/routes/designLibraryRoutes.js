import express from "express";
import multer from "multer";
import { adminAuthMiddleware } from "../middleware/adminAuthMiddleware.js";

import {
  addDesign,
  updateDesign,
  deleteDesign,
  getBanners,
  getWebsites,
  getLogos,
  getVisitingCards,
  getDigitalCards,
  getTemplates,
} from "../controllers/designLibraryController.js";

const router = express.Router();


// ================= MULTER CONFIG =================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file?.mimetype?.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});


// ================= ADMIN ROUTES =================

// ✅ Add Design
router.post(
  "/add",
  adminAuthMiddleware,
  upload.single("image"),
  addDesign
);

// ✅ Update Design
router.put(
  "/update/:id",
  adminAuthMiddleware,
  upload.single("image"),
  updateDesign
);

// ✅ Delete Design
router.delete(
  "/delete/:id",
  adminAuthMiddleware,
  deleteDesign
);


// ================= USER ROUTES =================

// 🔥 6 Category APIs

router.get("/banners", getBanners);
router.get("/websites", getWebsites);
router.get("/logos", getLogos);
router.get("/visitingCards", getVisitingCards);
router.get("/digitalCards", getDigitalCards);
router.get("/templates", getTemplates);


export default router;