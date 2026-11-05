import mongoose from "mongoose";

const { Schema } = mongoose;

const SplashVideoSchema = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
    size: { type: Number },
    mimeType: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("SplashVideo", SplashVideoSchema);
