import mongoose from "mongoose";

const profileTypeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      // "party", "professional", "brand"
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ProfileType", profileTypeSchema);