import mongoose from "mongoose";

const frameSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, index: true },
    framePath: { type: String, required: true },
    layout: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // NEW: owner of an AI-generated footer (null for normal admin frames)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Create indexes for better performance
frameSchema.index({ category: 1, createdAt: -1 });
frameSchema.index({ createdAt: -1 });
frameSchema.index({ framePath: 1 });
frameSchema.index({ ownerId: 1, createdAt: -1 }); // NEW: used by /api/footer-ai/mine

export default mongoose.model("Frame", frameSchema);