import { body, validationResult } from "express-validator";
import mongoose from "mongoose";
import Blog from "../models/Blog.js";
import BlogCategory from "../models/BlogCategory.js";

// Helper to handle validation results
export const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

export const validateBlog = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .custom(async (value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid Category ID");
      }
      const categoryExists = await BlogCategory.findById(value);
      if (!categoryExists) {
        throw new Error("Category not found");
      }
      return true;
    }),

  body("content")
    .notEmpty()
    .withMessage("Content is required"),

  body("status")
    .optional()
    .isIn(["draft", "published"])
    .withMessage("Status must be either draft or published"),

  body("slug")
    .optional()
    .trim()
    .custom(async (value, { req }) => {
      if (!value) return true;
      const blogId = req.params.id;
      const query = { slug: value.toLowerCase() };
      if (blogId) {
        query._id = { $ne: blogId };
      }
      const existing = await Blog.findOne(query);
      if (existing) {
        throw new Error("Slug must be unique");
      }
      return true;
    }),
  validateResult,
];

export const validateBlogCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 100 })
    .withMessage("Category name cannot exceed 100 characters"),

  body("slug")
    .optional()
    .trim()
    .custom(async (value, { req }) => {
      if (!value) return true;
      const catId = req.params.id;
      const query = { slug: value.toLowerCase() };
      if (catId) {
        query._id = { $ne: catId };
      }
      const existing = await BlogCategory.findOne(query);
      if (existing) {
        throw new Error("Category slug must be unique");
      }
      return true;
    }),
  validateResult,
];
