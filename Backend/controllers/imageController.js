import Image from "../models/Image.js";
import Category from "../models/Category.js";
import Festival from "../models/Festival.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import path from "path";
// Helper to extract Cloudinary public_id from a URL or id (shared)
const extractPublicId = (pid) => {
  if (!pid) return null;
  try {
    if (typeof pid !== 'string') pid = String(pid);
    // if it's a full URL, parse pathname after /upload/
    if (pid.startsWith('http')) {
      const urlObj = new URL(pid);
      const parts = urlObj.pathname.split('/');
      const uploadIdx = parts.findIndex(p => p === 'upload');
      if (uploadIdx >= 0) {
        const after = parts.slice(uploadIdx + 1).join('/');
        const cleaned = after.replace(/^v\d+\//, '');
        return cleaned.replace(/\.[a-zA-Z0-9]+$/, '');
      }
      return null;
    }
    // otherwise assume it's already a public id
    return String(pid);
  } catch (e) {
    return null;
  }
};
// ✅ Add single or multiple images

// Delete a single image by category + _id
export const deleteSingleImage = async (req, res) => {
  try {
    const { category, id } = req.params;

    // Find the image
    const image = await Image.findOne({ _id: id, category });
    if (!image) {
      return res.status(404).json({ message: "Image not found in this category" });
    }

    const publicId = extractPublicId(image.public_id || image.url);
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });

    // Delete from DB
    await Image.deleteOne({ _id: id });

    if (global.io) {
      global.io.emit('imageUpdated', { action: 'deleted', category, imageId: id });
    }
    res.json({
      message: `Image deleted from category: ${category}`,
      deleted: image
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete image by id (no category required)
export const deleteImageById = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await Image.findById(id);
    if (!image) {
      // no DB match — attempt direct Cloudinary deletion using derived public_id
      // derive a candidate fileUrl from query or body if the client provided it
      const candidateFileUrl = req.query.fileUrl || (req.body && req.body.fileUrl) || null;
      const pidFromUrl = extractPublicId(candidateFileUrl);
      if (pidFromUrl) {
        try {
          // console.log('deleteImageByUrl: no DB match — attempting direct cloudinary destroy for', pidFromUrl);
          await cloudinary.uploader.destroy(pidFromUrl, { resource_type: 'image' });
        } catch (cloudErr) {
          console.error('deleteImageByUrl: direct cloudinary destroy failed', cloudErr);
        }
        try {
          const removed = await Image.deleteMany({ public_id: { $regex: pidFromUrl + '$' } });
          // console.log('deleteImageByUrl: deleted DB docs matching public_id:', removed.deletedCount || removed.n || 0);
        } catch (delErr) {
          console.error('deleteImageByUrl: failed to remove DB records by public_id', delErr);
        }
        return res.json({ message: 'Attempted to delete image from Cloudinary and DB by derived public_id', public_id: pidFromUrl });
      }
      return res.status(404).json({ message: 'Image not found' });
    }

    const publicId = extractPublicId(image.public_id || image.url);
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (e) {
      console.error('deleteImageById: cloudinary destroy error', e);
    }

    await Image.deleteOne({ _id: id });
    return res.json({ message: 'Image deleted', deleted: image });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// Delete image by fileUrl (query param `fileUrl`) or by body { fileUrl }
export const deleteImageByUrl = async (req, res) => {
  try {
    const fileUrl = req.query.fileUrl || (req.body && req.body.fileUrl);
    const publicIdParam = req.query.public_id || (req.body && req.body.public_id) || null;
    if (!fileUrl && !publicIdParam) {
      return res.status(400).json({ message: 'fileUrl or public_id query param/body is required' });
    }

    // decode in case the client encoded the URL in the querystring
    const decodedFileUrl = fileUrl
      ? (() => { try { return decodeURIComponent(String(fileUrl)); } catch (e) { return String(fileUrl); } })()
      : "";

    // console.log('deleteImageByUrl called with fileUrl:', decodedFileUrl);
    // If the client provided a `public_id`, prefer deleting by that first (more reliable)
    if (publicIdParam) {
      const pidCandidate = extractPublicId(publicIdParam) || String(publicIdParam);
      // console.log('deleteImageByUrl: public_id param provided, attempting direct destroy for', pidCandidate);
      try {
        // try destroying candidate directly
        await cloudinary.uploader.destroy(pidCandidate, { resource_type: 'image' });
        // remove DB records with matching suffix
        try {
          const pidSuffix = String(pidCandidate).split('/').pop();
          const removed = await Image.deleteMany({
            $or: [
              { public_id: pidCandidate },
              { public_id: { $regex: pidSuffix + '$' } },
              { url: { $regex: pidSuffix } },
            ],
          });
          // console.log('deleteImageByUrl: removed DB docs for public_id param:', removed.deletedCount || removed.n || 0);
        } catch (delErr) {
          console.error('deleteImageByUrl: failed to remove DB records for public_id param', delErr);
        }
        return res.json({ message: 'Deleted image by provided public_id', public_id: pidCandidate });
      } catch (err) {
        console.error('deleteImageByUrl: destroy by public_id param failed', err);
        // If destroy failed, still try to cleanup DB docs by provided public_id.
        try {
          const pidSuffix = String(pidCandidate).split('/').pop();
          const removed = await Image.deleteMany({
            $or: [
              { public_id: pidCandidate },
              { public_id: { $regex: pidSuffix + '$' } },
              { url: { $regex: pidSuffix } },
            ],
          });
          if ((removed.deletedCount || removed.n || 0) > 0) {
            return res.json({
              message: 'Deleted DB image references by provided public_id (remote destroy failed)',
              public_id: pidCandidate,
              deletedCount: removed.deletedCount || removed.n || 0,
            });
          }
        } catch (delErr) {
          console.error('deleteImageByUrl: DB cleanup by public_id failed', delErr);
        }
        // continue with regular matching when fileUrl exists
      }
    }
    // Use top-level `extractPublicId` helper defined above.

    // Try multiple matching strategies: exact url, public_id exact, public_id regex, url contains, filename match
    let image = null;
    if (decodedFileUrl) {
      // exact url (try decoded and raw)
      image = await Image.findOne({ url: decodedFileUrl }) || await Image.findOne({ url: fileUrl });
      // console.log('deleteImageByUrl: exact url match ->', !!image);
      if (!image) {
        // exact public_id match and suffix matches
        const pid = extractPublicId(decodedFileUrl);
        // console.log('deleteImageByUrl: extracted pid from fileUrl ->', pid);
        if (pid) {
          // try exact public_id
          image = await Image.findOne({ public_id: pid });
          // console.log('deleteImageByUrl: public_id exact match ->', !!image);
          // try suffix match (public_id might include folder prefixes)
          if (!image) {
            const pidEsc = pid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            image = await Image.findOne({ public_id: { $regex: pidEsc + '$' } });
            // console.log('deleteImageByUrl: public_id suffix match ->', !!image);
          }
          // try without leading folder (e.g., profiles/filename -> filename)
          if (!image && pid.includes('/')) {
            const shortPid = pid.split('/').pop();
            image = await Image.findOne({ public_id: { $regex: shortPid + '$' } });
            // console.log('deleteImageByUrl: public_id short-suffix match ->', !!image, 'shortPid=', shortPid);
          }
        }
      }
      if (!image) {
        // public_id contained in url (regex)
        const pid = extractPublicId(decodedFileUrl);
        if (pid) {
          image = await Image.findOne({ url: { $regex: pid } });
          // console.log('deleteImageByUrl: url regex pid match ->', !!image);
        }
      }
      if (!image) {
        // try url without version segment
        const short = decodedFileUrl.split('/').slice(-2).join('/');
        if (short) {
          image = await Image.findOne({ url: { $regex: short } });
          // console.log('deleteImageByUrl: url short-segment match ->', !!image, 'short=', short);
        }
      }
      if (!image) {
        // final fallback: try matching filename without extension
        const filename = decodedFileUrl.split('/').pop().replace(/\.[a-zA-Z0-9]+$/, '');
        if (filename) {
          image = await Image.findOne({ $or: [{ url: { $regex: filename } }, { public_id: { $regex: filename + '$' } }] });
          // console.log('deleteImageByUrl: filename regex match ->', !!image, 'filename=', filename);
        }
      }
    }

    if (!image) {
      // No DB match — attempt robust direct Cloudinary destroy using candidate public_id variants
      try {
        const pidBase = extractPublicId(decodedFileUrl);
        const candidates = [];
        if (pidBase) {
          candidates.push(pidBase);
          if (pidBase.includes('/')) candidates.push(pidBase.split('/').pop());
          candidates.push(`profiles/${pidBase.split('/').pop()}`);
          candidates.push(`imagica/${pidBase}`);
          candidates.push(`imagica/profiles/${pidBase.split('/').pop()}`);
        }
        // de-duplicate
        const uniqCandidates = [...new Set(candidates.filter(Boolean))];
        for (const cand of uniqCandidates) {
          try {
            await cloudinary.api.resource(cand, { resource_type: 'image' });
            // console.log('deleteImageByUrl: cloudinary.resource exists for', cand);
            try { await cloudinary.uploader.destroy(cand, { resource_type: 'image' }); } catch (dE) { console.error('destroy failed for', cand, dE); }
            try {
              const filename = decodedFileUrl.split('/').pop().replace(/\.[a-zA-Z0-9]+$/, '');
              const candidateSuffix = cand.split('/').pop();
              const removed = await Image.deleteMany({
                $or: [
                  { public_id: cand },
                  { public_id: { $regex: candidateSuffix + '$' } },
                  { url: decodedFileUrl },
                  { url: { $regex: candidateSuffix } },
                  { url: { $regex: filename } }
                ]
              });
              // console.log('deleteImageByUrl: deleted DB docs matching candidate:', cand, removed.deletedCount || removed.n || 0);
            } catch (delErr) {
              console.error('deleteImageByUrl: failed to remove DB records by candidate', cand, delErr);
            }
            return res.json({ message: 'Attempted Cloudinary destroy by candidate public_id', candidate: cand });
          } catch (notFound) {
            // continue to next candidate
          }
        }
      } catch (e) {
        console.error('deleteImageByUrl: fallback direct delete attempt failed', e);
      }
      return res.status(404).json({ message: 'Image not found' });
    }

    // use shared extractPublicId

    const publicId = extractPublicId(image.public_id || image.url);
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    } catch (e) {
      console.error('deleteImageByUrl: cloudinary destroy error', e);
    }

    await Image.deleteOne({ _id: image._id });
    return res.json({ message: 'Image deleted', deleted: image });
  } catch (err) {
    console.error('deleteImageByUrl error:', err);
    // If not found, dump a short sample of candidate docs for debugging
    try {
      const sample = await Image.find({}).sort({ createdAt: -1 }).limit(10).select('url public_id category createdAt').lean();
      console.error('Image collection sample for debugging:', sample);
    } catch (sErr) {
      console.error('failed to fetch sample docs', sErr);
    }
    // If we reach here because no DB match was found earlier, try direct Cloudinary delete
    try {
      const pidFromUrl = extractPublicId(req.query.fileUrl || (req.body && req.body.fileUrl));
      if (pidFromUrl) {
        try {
          // console.log('deleteImageByUrl: attempting direct cloudinary destroy for', pidFromUrl);
          await cloudinary.uploader.destroy(pidFromUrl, { resource_type: 'image' });
        } catch (cloudErr) {
          console.error('deleteImageByUrl: direct cloudinary destroy failed', cloudErr);
        }
        // remove any DB docs whose public_id ends with pidFromUrl
        try {
          const removed = await Image.deleteMany({ public_id: { $regex: pidFromUrl + '$' } });
          // console.log('deleteImageByUrl: deleted DB docs matching public_id:', removed.deletedCount || removed.n || 0);
        } catch (delErr) {
          console.error('deleteImageByUrl: failed to remove DB records by public_id', delErr);
        }
        return res.json({ message: 'Attempted to delete image from Cloudinary and DB by derived public_id', public_id: pidFromUrl });
      }
    } catch (finalErr) {
      console.error('deleteImageByUrl: final cleanup attempt failed', finalErr);
    }

    return res.status(500).json({ message: err.message });
  }
};


// Delete all images by category
export const deleteImagesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Find all images of this category
    const images = await Image.find({ category });
    if (!images || images.length === 0) {
      return res.status(404).json({ message: "No images found for this category" });
    }

    // Delete from cloudinary (handle possible URL-stored public_id)
    const extractPublicId = (pid) => {
      if (!pid) return pid;
      try {
        if (pid.startsWith('http')) {
          const urlObj = new URL(pid);
          const parts = urlObj.pathname.split('/');
          const uploadIdx = parts.findIndex(p => p === 'upload');
          if (uploadIdx >= 0) {
            const after = parts.slice(uploadIdx + 1).join('/');
            const cleaned = after.replace(/^v\d+\//, '');
            return cleaned.replace(/\.[a-zA-Z0-9]+$/, '');
          }
          return pid;
        }
        return pid;
      } catch (e) {
        return pid;
      }
    };

    await Promise.all(
      images.map(img => {
        const pid = extractPublicId(img.public_id || img.url);
        return cloudinary.uploader.destroy(pid, { resource_type: 'image' });
      })
    );

    // Delete from DB
    await Image.deleteMany({ category });

    res.json({ message: `All images deleted for category: ${category}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addImage = async (req, res) => {
  try {
    const calendarEventId = req.body?.calendarEventId || undefined;

    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    if (!req.body.category) {
      return res.status(400).json({ message: "Category is required" });
    }

    // Validate file sizes and types
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExt = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg", ".avif"]);
    for (const file of req.files) {
      if (file.size > maxSize) {
        return res.status(400).json({ message: `File ${file.originalname} exceeds 10MB limit` });
      }
      const mimeOk = typeof file.mimetype === "string" && file.mimetype.startsWith("image/");
      const ext = path.extname(file.originalname || "").toLowerCase();
      const extOk = allowedExt.has(ext);
      if (!mimeOk && !extOk) {
        return res.status(400).json({ message: `File ${file.originalname} is not an image` });
      }
    }

    const savedImages = await Promise.all(
      req.files.map(async (file) => {
        // ImageKit middleware already uploaded - url/public_id already set
        let url = file.path || file.secure_url || file.url || file.location || null;
        let public_id = file.public_id || null;

        // If no remote URL yet and buffer exists, upload to Cloudinary
        if (!url || !String(url).startsWith("http")) {
          if (file?.buffer) {
            const uploaded = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                {
                  folder: `imagica/${String(req.body.category || "uncategorized")
                    .toLowerCase()
                    .replace(/[^a-z0-9-_]+/g, "-")
                    .replace(/-+/g, "-")
                    .replace(/^-|-$/g, "")}`,
                  resource_type: "image",
                },
                (error, result) => (error ? reject(error) : resolve(result))
              );
              streamifier.createReadStream(file.buffer).pipe(uploadStream);
            });
            url = uploaded?.secure_url || uploaded?.url;
            public_id = uploaded?.public_id || public_id;
          } else {
            throw new Error(`No URL and no buffer for file: ${file.originalname}`);
          }
        }

        if (!public_id && url) {
          const pid = extractPublicId(url);
          if (pid) public_id = pid;
        }

        const newImage = new Image({
          url,
          public_id: public_id || url,
          category: req.body.category,
          calendarEventId,
          filename: file.originalname,
          size: file.size,
        });
        return newImage.save();
      })
    );

    if (global.io) {
      global.io.emit('imageUpdated', { action: 'added', category: req.body.category, count: savedImages.length });
    }
    res.status(201).json({
      message: `${savedImages.length} image(s) uploaded successfully to category: ${req.body.category}`,
      images: savedImages,
    });
  } catch (err) {
    console.error("addImage: error", err);
    res.status(500).json({ message: err.message });
  }
};



// Get all unique categories with pagination support
export const getAllCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;
    
    // console.log('getAllCategories called with page:', page, 'limit:', limit); // Debug log
    
    // Get explicit categories from Category model with metadata
    const storedCategories = await Category.find({ isActive: true })
      .sort({ 
        type: 1, // festival first
        isPrimary: -1, // then primary
        order: 1, // then by order (0, 1, 2...)
        createdAt: -1 
      })
      .lean();
    
    // Get festivals as categories - FILTER OUT EXPIRED ONES
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const festivals = await Festival.find({
      festivalDate: { $gte: today } // Only future/today festivals
    })
      .sort({ festivalDate: -1 })
      .select('festivalName festivalDate')
      .lean();
    
    // Also filter stored festival categories by date
    const validStoredCategories = storedCategories.filter(cat => {
      if (cat.type === 'festival' && cat.festivalDate) {
        const festivalDate = new Date(cat.festivalDate);
        festivalDate.setHours(0, 0, 0, 0);
        const isValid = festivalDate >= today;
        // console.log(`Festival category ${cat.name}: date=${cat.festivalDate}, valid=${isValid}`);
        return isValid;
      }
      return true; // Keep non-festival categories
    });
    // Build category list - ONLY admin created categories
    const allCategories = [];
    
    // Add valid stored categories (expired festivals filtered out)
    validStoredCategories.forEach(cat => {
      allCategories.push({
        name: cat.name,
        type: cat.type,
        isPrimary: cat.isPrimary,
        order: cat.order
      });
    });
    
    // Add festivals as categories
    festivals.forEach(festival => {
      allCategories.push({
        name: festival.festivalName,
        type: 'festival',
        isPrimary: false,
        order: 1000
      });
    });
    
    // Sort: festival first, then primary by order, then others
    allCategories.sort((a, b) => {
      // Festival categories first
      if (a.type === 'festival' && b.type !== 'festival') return -1;
      if (a.type !== 'festival' && b.type === 'festival') return 1;
      
      // Primary categories second (sorted by order)
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      
      // Within primary categories, sort by order
      if (a.isPrimary && b.isPrimary) {
        return (a.order ?? 999) - (b.order ?? 999);
      }
      
      // Custom categories last
      return 0;
    });
    
    // Apply pagination
    const paginatedCategories = allCategories.slice(skip, skip + limit);
    
    // console.log('Total categories:', allCategories.length, 'Returning:', paginatedCategories.length); // Debug log
    
    res.json({
      categories: paginatedCategories,
      total: allCategories.length,
      page,
      limit,
      hasMore: skip + limit < allCategories.length
    });
  } catch (err) {
    console.error('getAllCategories error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Create a new explicit category (optional - categories can also exist implicitly via images)
export const createCategory = async (req, res) => {
  try {
    const { name, type = 'custom', isPrimary = false, order = 0, description } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ message: 'Category name is required' });
    const normalized = String(name).trim();
    
    // Check for existing category
    const existingCat = await Category.findOne({ 
      name: { $regex: `^${normalized.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, $options: 'i' } 
    });
    if (existingCat) return res.status(409).json({ message: 'Category already exists' });

    // Check implicit categories from images
    const imageCategories = await Image.distinct('category');
    const duplicateInImages = imageCategories.find((c) => 
      String(c || '').trim().toLowerCase() === normalized.toLowerCase()
    );
    if (duplicateInImages) {
      return res.status(409).json({ message: 'Category already exists (matches existing image category)' });
    }

    try {
      const cat = new Category({ 
        name: normalized, 
        type, 
        isPrimary, 
        order, 
        description 
      });
      await cat.save();
      res.status(201).json({ message: 'Category created', category: cat });
    } catch (saveErr) {
      if (saveErr && saveErr.code === 11000) {
        return res.status(409).json({ message: 'Category already exists' });
      }
      throw saveErr;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Initialize primary categories
export const initializePrimaryCategories = async (req, res) => {
  try {
    const primaryCategories = [
      { name: 'Good Morning', order: 1, description: 'Daily morning greetings' },
      { name: 'Good Night', order: 2, description: 'Daily night greetings' },
      { name: 'Good Afternoon', order: 3, description: 'Daily afternoon greetings' },
      { name: 'Happy Birthday', order: 4, description: 'Birthday wishes' },
      { name: 'Motivational', order: 5, description: 'Inspirational quotes and messages' },
      { name: 'Love & Romance', order: 6, description: 'Romantic messages and quotes' },
      { name: 'Business', order: 7, description: 'Business and professional content' }
    ];

    const created = [];
    for (const catData of primaryCategories) {
      const existing = await Category.findOne({ name: catData.name });
      if (!existing) {
        const cat = new Category({
          ...catData,
          type: 'primary',
          isPrimary: true
        });
        await cat.save();
        created.push(cat.name);
      }
    }

    res.json({ 
      message: `Initialized ${created.length} primary categories`, 
      created 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get festivals for category dropdown
export const getFestivalsForCategories = async (req, res) => {
  try {
    const festivals = await Festival.find()
      .sort({ festivalDate: -1 })
      .select('festivalName festivalDate _id')
      .lean();
    
    const festivalCategories = festivals.map(f => ({
      id: f._id,
      name: `Festival: ${f.festivalName}`,
      displayName: f.festivalName,
      date: f.festivalDate,
      type: 'festival'
    }));
    
    res.json(festivalCategories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get images by category with search, sort, and pagination
export const getImagesByCategory = async (req, res) => {
  try {
    // Block access to internal 'profiles' category
    if ((req.params && req.params.category) && String(req.params.category).toLowerCase() === 'profiles') {
      return res.status(404).json({ message: 'Images for this category not available' });
    }
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limitParam = req.query.limit;
    const limit = limitParam ? (limitParam === 'all' ? 0 : parseInt(limitParam)) : 0;
    const skip = limit === 0 ? 0 : (page - 1) * limit;
    
    // Get search and sort parameters
    const search = req.query.search || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    // Build query (case-insensitive exact match for category name)
    const rawCategory = String(req.params.category || "").trim();
    const escapedCategory = rawCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let query = { category: { $regex: `^${escapedCategory}$`, $options: "i" } };
    const calendarEventId = String(req.query.calendarEventId || "").trim();
    if (calendarEventId) {
      query.calendarEventId = calendarEventId;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { url: { $regex: search, $options: 'i' } },
        { public_id: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    let sortObj = {};
    if (sortBy === 'filename') {
      sortObj.public_id = sortOrder;
    } else {
      sortObj[sortBy] = sortOrder;
    }
    
    // Execute query with pagination and sorting
    let query_builder = Image.find(query).sort(sortObj);
    
    if (limit > 0) {
      query_builder = query_builder.skip(skip).limit(limit);
    }
    
    const images = await query_builder;
      
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove background using remove.bg (backend proxy) or fallback to normal upload
export const removeBg = async (req, res) => {
  try {
    // console.log('removeBg called - content-type:', req.headers['content-type']);
    // console.log('removeBg called - has req.file:', !!req.file, 'req.body keys:', req.body ? Object.keys(req.body) : null);

    let sourceBuffer = req.file?.buffer || null;
    let sourceName = req.file?.originalname || `removebg-${Date.now()}.png`;
    let sourceMime = req.file?.mimetype || "image/png";

    if (!sourceBuffer) {
      const incomingUrl = req.body && (req.body.imageUrl || req.body.fileUrl);
      if (!incomingUrl) {
        return res.status(400).json({ message: 'No file uploaded and no imageUrl/fileUrl provided' });
      }

      const imageUrl = String(incomingUrl);
      // console.log('removeBg: incomingUrl ->', imageUrl);
      try {
        let resp = await fetch(imageUrl);
        // console.log('removeBg: download resp status ->', resp.status);

        if (resp.status === 404) {
          const pidBase = extractPublicId(imageUrl);
          // console.log('removeBg: fetch returned 404, extracted public_id ->', pidBase);
          if (pidBase) {
            const short = pidBase.includes('/') ? pidBase.split('/').pop() : pidBase;
            const uniq = [...new Set([
              pidBase,
              short,
              `profiles/${short}`,
              `imagica/${pidBase}`,
              `imagica/profiles/${short}`,
            ].filter(Boolean))];

            for (const cand of uniq) {
              try {
                const resource = await cloudinary.api.resource(cand, { resource_type: 'image' });
                const remoteUrl = resource.secure_url || resource.url;
                // console.log('removeBg: cloudinary.api.resource found for', cand, '->', remoteUrl);
                resp = await fetch(remoteUrl);
                // console.log('removeBg: retry download resp status ->', resp.status);
                if (resp.ok) break;
              } catch {
                // try next
              }
            }
          }
        }

        if (!resp.ok) {
          try {
            const uploadResultRemote = await cloudinary.uploader.upload(imageUrl, { folder: 'profiles' });
            if (!uploadResultRemote || !uploadResultRemote.secure_url) {
              return res.status(400).json({ message: `Failed to download image and fallback upload failed` });
            }
            resp = await fetch(uploadResultRemote.secure_url);
            if (!resp.ok) {
              return res.status(400).json({ message: `Failed to download image after upload: ${resp.status}` });
            }
          } catch (uploadFallbackErr) {
            return res.status(400).json({ message: `Failed to download image: ${resp.status}`, error: uploadFallbackErr?.message });
          }
        }

        const arrayBuffer = await resp.arrayBuffer();
        sourceBuffer = Buffer.from(arrayBuffer);
        sourceName = `removebg-${Date.now()}.png`;
        sourceMime = "image/png";
      } catch (dlErr) {
        console.error('removeBg: download remote image failed', dlErr);
        return res.status(400).json({ message: 'Failed to download remote image', error: dlErr.message });
      }
    }

    if (!sourceBuffer) {
      return res.status(400).json({ message: "Could not read image data" });
    }

    const uploadOriginal = async () =>
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "profiles", resource_type: "image" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        streamifier.createReadStream(sourceBuffer).pipe(uploadStream);
      });

    const removeBgKey = process.env.REMOVE_BG_API_KEY;
    if (!removeBgKey) {
      const uploadResult = await uploadOriginal();
      return res.status(200).json({
        fileUrl: uploadResult.secure_url,
        note: 'REMOVE_BG_API_KEY not configured - returned original upload',
        public_id: uploadResult.public_id,
      });
    }

    let resp;
    try {
      const form = new FormData();
      const blob = new Blob([sourceBuffer], { type: sourceMime });
      form.append('image_file', blob, sourceName);
      form.append('size', 'auto');
      resp = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': removeBgKey },
        body: form,
      });
    } catch (fetchErr) {
      const uploadResult = await uploadOriginal();
      return res.status(200).json({
        fileUrl: uploadResult.secure_url,
        note: `remove.bg request failed: ${fetchErr.message}. Returned original upload.`,
        public_id: uploadResult.public_id,
      });
    }

    if (!resp.ok) {
      const errText = await resp.text();
      const uploadResult = await uploadOriginal();
      return res.status(200).json({
        fileUrl: uploadResult.secure_url,
        note: `remove.bg failed: ${resp.status} ${errText}. Returned original upload.`,
        public_id: uploadResult.public_id,
      });
    }

    const arrayBuffer = await resp.arrayBuffer();
    const resultBuffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'profiles', format: 'png', resource_type: 'image' },
        (error, result) => (error ? reject(error) : resolve(result))
      );
      streamifier.createReadStream(resultBuffer).pipe(uploadStream);
    });

    if (!uploadResult || !uploadResult.secure_url) {
      return res.status(500).json({ message: 'remove-bg failed: upload error' });
    }

    try {
      const img = new Image({
        url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        category: req.body.category || 'profiles',
      });
      const savedImg = await img.save();
      return res.status(200).json({
        fileUrl: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        image: savedImg,
      });
    } catch (saveErr) {
      return res.status(200).json({
        fileUrl: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        saved: false,
        saveError: saveErr?.message || String(saveErr),
      });
    }
  } catch (err) {
    console.error('removeBg error:', err);
    return res.status(500).json({ message: 'remove-bg failed', error: err.message });
  }
};
//deleteing

