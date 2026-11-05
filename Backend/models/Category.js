import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { 
    type: String, 
    enum: ['primary', 'festival', 'custom'], 
    default: 'custom' 
  },
  profileTypes: {
  type: [String],
  default: []
},
  eventType: {
    type: String,
    enum: ['festival', 'birthday', 'jayanti', 'event']
  },
  linkedCategory: { type: String },
  isPrimary: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  description: { type: String },
  festivalDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Index for better query performance
categorySchema.index({ isPrimary: -1, order: 1 });
categorySchema.index({ type: 1 });
categorySchema.index({ isActive: 1 });

export default mongoose.model("Category", categorySchema);
