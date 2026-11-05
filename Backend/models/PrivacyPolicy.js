import mongoose from "mongoose";

const privacyPolicySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const PrivacyPolicy = mongoose.model(
  "PrivacyPolicy",
  privacyPolicySchema
);

export default PrivacyPolicy;