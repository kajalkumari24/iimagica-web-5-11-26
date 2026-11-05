
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // =========================
    // 🔐 AUTH FIELDS
    // =========================

    // Email Login
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    authProvider: {
      type: String,
      enum: ["email", "google", "phone"],
      default: "email",
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      trim: true,
      default: "",
    },

    // Phone Login (Firebase)
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },

    // =========================
    // 🔢 OTP (ONLY EMAIL)
    // =========================
    otp: String,
    otpExpiry: Date,
    lastOtpSentAt: {
      type: Date,
      index: true,
    },

    otpVerifyAttempts: {
      type: Number,
      default: 0,
    },
    otpVerifyWindowStart: Date,
    otpLockedUntil: Date,

    // =========================
    // 👤 USER INFO
    // =========================
    profileCompleted: {
      type: Boolean,
      default: false,
    },

    // =========================
    // � SUBSCRIPTION INFO
    // =========================
    currentPlan: {
      type: String,
      enum: ["free", "free_trial", "monthly", "quarterly", "half-yearly", "yearly", "annually"],
      default: "free",
    },
    planStartDate: {
      type: Date,
      default: null,
    },
    planExpiryDate: {
      type: Date,
      default: null,
    },
    isFreeTrialActive: {
      type: Boolean,
      default: false,
    },
    freeTrialStartDate: {
      type: Date,
      default: null,
    },
    freeTrialExpiryDate: {
      type: Date,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "cancelled", "trial"],
      default: "trial",
    },

    // =========================
    // �🛡️ ROLE & STATUS
    // =========================
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },

    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },

    // =========================
    // 📊 TRACKING
    // =========================
    lastLoginAt: Date,
    lastActiveAt: Date,
    loginCount: {
      type: Number,
      default: 0,
    },

    fcmToken: {
      type: String,
      default: "",
    },

    forceOTP: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);


// =========================
// ⚡ INDEXES
// =========================
userSchema.index({ email: 1, createdAt: -1 });
userSchema.index({ status: 1, role: 1 });
userSchema.index({ lastLoginAt: -1 });


// =========================
// 🔄 CASCADE DELETE
// =========================
userSchema.pre("findOneAndDelete", async function (next) {
  try {
    const userId = this.getQuery()._id;

    if (userId) {
      const Profile = mongoose.model("Profile");
      await Profile.deleteMany({ userId });
      console.log(`Deleted profiles for user: ${userId}`);
    }

    next();
  } catch (error) {
    console.error("Cascade delete error:", error);
    next(error);
  }
});

userSchema.pre("deleteMany", async function (next) {
  try {
    const query = this.getQuery();
    const User = mongoose.model("User");

    const users = await User.find(query).select("_id");
    const userIds = users.map((u) => u._id);

    if (userIds.length > 0) {
      const Profile = mongoose.model("Profile");
      await Profile.deleteMany({ userId: { $in: userIds } });
      console.log(`Deleted profiles for ${userIds.length} users`);
    }

    next();
  } catch (error) {
    console.error("Cascade delete error:", error);
    next(error);
  }
});

export default mongoose.model("User", userSchema);
