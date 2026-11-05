import Category from "../models/Category.js";
import Image from "../models/Image.js";

// Get public categories (for app users)
export const getPublicCategories = async (req, res) => {
  try {
    const categories = await Category.find({})
      .select('name type eventType linkedCategory isPrimary order festivalDate description profileTypes')
      .sort({ isPrimary: -1, order: 1, createdAt: -1 })
      .lean();
    
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all categories with detailed information
export const getDetailedCategories = async (req, res) => {
  try {
    const categories = await Category.find({})
      .sort({ isPrimary: -1, order: 1, createdAt: -1 })
      .lean();
    
    // Add image count for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const imageCount = await Image.countDocuments({ 
          category: category.name, 
          isActive: true 
        });
        return { ...category, imageCount };
      })
    );
    
    res.json(categoriesWithCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const {
      name,
      type = 'custom',
      eventType = 'festival',
      linkedCategory,
      isPrimary = false,
      festivalDate,
      description,
      order = 0,
      profileTypes = []
    } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    const normalizedName = name.trim();
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: `^${normalizedName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, $options: 'i' }
    });
    
    if (existingCategory) {
      return res.status(409).json({ message: 'Category already exists' });
    }
    
    const categoryData = {
      name: normalizedName,
      type,
      isPrimary,
      order,
      description: description?.trim() || undefined,
      profileTypes
    };
    
    // Add festival date if it's a festival category
    if (type === 'festival' && festivalDate) {
      categoryData.festivalDate = new Date(festivalDate);
      categoryData.eventType = eventType || "festival";
      categoryData.linkedCategory = linkedCategory?.trim() || undefined;
    }
    
    const category = new Category(categoryData);
    await category.save();
    
    if (global.io) {
      global.io.emit('categoryUpdated', { action: 'created', category: { _id: category._id, name: category.name, type: category.type, profileTypes: category.profileTypes } });
    }
    res.status(201).json({ 
      message: 'Category created successfully', 
      category 
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Category already exists' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, eventType, linkedCategory, isPrimary, festivalDate, description, order, profileTypes } = req.body;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if new name conflicts with existing categories
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, $options: 'i' },
        _id: { $ne: id }
      });
      
      if (existingCategory) {
        return res.status(409).json({ message: 'Category name already exists' });
      }
    }
    
    // Update fields
    if (name) category.name = name.trim();
    if (type !== undefined) category.type = type;
    if (isPrimary !== undefined) category.isPrimary = isPrimary;
    if (order !== undefined) category.order = order;
    if (description !== undefined) category.description = description?.trim() || undefined;
    if (profileTypes !== undefined) category.profileTypes = profileTypes;
    
    // Handle festival-specific fields against effective type.
    const effectiveType = type !== undefined ? type : category.type;
    if (effectiveType === 'festival') {
      if (festivalDate !== undefined) {
        category.festivalDate = festivalDate ? new Date(festivalDate) : undefined;
      }
      if (eventType !== undefined) category.eventType = eventType;
      if (!category.eventType) category.eventType = "festival";
      if (linkedCategory !== undefined) category.linkedCategory = linkedCategory?.trim() || undefined;
    } else {
      category.festivalDate = undefined;
      category.eventType = undefined;
      category.linkedCategory = undefined;
    }
    
    await category.save();
    
    if (global.io) {
      global.io.emit('categoryUpdated', { action: 'updated', category: { _id: category._id, name: category.name, type: category.type, profileTypes: category.profileTypes } });
    }
    res.json({ 
      message: 'Category updated successfully', 
      category 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Toggle primary status
export const togglePrimaryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPrimary } = req.body;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    category.isPrimary = isPrimary;
    await category.save();
    
    res.json({ 
      message: `Category ${isPrimary ? 'marked as primary' : 'removed from primary'}`, 
      category 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category has images
    const imageCount = await Image.countDocuments({ category: category.name });
    if (imageCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category with ${imageCount} images. Please move or delete images first.` 
      });
    }
    
    await Category.findByIdAndDelete(id);
    
    if (global.io) {
      global.io.emit('categoryUpdated', { action: 'deleted', categoryId: id });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get category statistics
export const getCategoryStats = async (req, res) => {
  try {
    const [totalCategories, primaryCount, festivalCount, customCount] = await Promise.all([
      Category.countDocuments({ isActive: true }),
      Category.countDocuments({ isPrimary: true, isActive: true }),
      Category.countDocuments({ type: 'festival', isActive: true }),
      Category.countDocuments({ type: 'custom', isActive: true })
    ]);
    
    res.json({
      total: totalCategories,
      primary: primaryCount,
      festival: festivalCount,
      custom: customCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reorder categories
export const reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body; // Array of { id, order }
    
    const updatePromises = categories.map(({ id, order }) => 
      Category.findByIdAndUpdate(id, { order })
    );
    
    await Promise.all(updatePromises);
    
    res.json({ message: 'Categories reordered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
