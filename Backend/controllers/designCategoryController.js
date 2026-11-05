import DesignCategory from "../models/DesignCategory.js";

const normalizeText = (value = "") => String(value || "").trim();

export const createDesignCategory = async (req, res) => {
  try {
    const name = normalizeText(req.body?.name);
    const module = normalizeText(req.body?.module);

    if (!name || !module) {
      return res.status(400).json({
        success: false,
        message: "Name and module are required",
      });
    }

    const exists = await DesignCategory.findOne({
      module,
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "Category already exists in this module",
      });
    }

    const category = await DesignCategory.create({ name, module });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const getDesignCategories = async (req, res) => {
  try {
    const module = normalizeText(req.query?.module);
    const filter = module ? { module } : {};

    const categories = await DesignCategory.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const updateDesignCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const name = normalizeText(req.body?.name);
    const module = normalizeText(req.body?.module);

    if (!name || !module) {
      return res.status(400).json({
        success: false,
        message: "Name and module are required",
      });
    }

    const existing = await DesignCategory.findById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const duplicate = await DesignCategory.findOne({
      _id: { $ne: id },
      module,
      name: { $regex: `^${name}$`, $options: "i" },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Category already exists in this module",
      });
    }

    existing.name = name;
    existing.module = module;
    await existing.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: existing,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const deleteDesignCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await DesignCategory.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
