import mongoose from "mongoose";

const termsSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const TermsAndConditions = mongoose.model(
  "TermsAndConditions",
  termsSchema
);

export default TermsAndConditions;