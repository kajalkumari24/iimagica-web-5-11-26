import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  desc: { type: String, required: true },
  coverImage: { type: String }, // uploaded image URL (Cloudinary)
  date: { type: String, required: true },
  time: { type: String, required: true },
  category: { type: String }, // optional
  targetProfileType: {
    type: String,
    default: "global",
    trim: true,
    lowercase: true,
  },
}, { timestamps: true });

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
