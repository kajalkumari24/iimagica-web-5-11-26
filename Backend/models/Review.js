import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: "" },
    isVisible: { type: Boolean, default: false }, // admin controls this
  },
  { timestamps: true }
);

// One review per user
reviewSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
