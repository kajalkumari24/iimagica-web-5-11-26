import DesignLibrary from "../models/designLibrary.js";
import imagekit from "../config/imagekit.js";

const normalizeCategory = (value = "") => String(value || "").trim();

const getByType = async (req, res, type) => {
  try {
    const category = normalizeCategory(req.query?.category);
    const filter = { type };

    if (category) {
      filter.category = category;
    }

    const data = await DesignLibrary.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================== ADD ==================
export const addDesign = async (req, res) => {
  try {
    const { title, type, category, price, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const uploadRes = await imagekit.files.upload({
      file: req.file.buffer.toString("base64"),
      fileName: Date.now() + "-" + req.file.originalname,
    });

    const result = await DesignLibrary.create({
      title,
      type,
      category,
      price,
      description,
      imageUrl: uploadRes.url,
      fileId: uploadRes.fileId,
    });

    res.status(201).json({
      success: true,
      message: "Design added successfully",
      data: result,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================== UPDATE ==================
export const updateDesign = async (req, res) => {
  try {
    const { id } = req.params;

    const design = await DesignLibrary.findById(id);
    if (!design) {
      return res.status(404).json({ message: "Design not found" });
    }

    // 🔥 image update
    if (req.file) {
      if (design.fileId) {
        await imagekit.files.delete(design.fileId);
      }

      const uploadRes = await imagekit.files.upload({
        file: req.file.buffer.toString("base64"),
        fileName: Date.now() + "-" + req.file.originalname,
      });

      design.imageUrl = uploadRes.url;
      design.fileId = uploadRes.fileId;
    }

    // 🔥 fields update
    design.title = req.body.title || design.title;
    design.category = req.body.category || design.category;
    design.price = req.body.price ?? design.price;
    design.description = req.body.description || design.description;

    await design.save();

    res.json({
      success: true,
      message: "Updated successfully",
      data: design,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ================== DELETE ==================
export const deleteDesign = async (req, res) => {
  try {
    const { id } = req.params;

    const design = await DesignLibrary.findById(id);
    if (!design) {
      return res.status(404).json({ message: "Design not found" });
    }

    // 🔥 delete from ImageKit
    if (design.fileId) {
      await imagekit.files.delete(design.fileId);
    }

    await DesignLibrary.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// ================== GET APIs ==================

// Banner
export const getBanners = async (req, res) => {
  return getByType(req, res, "banner");
};

// Website
export const getWebsites = async (req, res) => {
  return getByType(req, res, "website");
};

// Logo
export const getLogos = async (req, res) => {
  return getByType(req, res, "logo");
};

// Visiting Card
export const getVisitingCards = async (req, res) => {
  return getByType(req, res, "visitingCard");
};

// Digital Card
export const getDigitalCards = async (req, res) => {
  return getByType(req, res, "digitalCard");
};

// Templates
export const getTemplates = async (req, res) => {
  return getByType(req, res, "template");
};
