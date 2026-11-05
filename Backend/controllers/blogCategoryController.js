import BlogCategory from "../models/BlogCategory.js";
import Blog from "../models/Blog.js";
import { generateUniqueSlug } from "../services/blogService.js";

// @desc    Get all blog categories
// @route   GET /api/blog-categories
// @access  Public
export const getBlogCategories = async (req, res, next) => {
  try {
    const categories = await BlogCategory.find().sort({ name: 1 });
    
    // Calculate category-wise blog counts
    const categoriesWithCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await Blog.countDocuments({
          category: cat._id,
          status: "published",
        });
        return {
          ...cat.toObject(),
          blogCount: count,
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Blog categories fetched successfully",
      data: categoriesWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new blog category
// @route   POST /api/admin/blog-categories
// @access  Private/Admin
export const createBlogCategory = async (req, res, next) => {
  try {
    const { name, description, image } = req.body;

    const slug = await generateUniqueSlug(name, BlogCategory);

    const category = new BlogCategory({
      name,
      slug,
      description,
      image,
    });

    await category.save();

    return res.status(217).json({
      success: true,
      message: "Blog category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update blog category
// @route   PUT /api/admin/blog-categories/:id
// @access  Private/Admin
export const updateBlogCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    const category = await BlogCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Blog category not found",
      });
    }

    if (name && name !== category.name) {
      category.name = name;
      category.slug = await generateUniqueSlug(name, BlogCategory, id);
    }

    if (description !== undefined) category.description = description;
    if (image !== undefined) category.image = image;

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Blog category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete blog category
// @route   DELETE /api/admin/blog-categories/:id
// @access  Private/Admin
export const deleteBlogCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await BlogCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Blog category not found",
      });
    }

    // Check if any blogs are linked to this category
    const blogCount = await Blog.countDocuments({ category: id });
    if (blogCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category: ${blogCount} blog posts are linked to it`,
      });
    }

    await BlogCategory.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Blog category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
