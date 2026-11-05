import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: false },
    action: { type: String, required: true },
    ip: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("AdminAuditLog", adminAuditLogSchema);
