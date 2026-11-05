import HomeSlide from "../models/HomeSlide.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const toBool = (value, fallback = true) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const raw = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(raw)) return true;
  if (["false", "0", "no", "off"].includes(raw)) return false;
  return fallback;
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const uploadSlideImage = async (file) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "home-slides", resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });

const removeRemoteUploadIfAny = async (url = "") => {
  if (!url || typeof url !== "string") return;
  try {
    await cloudinary.uploader.destroy(url, { resource_type: "image" });
  } catch (err) {
    console.warn("homeSlides: failed to delete old remote file", err?.message || err);
  }
};

const mapSlide = (slide) => ({
  _id: slide._id,
  title: slide.title || "",
  subtitle: slide.subtitle || "",
  imageUrl: slide.imageUrl,
  isActive: Boolean(slide.isActive),
  order: Number(slide.order || 0),
  createdAt: slide.createdAt,
  updatedAt: slide.updatedAt,
});

export const getPublicHomeSlides = async (req, res) => {
  try {
    const slides = await HomeSlide.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return res.status(200).json(slides.map(mapSlide));
  } catch (err) {
    console.error("homeSlides/public error:", err);
    return res.status(500).json({ message: "Failed to fetch home slides" });
  }
};

export const getAdminHomeSlides = async (req, res) => {
  try {
    const slides = await HomeSlide.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();
    return res.status(200).json(slides.map(mapSlide));
  } catch (err) {
    console.error("homeSlides/admin list error:", err);
    return res.status(500).json({ message: "Failed to fetch home slides" });
  }
};

export const createHomeSlide = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const title = String(req.body?.title || "").trim();
    const subtitle = String(req.body?.subtitle || "").trim();
    const order = toNumber(req.body?.order, 0);
    const isActive = toBool(req.body?.isActive, true);
    const uploaded = await uploadSlideImage(req.file);
    const imageUrl = uploaded?.secure_url || uploaded?.url;

    const created = await HomeSlide.create({
      title,
      subtitle,
      order,
      isActive,
      imageUrl,
      createdBy: req.admin?._id || null,
      updatedBy: req.admin?._id || null,
    });

    if (global.io) {
      global.io.emit('homeSlideUpdated', { action: 'created', slideId: created._id });
    }
    return res.status(201).json({
      message: "Home slide created successfully",
      slide: mapSlide(created),
    });
  } catch (err) {
    console.error("homeSlides/create error:", err);
    return res.status(500).json({ message: "Failed to create home slide" });
  }
};

export const updateHomeSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await HomeSlide.findById(id);
    if (!slide) return res.status(404).json({ message: "Home slide not found" });

    if (req.body?.title !== undefined) slide.title = String(req.body.title || "").trim();
    if (req.body?.subtitle !== undefined) slide.subtitle = String(req.body.subtitle || "").trim();
    if (req.body?.order !== undefined) slide.order = toNumber(req.body.order, slide.order || 0);
    if (req.body?.isActive !== undefined) slide.isActive = toBool(req.body.isActive, slide.isActive);

    if (req.file) {
      const uploaded = await uploadSlideImage(req.file);
      const newUrl = uploaded?.secure_url || uploaded?.url;
      await removeRemoteUploadIfAny(slide.imageUrl);
      slide.imageUrl = newUrl;
    }

    slide.updatedBy = req.admin?._id || slide.updatedBy || null;
    await slide.save();

    if (global.io) {
      global.io.emit('homeSlideUpdated', { action: 'updated', slideId: id });
    }
    return res.status(200).json({
      message: "Home slide updated successfully",
      slide: mapSlide(slide),
    });
  } catch (err) {
    console.error("homeSlides/update error:", err);
    return res.status(500).json({ message: "Failed to update home slide" });
  }
};

export const deleteHomeSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const slide = await HomeSlide.findById(id);
    if (!slide) return res.status(404).json({ message: "Home slide not found" });

    const oldUrl = slide.imageUrl;
    await HomeSlide.findByIdAndDelete(id);
    await removeRemoteUploadIfAny(oldUrl);

    if (global.io) {
      global.io.emit('homeSlideUpdated', { action: 'deleted', slideId: id });
    }
    return res.status(200).json({ message: "Home slide deleted successfully" });
  } catch (err) {
    console.error("homeSlides/delete error:", err);
    return res.status(500).json({ message: "Failed to delete home slide" });
  }
};
