import express from "express";
import { createFestival, getFestivals, getCombinedFestivals,updateFestival,deleteFestival} from "../controllers/festivalController.js";
import uploadFrame from "../middleware/uploadFrame.js";

const router = express.Router();

// POST /api/festivals - multipart/form-data with fields: festivalname, festivaldate, description (optional), images[]
router.post("/", uploadFrame.single("image"), createFestival);
// UPDATE
router.put("/:id", uploadFrame.single("image"), updateFestival);
// DELETE
router.delete("/:id", deleteFestival);

// GET /api/festivals
router.get("/", getFestivals);

// GET /api/festivals/combined - Get festivals from both sources
router.get("/combined", getCombinedFestivals);

// GET /api/festivals/debug - Debug endpoint
// router.get("/debug", debugFestivals);

export default router;
