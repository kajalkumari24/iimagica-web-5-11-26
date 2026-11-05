
import Frame from "../models/Frame.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// normalize layout keys for frontend compatibility
const normalizeLayout = (layout) => {
  if (!layout || typeof layout !== "object") return layout;
  const l = { ...layout };
  // map older 'position' key to 'positionname' which frontend expects
  if (l.position && !l.positionname) {
    l.positionname = l.position;
  }
  // also map camelCase variants just in case
  if (l.positionName && !l.positionname) {
    l.positionname = l.positionName;
  }
  return l;
};

const uploadFrameToCloudinary = (file, attempt = 1) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "frames",
        resource_type: "image",
        fileName: file?.originalname || `frame-${Date.now()}.png`,
      },
      (error, result) => {
        if (error) {
          const transient =
            /timeout|timed out|econnreset|socket|network|503|504/i.test(
              String(error?.message || "")
            );
          if (attempt < 2 && transient) {
            return resolve(uploadFrameToCloudinary(file, attempt + 1));
          }
          return reject(error);
        }
        return resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableUploadError = (err) => {
  const message = String(err?.message || "").toLowerCase();
  const status = Number(err?.status || err?.http_code || err?.statusCode || 0);
  if ([408, 425, 429, 500, 502, 503, 504].includes(status)) return true;
  return /timeout|timed out|econnreset|socket|network|503|504|429|too many/i.test(message);
};

const uploadFrameWithRetry = async (file, maxAttempts = 3) => {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await uploadFrameToCloudinary(file, 1);
    } catch (err) {
      lastErr = err;
      const shouldRetry = attempt < maxAttempts && isRetryableUploadError(err);
      if (!shouldRetry) break;
      const backoffMs = 400 * attempt;
      await sleep(backoffMs);
    }
  }
  throw lastErr;
};

const mapWithConcurrency = async (items, limit, mapper) => {
  const concurrency = Math.max(1, Number(limit) || 1);
  const results = new Array(items.length);
  let index = 0;

  const worker = async () => {
    while (true) {
      const current = index;
      index += 1;
      if (current >= items.length) return;
      try {
        const value = await mapper(items[current], current);
        results[current] = { status: "fulfilled", value };
      } catch (reason) {
        results[current] = { status: "rejected", reason };
      }
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
};

// ✅ Upload frames to Cloudinary
export const addFrame = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No frame files uploaded" });
    }

    if (!req.body.category) {
      return res.status(400).json({ message: "Category is required" });
    }

    let layoutData = {};
    if (req.body.layout) {
      try {
        layoutData = JSON.parse(req.body.layout);
        layoutData = normalizeLayout(layoutData);
      } catch (e) {
        console.warn("⚠️ Invalid layout JSON, using default empty layout");
      }
    }

    // Keep concurrency low for production stability (prevents provider throttling/timeouts on bulk upload).
    const settled = await mapWithConcurrency(req.files, 3, async (file) => {
      const result = await uploadFrameWithRetry(file, 3);
      const newFrame = new Frame({
        category: req.body.category.toLowerCase(),
        framePath: result.secure_url,
        layout: layoutData,
      });
      await newFrame.save();
      return newFrame;
    });

    const uploadedFrames = settled
      .filter((s) => s.status === "fulfilled")
      .map((s) => s.value);

    const failed = settled
      .map((s, idx) => ({ s, idx }))
      .filter(({ s }) => s.status === "rejected")
      .map(({ s, idx }) => ({
        index: idx,
        filename: req.files[idx]?.originalname || `file-${idx + 1}`,
        message: s.reason?.message || "Cloud upload failed",
      }));

    if (!uploadedFrames.length) {
      return res.status(502).json({
        message: "All frame uploads failed. Please try again.",
        failed,
      });
    }

    const partial = failed.length > 0;
    if (uploadedFrames.length > 0 && global.io) {
      global.io.emit('frameUpdated', { action: 'added', category: req.body.category, count: uploadedFrames.length });
    }
    return res.status(partial ? 207 : 201).json({
      message: partial
        ? `${uploadedFrames.length}/${req.files.length} frame(s) uploaded. ${failed.length} failed.`
        : `${uploadedFrames.length} frame(s) uploaded successfully under category: ${req.body.category}`,
      frames: uploadedFrames,
      failed,
    });
  } catch (err) {
    console.error("❌ Error uploading frame:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ✅ Update layout
export const updateFrameLayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { layout } = req.body;

    const normalized = normalizeLayout(layout);
    const updatedFrame = await Frame.findByIdAndUpdate(
      id,
      { layout: normalized },
      { new: true }
    );

    if (global.io) {
      global.io.emit('frameUpdated', { action: 'layoutUpdated', frameId: id });
    }
    res.status(200).json(updatedFrame);
  } catch (err) {
    console.error("Error updating frame layout:", err);
    res.status(500).json({ message: "Failed to update layout" });
  }
};
// ✅ Get frames by category with pagination and search support
export const getFramesByCategory = async (req, res) => {
  try {
    const rawCategory = req.params.category || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    const decoded = decodeURIComponent(rawCategory);
    const lower = decoded.toLowerCase().trim();
    const slug = lower
      .replace(/[/\\]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\s/g, "-")
      .replace(/[^a-z0-9-_]/g, "");

    const escapeRegex = (value = "") => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const candidates = Array.from(new Set([lower, slug].filter(Boolean)));

    // Generate additional suffix variations for political categories to support party name mismatches (e.g. "party" vs "political" vs raw party name)
    const extraCandidates = [];
    for (const c of candidates) {
      if (c.startsWith("political-")) {
        const partyPart = c.substring("political-".length);
        const cleanedParty = partyPart.replace(/-/g, " ").replace(/\s+/g, " ").trim();
        const baseParty = cleanedParty
          .replace(/\b(party|political|org|organization|group)\b/gi, "")
          .replace(/\s+/g, " ")
          .trim();
        if (baseParty) {
          const variants = [
            baseParty,
            `${baseParty} party`,
            `${baseParty} political`,
          ];
          for (const variant of variants) {
            extraCandidates.push(`political-${variant}`);
            extraCandidates.push(`political-${variant.replace(/\s+/g, "-")}`);
          }
        }
      }
    }
    extraCandidates.forEach(ec => candidates.push(ec));
    const uniqueCandidates = Array.from(new Set(candidates));

    const hasSpecificSubCategory = uniqueCandidates.some((c) => c.includes("-"));

    // If category is base type (e.g. "business"), include both "business" and "business-*".
    // If category is specific (e.g. "political-bjp"), match exact normalized variants only.
    let query = hasSpecificSubCategory
      ? { category: uniqueCandidates.length > 1 ? { $in: uniqueCandidates } : uniqueCandidates[0] }
      : {
          category: {
            $regex: `^(${uniqueCandidates.map((c) => escapeRegex(c)).join("|")})(-.+)?$`,
            $options: "i",
          },
        };
    if (search) {
      query = {
        $and: [
          query,
          {
            $or: [
              { category: { $regex: search, $options: "i" } },
              { framePath: { $regex: search, $options: "i" } },
            ],
          },
        ],
      };
    }

    const sortObj = { [sortBy]: sortOrder };

    const frames = await Frame.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    // Return empty list instead of 404 so frontend doesn't error
    res.status(200).json(
      frames.map((frame) => ({
        _id: frame._id,
        category: frame.category,
        framePath: frame.framePath,
        layout: normalizeLayout(frame.layout),
        createdAt: frame.createdAt,
        updatedAt: frame.updatedAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get all frames with pagination and search support
export const getAllFrames = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;
    
    let query = {};
    if (search) {
      query.$or = [
        { category: { $regex: search, $options: 'i' } },
        { framePath: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortObj = {};
    sortObj[sortBy] = sortOrder;
    
    const frames = await Frame.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);
      
    res.status(200).json(
      frames.map((frame) => ({
        _id: frame._id,
        category: frame.category,
        framePath: frame.framePath,
        layout: normalizeLayout(frame.layout),
        createdAt: frame.createdAt,
        updatedAt: frame.updatedAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ Update frame image (replace the image for a single frame)
export const updateFrameImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Upload new image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'frames',
          resource_type: 'image',
          fileName: req.file?.originalname || `frame-${Date.now()}.png`,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    // Update frame document
    const updated = await Frame.findByIdAndUpdate(id, { framePath: result.secure_url }, { new: true });

    if (!updated) return res.status(404).json({ message: 'Frame not found' });

    if (global.io) {
      global.io.emit('frameUpdated', { action: 'imageUpdated', frameId: id });
    }
    res.status(200).json({ message: 'Frame image updated', frame: updated });
  } catch (err) {
    console.error('Error updating frame image:', err);
    res.status(500).json({ message: 'Failed to update frame image', error: err.message });
  }
};

// ✅ Bulk delete frames with Cloudinary cleanup
export const bulkDeleteFrames = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Frame IDs array is required' });
    }
    
    // Get frames to extract Cloudinary public_ids
    const frames = await Frame.find({ _id: { $in: ids } });
    
    // Delete from configured media provider (Cloudinary adapter now maps to ImageKit)
    await Promise.all(frames.map(async (frame) => {
      if (frame.framePath) {
        try {
          await cloudinary.uploader.destroy(frame.framePath);
        } catch (cloudErr) {
          console.error('Cloudinary bulk delete error:', cloudErr);
        }
      }
    }));
    
    const result = await Frame.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount > 0 && global.io) {
      global.io.emit('frameUpdated', { action: 'deleted', count: result.deletedCount });
    }
    res.status(200).json({ 
      message: `${result.deletedCount} frame(s) deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error('Error bulk deleting frames:', err);
    res.status(500).json({ message: 'Failed to delete frames', error: err.message });
  }
};

// ✅ Get single frame by ID (normalized layout)
export const getFrameById = async (req, res) => {
  try {
    const { id } = req.params;
    const frame = await Frame.findById(id);
    if (!frame) return res.status(404).json({ message: 'Frame not found' });

    res.status(200).json({
      _id: frame._id,
      category: frame.category,
      framePath: frame.framePath,
      layout: normalizeLayout(frame.layout),
      createdAt: frame.createdAt,
      updatedAt: frame.updatedAt,
    });
  } catch (err) {
    console.error('Error fetching frame by id:', err);
    res.status(500).json({ message: err.message });
  }
};
