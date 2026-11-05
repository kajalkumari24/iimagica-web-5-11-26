import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    category: { type: String, required: true },
    festivalId: { type: mongoose.Schema.Types.ObjectId, ref: "Festival" },
    calendarEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    filename: { type: String },
    size: { type: Number },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Add indexes for better query performance
imageSchema.index({ category: 1, createdAt: -1 });
imageSchema.index({ category: 1, public_id: 1 });
imageSchema.index({ festivalId: 1 });
imageSchema.index({ calendarEventId: 1, createdAt: -1 });
imageSchema.index({ url: 1 });
imageSchema.index({ isActive: 1 });

export default mongoose.model("Image", imageSchema);
