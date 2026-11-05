// models/DesignCategory.js

import mongoose from "mongoose";

const designCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    module: {
      type: String,
      required: true,
      enum: [
        "banner",
        "logo",
        "website",
        "visiting-card",
        "digital-card",
        "template"
      ]
    }
  },
  { timestamps: true }
);

const DesignCategory = mongoose.model("DesignCategory", designCategorySchema);

export default DesignCategory;