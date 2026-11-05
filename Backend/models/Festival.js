
import mongoose from "mongoose";

const festivalSchema = new mongoose.Schema(
  {
    festivalName: { type: String, required: true, trim: true },

    festivalDate: { type: Date, required: true },

    linkedCategory: {
      type: String,
      required: true, // ✅ important (always link category)
      trim: true,
    },

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String },
      },
    ],

    description: { type: String, trim: true },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Festival", festivalSchema);