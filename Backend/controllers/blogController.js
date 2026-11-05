import Blog from "../models/Blog.js";
import { getBlogsList, getBlogDetails, generateUniqueSlug, calculateReadTime } from "../services/blogService.js";

// @desc    Get all published blogs with filters
// @route   GET /api/blogs
// @access  Public
export const getBlogs = async (req, res, next) => {
  try {
    const result = await getBlogsList(req.query);
    return res.status(200).json({
      success: true,
      message: "Blogs fetched successfully",
      data: result.blogs,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalBlogs: result.totalBlogs,
        hasNextPage: result.hasNextPage,
        hasPreviousPage: result.hasPreviousPage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single blog details by slug
// @route   GET /api/blogs/:slug
// @access  Public
export const getSingleBlog = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await getBlogDetails(slug);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      data: {
        blog: result.blog,
        related: result.related,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get latest published blogs
// @route   GET /api/blogs/latest
// @access  Public
export const getLatestBlogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const blogs = await Blog.find({ status: "published" })
      .populate("category", "name slug")
      .sort({ publishedAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Latest blogs fetched successfully",
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular published blogs (by views)
// @route   GET /api/blogs/popular
// @access  Public
export const getPopularBlogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const blogs = await Blog.find({ status: "published" })
      .populate("category", "name slug")
      .sort({ views: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      message: "Popular blogs fetched successfully",
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get related blogs (same category)
// @route   GET /api/blogs/related/:slug
// @access  Public
export const getRelatedBlogs = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, status: "published" });
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const related = await Blog.find({
      category: blog.category,
      _id: { $ne: blog._id },
      status: "published",
    })
      .populate("category", "name slug")
      .sort({ publishedAt: -1 })
      .limit(4);

    return res.status(200).json({
      success: true,
      message: "Related blogs fetched successfully",
      data: related,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new blog post
// @route   POST /api/admin/blogs
// @access  Private/Admin
export const createBlog = async (req, res, next) => {
  try {
    const {
      title,
      excerpt,
      content,
      featuredImage,
      category,
      tags,
      author,
      status,
      isFeatured,
      isTrending,
      seoTitle,
      seoDescription,
      seoKeywords,
      sections,
    } = req.body;

    const slug = await generateUniqueSlug(title, Blog);
    const readTime = calculateReadTime(content);
    const publishedAt = status === "published" ? new Date() : null;

    const blog = new Blog({
      title,
      slug,
      excerpt,
      content,
      featuredImage,
      category,
      tags,
      author: author || "Admin",
      status: status || "draft",
      isFeatured: !!isFeatured,
      isTrending: !!isTrending,
      seoTitle: seoTitle || title,
      seoDescription: seoDescription || excerpt,
      seoKeywords,
      readTime,
      publishedAt,
      sections,
    });

    await blog.save();

    return res.status(217).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update blog post
// @route   PUT /api/admin/blogs/:id
// @access  Private/Admin
export const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    // Recalculate slug if title is changed
    if (updateData.title && updateData.title !== blog.title) {
      updateData.slug = await generateUniqueSlug(updateData.title, Blog, id);
    }

    // Recalculate read time if content is changed
    if (updateData.content) {
      updateData.readTime = calculateReadTime(updateData.content);
    }

    // Set publishedAt if status changes to published
    if (updateData.status === "published" && blog.status !== "published") {
      updateData.publishedAt = new Date();
    } else if (updateData.status === "draft" && blog.status === "published") {
      updateData.publishedAt = null;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug");

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete blog post
// @route   DELETE /api/admin/blogs/:id
// @access  Private/Admin
export const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle blog publish status
// @route   PATCH /api/admin/blogs/:id/status
// @access  Private/Admin
export const toggleBlogStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const newStatus = blog.status === "published" ? "draft" : "published";
    blog.status = newStatus;
    blog.publishedAt = newStatus === "published" ? new Date() : null;

    await blog.save();

    return res.status(200).json({
      success: true,
      message: `Blog status updated to ${newStatus}`,
      data: blog,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reorder blog posts
// @route   PUT /api/admin/blogs/reorder
// @access  Private/Admin
export const reorderBlogs = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({
        success: false,
        message: "orderedIds must be an array of IDs",
      });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } },
      },
    }));

    await Blog.bulkWrite(bulkOps);

    return res.status(200).json({
      success: true,
      message: "Blogs reordered successfully",
    });
  } catch (error) {
    next(error);
  }
};
