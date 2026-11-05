import mongoose from "mongoose";

const designLibrarySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: [
        "banner",
        "website",
        "logo",
        "visitingCard",
        "digitalCard",
        "template",
      ],
      required: true,
    },

    imageUrl: {
      type: String,
      required: true,
    },

    // 🔥 COMMON FIELDS
    category: String,

    price: {
      type: Number,
      default: 0,
    },

    description: String,

    // 🔥 ImageKit
    fileId: String,
  },
  { timestamps: true }
);

export default mongoose.model("DesignLibrary", designLibrarySchema);