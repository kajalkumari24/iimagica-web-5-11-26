
import Festival from "../models/Festival.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// POST /api/festivals
export const createFestival = async (req, res) => {
  try {
    const { festivalname, festivaldate, description, linkedCategory } = req.body;

    if (!festivalname || !festivaldate || !linkedCategory) {
      return res.status(400).json({
        message: "festivalname, festivaldate and linkedCategory are required",
      });
    }

    let uploaded = [];

    // ✅ SINGLE IMAGE FIX
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "festivals" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

      uploaded.push({
        url: result.secure_url,
        public_id: result.public_id,
      });
    }

    const fest = new Festival({
      festivalName: festivalname,
      festivalDate: new Date(festivaldate),
      linkedCategory,
      images: uploaded,
      description: description || "",
      createdBy: req.user?._id,
    });

    await fest.save();

    if (global.io) {
      global.io.emit('festivalUpdated', { action: 'created', festivalId: fest._id, festivalName: fest.festivalName });
    }
    res.status(201).json({
      message: "Festival created successfully",
      festival: fest,
    });
  } catch (err) {
    console.error("Error creating festival:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// GET /api/festivals
export const getFestivals = async (req, res) => {
  try {
    const festivals = await Festival.find().sort({ festivalDate: -1 });
    res.status(200).json(festivals);
  } catch (err) {
    console.error("Error fetching festivals:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ CLEAN VERSION (NO CATEGORY MIXING)
export const getCombinedFestivals = async (req, res) => {
  try {
    const festivals = await Festival.find().sort({ festivalDate: -1 });

    res.status(200).json(
      festivals.map((f) => ({
        _id: f._id,
        festivalName: f.festivalName,
        festivalDate: f.festivalDate,
        images: f.images || [],
        description: f.description,
        linkedCategory: f.linkedCategory, // ✅ important
        eventType: "festival",
      }))
    );
  } catch (err) {
    console.error("Error fetching festivals:", err);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateFestival = async (req, res) => {
  try {
    const { id } = req.params;
    const { festivalname, festivaldate, description, linkedCategory } = req.body;

    const fest = await Festival.findById(id);
    if (!fest) return res.status(404).json({ message: "Festival not found" });

    // basic update
    fest.festivalName = festivalname || fest.festivalName;
    fest.festivalDate = festivaldate ? new Date(festivaldate) : fest.festivalDate;
    fest.linkedCategory = linkedCategory || fest.linkedCategory;
    fest.description = description || fest.description;

    

    // 🔥 only if image exists
    if (req.file && req.file.buffer) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "festivals" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });

      fest.images = [
        {
          url: result.secure_url,
          public_id: result.public_id,
        },
      ];
    }

    await fest.save();

    if (global.io) {
      global.io.emit('festivalUpdated', { action: 'updated', festivalId: fest._id, festivalName: fest.festivalName });
    }
    res.json({ message: "Festival updated", festival: fest });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};
export const deleteFestival = async (req, res) => {
  try {
    const { id } = req.params;

    const fest = await Festival.findById(id);
    if (!fest) {
      return res.status(404).json({ message: "Festival not found" });
    }

    await Festival.findByIdAndDelete(id);

    if (global.io) {
      global.io.emit('festivalUpdated', { action: 'deleted', festivalId: id });
    }
    res.json({ message: "Festival deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
};