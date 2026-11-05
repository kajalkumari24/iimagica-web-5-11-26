import express from "express";
import rateLimit from "express-rate-limit";
import { authMiddleware } from "../middleware/authMiddleware.js";
import Frame from "../models/Frame.js";
import cloudinary from "../config/cloudinary.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

const router = express.Router();

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15,
    keyGenerator: (req) => String(req.user?._id || req.ip),
    message: { success: false, message: "Footer AI limit reached. Try again in an hour." },
});

// Generate: Python makes PNG + layout, we store it as a user-owned Frame
router.post("/generate", authMiddleware, limiter, async (req, res) => {
    try {
        const { prompt = "", fields, hasLogo = false, logoUrl = "", regenerate = false } = req.body || {};
        const ok = Array.isArray(fields) && fields.length >= 1 && fields.length <= 12 &&
            fields.every((f) => /^[a-zA-Z_]{1,30}$/.test(f?.key));
        if (!ok) return errorResponse(res, "fields must be 1-12 items with a valid key", 400);

        const py = await fetch(`${process.env.FOOTER_PY_URL}/footer`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Internal-Key": process.env.FOOTER_PY_KEY },
            body: JSON.stringify({
                prompt: String(prompt).slice(0, 200),
                fields: fields.map((f) => f.key),
                has_logo: !!hasLogo,
                logo_url: typeof logoUrl === "string" ? logoUrl.slice(0, 500) : "",
                regenerate: !!regenerate,
            }),
            signal: AbortSignal.timeout(25000), // allow for a sleeping free-tier instance
        });
        if (!py.ok) return errorResponse(res, "Footer service unavailable", 503);
        const out = await py.json();

        const up = await cloudinary.uploader.upload(`data:image/png;base64,${out.frame_png_b64}`, { folder: "ai-footers" });
        const frame = await Frame.create({ category: "ai-footer", ownerId: req.user._id, framePath: up.secure_url, layout: out.layout });
        return successResponse(res, { frame, source: out.source }, "Footer generated", 201);
    } catch (e) {
        return errorResponse(res, "Could not generate footer", 500);
    }
});

router.get("/mine", authMiddleware, async (req, res) => {
    try {
        return successResponse(res, await Frame.find({ ownerId: req.user._id }).sort({ createdAt: -1 }).limit(20));
    } catch (e) {
        return errorResponse(res, "Could not load footers", 500);
    }
});

router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const f = await Frame.findOneAndDelete({ _id: req.params.id, ownerId: req.user._id });
        return f ? successResponse(res, null, "Deleted") : errorResponse(res, "Not found", 404);
    } catch (e) {
        return errorResponse(res, "Could not delete", 400);
    }
});

export default router;