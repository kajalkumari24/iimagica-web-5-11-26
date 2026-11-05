import mongoose from "mongoose";

const userAuthAuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    email: { type: String, default: "" },
    action: { type: String, required: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

userAuthAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model("UserAuthAuditLog", userAuthAuditLogSchema);
