import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "*",
    },
    planType: {
      type: String,
      enum: ["free", "monthly", "quarterly", "half-yearly", "yearly", "annually"],
      default: "monthly",
    },
    billing: {
      type: String,
      enum: ["monthly", "quarterly", "half-yearly", "yearly", "annually"],
      default: "monthly",
    },
    features: {
      type: [String],
      required: true,
    },
    link: {
      type: String,
      default: "/",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Plan", planSchema);
