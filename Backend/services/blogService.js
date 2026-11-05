import Blog from "../models/Blog.js";
import BlogCategory from "../models/BlogCategory.js";

// Helper: Slugify text
export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start
    .replace(/-+$/, ""); // Trim - from end
};

// Helper: Generate unique slug
export const generateUniqueSlug = async (title, model, id = null) => {
  let slug = slugify(title);
  let uniqueSlug = slug;
  let count = 1;

  while (true) {
    const query = { slug: uniqueSlug };
    if (id) {
      query._id = { $ne: id };
    }
    const existing = await model.findOne(query);
    if (!existing) break;
    uniqueSlug = `${slug}-${count}`;
    count++;
  }

  return uniqueSlug;
};

// Helper: Calculate read time in minutes
export const calculateReadTime = (content) => {
  const wordsPerMinute = 200;
  const noOfWords = content ? content.trim().split(/\s+/).length : 0;
  const minutes = noOfWords / wordsPerMinute;
  return Math.max(1, Math.ceil(minutes));
};

// Blog Business Logic Service
export const getBlogsList = async (queryParams) => {
  const { page = 1, limit = 9, category, search, tag, sort, status } = queryParams;
  
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  // Filter conditions
  const filter = {};
  if (status === "all") {
    // Show all statuses (draft + published)
  } else if (status === "draft" || status === "published") {
    filter.status = status;
  } else {
    // Default to published only for public views
    filter.status = "published";
  }

  // Category filter by category slug
  if (category) {
    const categoryDoc = await BlogCategory.findOne({ slug: category });
    if (categoryDoc) {
      filter.category = categoryDoc._id;
    } else {
      // If category slug not found, return empty results
      return {
        blogs: [],
        currentPage: pageNum,
        totalPages: 0,
        totalBlogs: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
  }

  // Tag filter
  if (tag) {
    filter.tags = tag;
  }

  // Search filter (MongoDB text search or regex)
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { excerpt: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
    ];
  }

  // Sorting
  let sortOption = { order: 1, publishedAt: -1 }; // Default: custom order (asc), then latest published
  if (sort === "oldest") {
    sortOption = { publishedAt: 1 };
  } else if (sort === "popular") {
    sortOption = { views: -1 };
  } else if (sort === "title") {
    sortOption = { title: 1 };
  } else if (sort === "latest") {
    sortOption = { order: 1, publishedAt: -1 };
  }

  // Query database
  const totalBlogs = await Blog.countDocuments(filter);
  const blogs = await Blog.find(filter)
    .populate("category", "name slug")
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  const totalPages = Math.ceil(totalBlogs / limitNum);

  return {
    blogs,
    currentPage: pageNum,
    totalPages,
    totalBlogs,
    hasNextPage: pageNum < totalPages,
    hasPreviousPage: pageNum > 1,
  };
};

export const getBlogDetails = async (slug) => {
  const blog = await Blog.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true }
  ).populate("category", "name slug");

  if (!blog) return null;

  // Get related blogs from same category (excluding current post)
  const related = await Blog.find({
    category: blog.category._id,
    _id: { $ne: blog._id },
    status: "published",
  })
    .limit(3)
    .populate("category", "name slug")
    .sort({ publishedAt: -1 });

  return { blog, related };
};
