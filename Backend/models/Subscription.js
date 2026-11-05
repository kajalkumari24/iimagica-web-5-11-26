import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },
    planName: {
      type: String,
      required: true,
    },
    planType: {
      type: String,
      enum: ["free", "monthly", "quarterly", "half-yearly", "yearly", "annually"],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "quarterly", "half-yearly", "yearly", "annually", "trial"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled", "refunded"],
      default: "active",
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "free_trial", "app_store"],
      default: "free_trial",
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    productId: String,
    transactionId: { type: String, index: true },
    originalTransactionId: { type: String, index: true },
    source: { type: String, default: "app_store" },
    lastVerifiedAt: Date,
    autoRenew: {
      type: Boolean,
      default: false,
    },
    isFreeTrial: {
      type: Boolean,
      default: false,
    },
    notes: String,
  },
  { timestamps: true }
);

// Indexes for performance
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ expiryDate: 1 });
subscriptionSchema.index({ userId: 1, startDate: -1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual("isActive").get(function () {
  return this.status === "active" && this.expiryDate > new Date();
});

// Instance method to check if subscription is expired
subscriptionSchema.methods.checkExpiry = function () {
  if (this.expiryDate <= new Date() && this.status === "active") {
    this.status = "expired";
    return true;
  }
  return false;
};

export default mongoose.model("Subscription", subscriptionSchema);