import User from "../models/User.js";
import Subscription from "../models/Subscription.js";
import Plan from "../models/Plan.js";
import mongoose from "mongoose";
import { verifyApplePurchase } from "../services/appleVerificationService.js";

const FREE_TRIAL_MINUTES = parseInt(process.env.FREE_TRIAL_MINUTES || "", 10);
const FREE_TRIAL_DAYS = parseInt(process.env.FREE_TRIAL_DAYS || "30", 10);

const getFreeTrialDurationMs = () => {
  if (Number.isFinite(FREE_TRIAL_MINUTES) && FREE_TRIAL_MINUTES > 0) {
    return FREE_TRIAL_MINUTES * 60 * 1000;
  }
  return FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000;
};

const getFreeTrialLabel = () => {
  if (Number.isFinite(FREE_TRIAL_MINUTES) && FREE_TRIAL_MINUTES > 0) {
    return `${FREE_TRIAL_MINUTES} minute${FREE_TRIAL_MINUTES !== 1 ? "s" : ""}`;
  }
  return `${FREE_TRIAL_DAYS} day${FREE_TRIAL_DAYS !== 1 ? "s" : ""}`;
};

const calculatePaidExpiryDate = (billing = "", startDate = new Date()) => {
  const baseTime = startDate.getTime();
  const lower = String(billing).toLowerCase();

  if (lower.includes("half")) {
    return new Date(baseTime + 180 * 24 * 60 * 60 * 1000);
  }
  if (lower.includes("year") || lower.includes("annual")) {
    return new Date(baseTime + 365 * 24 * 60 * 60 * 1000);
  }
  if (lower.includes("quarter")) {
    return new Date(baseTime + 90 * 24 * 60 * 60 * 1000);
  }
  return new Date(baseTime + 30 * 24 * 60 * 60 * 1000);
};

const getUpgradeBaseDate = (user, now = new Date()) => {
  const paidExpiry = user?.planExpiryDate ? new Date(user.planExpiryDate) : null;
  const trialExpiry = user?.isFreeTrialActive && user?.freeTrialExpiryDate
    ? new Date(user.freeTrialExpiryDate)
    : null;

  if (paidExpiry && paidExpiry > now) {
    return paidExpiry;
  }

  if (trialExpiry && trialExpiry > now) {
    return trialExpiry;
  }

  return now;
};

const createOrResetFreeTrialForUser = async (user) => {
  const now = new Date();
  const trialStartDate = now;
  const trialExpiryDate = new Date(now.getTime() + getFreeTrialDurationMs());
  const trialLabel = getFreeTrialLabel();

  await Subscription.updateMany(
    { userId: user._id, status: "active" },
    { status: "cancelled" }
  );

  user.isFreeTrialActive = true;
  user.freeTrialStartDate = trialStartDate;
  user.freeTrialExpiryDate = trialExpiryDate;
  user.currentPlan = "free";
  user.planStartDate = null;
  user.planExpiryDate = null;
  user.subscriptionStatus = "trial";
  await user.save();

  const freePlan = await Plan.findOne({ planType: "free" });
  const trialPlanId = freePlan ? freePlan._id : new mongoose.Types.ObjectId();

  const subscription = await Subscription.create({
    userId: user._id,
    planId: trialPlanId,
    planName: "Free Trial",
    planType: "free",
    billingCycle: "trial",
    amount: 0,
    startDate: trialStartDate,
    expiryDate: trialExpiryDate,
    status: "active",
    paymentMethod: "free_trial",
    isFreeTrial: true,
    notes: `Free trial started for ${trialLabel}`,
  });

  return {
    subscription,
    trialStartDate,
    trialExpiryDate,
    trialLabel,
  };
};

export const ensureEligibleFreeTrialForUser = async (user) => {
  if (!user?._id) return null;
  if (user.isFreeTrialActive || user.freeTrialStartDate) return null;

  const now = new Date();
  const activePaidSubscription = await Subscription.findOne({
    userId: user._id,
    isFreeTrial: false,
    status: "active",
    expiryDate: { $gt: now },
  });

  if (activePaidSubscription) {
    return null;
  }

  return createOrResetFreeTrialForUser(user);
};

// Get user's current subscription
export const getUserSubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get user's current plan info
    const user = await User.findById(userId).select(
      "currentPlan planStartDate planExpiryDate isFreeTrialActive freeTrialStartDate freeTrialExpiryDate subscriptionStatus"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let latestTrialGrant = null;
    if (!user.isFreeTrialActive && !user.freeTrialStartDate) {
      latestTrialGrant = await ensureEligibleFreeTrialForUser(user);
    }

    // Get most recent subscription record for the user
    const activeSubscription = await Subscription.findOne({ userId })
      .populate("planId", "name planType billing duration price features")
      .sort({ createdAt: -1 });

    // Check if free trial is active
    const now = new Date();
    let isFreeTrialActive = false;
    let freeTrialDaysLeft = 0;
    let freeTrialHoursLeft = 0;
    let freeTrialMinutesLeft = 0;
    const hasTrialPeriod =
      (latestTrialGrant?.trialStartDate && latestTrialGrant?.trialExpiryDate) ||
      (user.freeTrialStartDate && user.freeTrialExpiryDate);

    if (hasTrialPeriod && user.freeTrialExpiryDate > now) {
      isFreeTrialActive = true;
      const timeDiff = user.freeTrialExpiryDate.getTime() - now.getTime();
      freeTrialDaysLeft = Math.floor(timeDiff / (1000 * 3600 * 24));
      freeTrialHoursLeft = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
      freeTrialMinutesLeft = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60));
      if (!user.isFreeTrialActive) {
        user.isFreeTrialActive = true;
        user.subscriptionStatus = "trial";
        await user.save();
      }
    } else if (user.isFreeTrialActive && user.freeTrialExpiryDate && user.freeTrialExpiryDate <= now) {
      user.isFreeTrialActive = false;
      user.subscriptionStatus = "expired";
      await user.save();
    }

    // Determine current plan and effective subscription status
    let currentPlan = "free";
    let planDetails = null;
    let expiryDate = null;
    let startDate = null;
    let subscriptionStatus = user.subscriptionStatus || "expired";
    let daysLeft = 0;
    let hoursLeft = 0;
    let minutesLeft = 0;

    if (isFreeTrialActive) {
      currentPlan = "free_trial";
      expiryDate = user.freeTrialExpiryDate;
      startDate = user.freeTrialStartDate;
      subscriptionStatus = "trial";
    } else if (activeSubscription) {
      planDetails = activeSubscription.planId;
      expiryDate = activeSubscription.expiryDate;
      startDate = activeSubscription.startDate;
      if (expiryDate && expiryDate > now) {
        currentPlan = activeSubscription.planType;
        subscriptionStatus = "active";
      } else {
        currentPlan = activeSubscription.planType || "free";
        subscriptionStatus = "expired";
      }
    }

    // Calculate exact remaining time for active/trial subscriptions
    if ((subscriptionStatus === "active" || subscriptionStatus === "trial") && expiryDate && expiryDate > now) {
      const timeDiff = expiryDate.getTime() - now.getTime();
      daysLeft = Math.floor(timeDiff / (1000 * 3600 * 24));
      hoursLeft = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
      minutesLeft = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60));
    }

    return res.status(200).json({
      success: true,
      subscription: {
        currentPlan,
        planDetails,
        startDate,
        expiryDate,
        isFreeTrialActive,
        daysLeft,
        hoursLeft,
        minutesLeft,
        subscriptionStatus,
        activeSubscription: activeSubscription || null,
      },
    });
  } catch (error) {
    console.error("Get user subscription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to get subscription",
    });
  }
};

// Start free trial for new user
export const startFreeTrial = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Check if user already has free trial
    if (user.isFreeTrialActive || user.freeTrialStartDate) {
      return res.status(400).json({
        success: false,
        message: "Free trial already started",
      });
    }

    const { trialExpiryDate, trialLabel } = await createOrResetFreeTrialForUser(user);

    return res.status(200).json({
      success: true,
      message: `Free trial started for ${trialLabel}`,
      subscription: {
        currentPlan: "free_trial",
        expiryDate: trialExpiryDate,
        isFreeTrialActive: true,
        daysLeft: Math.floor(getFreeTrialDurationMs() / (1000 * 60 * 60 * 24)),
        hoursLeft: Math.floor((getFreeTrialDurationMs() % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutesLeft: Math.floor((getFreeTrialDurationMs() % (1000 * 60 * 60)) / (1000 * 60)),
      },
    });
  } catch (error) {
    console.error("Start free trial error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to start free trial",
    });
  }
};

export const adminResetUserFreeTrial = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { subscription, trialStartDate, trialExpiryDate, trialLabel } = await createOrResetFreeTrialForUser(user);

    return res.status(200).json({
      success: true,
      message: `Free trial reset successfully for ${trialLabel}`,
      subscription: {
        id: subscription._id,
        startDate: trialStartDate,
        expiryDate: trialExpiryDate,
        status: subscription.status,
        planType: "free_trial",
      },
      user: {
        id: user._id,
        email: user.email || "",
      },
    });
  } catch (error) {
    console.error("Admin reset user free trial error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reset free trial",
    });
  }
};

// Upgrade subscription
export const upgradeSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user._id;

    if (!planId) {
      return res.status(400).json({ success: false, message: "Plan ID is required" });
    }

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, message: "Plan not found or inactive" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const now = new Date();
    const startDate = now;
    const upgradeBaseDate = getUpgradeBaseDate(user, now);
    const expiryDate = calculatePaidExpiryDate(plan.billing, upgradeBaseDate);

    // Cancel any existing active subscriptions
    await Subscription.updateMany(
      { userId, status: "active" },
      { status: "cancelled" }
    );

    // Create new subscription
    const subscription = new Subscription({
      userId,
      planId: plan._id,
      planName: plan.name,
      planType: plan.planType,
      billingCycle: plan.billing,
      amount: parseFloat(plan.price),
      startDate,
      expiryDate,
      status: "active",
      paymentMethod: "razorpay", // Will be updated after payment
      isFreeTrial: false,
    });

    await subscription.save();

    // Update user
    user.currentPlan = plan.planType;
    user.planStartDate = startDate;
    user.planExpiryDate = expiryDate;
    user.subscriptionStatus = "active";
    user.isFreeTrialActive = false; // End free trial if active
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Subscription upgraded successfully",
      subscription: {
        id: subscription._id,
        planName: plan.name,
        planType: plan.planType,
        expiryDate,
        amount: plan.price,
      },
    });
  } catch (error) {
    console.error("Upgrade subscription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upgrade subscription",
    });
  }
};

// Check subscription expiry and send notifications
export const checkSubscriptionExpiry = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const now = new Date();
    let daysLeft = 0;
    let hoursLeft = 0;
    let minutesLeft = 0;
    let isExpiringSoon = false;

    const targetExpiry = user.isFreeTrialActive ? user.freeTrialExpiryDate : user.planExpiryDate;
    if (targetExpiry && targetExpiry > now) {
      const timeDiff = targetExpiry.getTime() - now.getTime();
      daysLeft = Math.floor(timeDiff / (1000 * 3600 * 24));
      hoursLeft = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
      minutesLeft = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60));
      isExpiringSoon = daysLeft <= 3;
    }

    return res.status(200).json({
      success: true,
      expiryInfo: {
        daysLeft,
        hoursLeft,
        minutesLeft,
        isExpiringSoon,
        isFreeTrial: user.isFreeTrialActive,
        expiryDate: user.isFreeTrialActive ? user.freeTrialExpiryDate : user.planExpiryDate,
      },
    });
  } catch (error) {
    console.error("Check subscription expiry error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to check subscription expiry",
    });
  }
};

// Get subscription details for a specific user (Admin only)
export const adminGetUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "name email mobile currentPlan planStartDate planExpiryDate isFreeTrialActive freeTrialStartDate freeTrialExpiryDate subscriptionStatus"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get all subscriptions for this user
    const subscriptions = await Subscription.find({ userId })
      .populate("planId", "name planType billing price")
      .sort({ createdAt: -1 });

    const now = new Date();
    let daysLeft = 0;
    let hoursLeft = 0;
    let minutesLeft = 0;

    const targetExpiry = user.isFreeTrialActive ? user.freeTrialExpiryDate : user.planExpiryDate;

    if (targetExpiry && targetExpiry > now) {
      const timeDiff = targetExpiry.getTime() - now.getTime();
      daysLeft = Math.floor(timeDiff / (1000 * 3600 * 24));
      hoursLeft = Math.floor((timeDiff % (1000 * 3600 * 24)) / (1000 * 3600));
      minutesLeft = Math.floor((timeDiff % (1000 * 3600)) / (1000 * 60));
    }

    return res.status(200).json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        mobile: user.mobile
      },
      currentStatus: {
        planType: user.currentPlan || "free",
        status: user.subscriptionStatus || "expired",
        isFreeTrial: user.isFreeTrialActive,
        startDate: user.isFreeTrialActive ? user.freeTrialStartDate : user.planStartDate,
        expiryDate: targetExpiry,
        daysLeft,
        hoursLeft,
        minutesLeft
      },
      history: subscriptions
    });
  } catch (error) {
    console.error("Admin get user subscription error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user subscription details",
    });
  }
};

const APPLE_PRODUCT_MAP = {
  "com.infinity.imagica.premium.monthly": {
    planName: "Premium Monthly",
    billing: "Monthly",
    planType: "monthly",
    billingCycle: "monthly",
    months: 1,
    amount: 199,
  },
  "com.infinity.imagica.premium.quarterly": {
    planName: "Premium Quarterly",
    billing: "Quarterly",
    planType: "quarterly",
    billingCycle: "quarterly",
    months: 3,
    amount: 499,
  },
  "com.infinity.imagica.premium.halfyearly": {
    planName: "Premium Half-Yearly",
    billing: "Half-Yearly",
    planType: "half-yearly",
    billingCycle: "half-yearly",
    months: 6,
    amount: 899,
  },
  "com.infinity.imagica.premium.yearly": {
    planName: "Premium Yearly",
    billing: "Yearly",
    planType: "yearly",
    billingCycle: "yearly",
    months: 12,
    amount: 1499,
  },
};

function calculateExpiryFromMonths(startDate, months) {
  const expiry = new Date(startDate.getTime());
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
}

// Verify iOS App Store StoreKit Subscription Purchase
export const verifyIosPurchase = async (req, res) => {
  try {
    const userId = req.user?._id;
    const {
      productId,
      transactionId,
      verificationData,
      localVerificationData,
      purchaseDate: rawPurchaseDate,
      source = "app_store",
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    if (!productId || !transactionId || (!verificationData && !localVerificationData)) {
      return res.status(400).json({
        success: false,
        message: "Missing required purchase fields.",
      });
    }

    // Supported Product IDs Check
    const productConfig = APPLE_PRODUCT_MAP[productId];
    if (!productConfig) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired subscription.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Prevent duplicate transactions / Replay attacks
    const existingSubscription = await Subscription.findOne({ transactionId });
    if (existingSubscription) {
      if (String(existingSubscription.userId) === String(user._id) && existingSubscription.status === "active") {
        return res.status(200).json({
          success: true,
          message: "Subscription verified successfully.",
          isPremium: true,
          plan: productConfig.planName,
          billing: productConfig.billing,
          expiryDate: existingSubscription.expiryDate.toISOString(),
        });
      }

      if (String(existingSubscription.userId) !== String(user._id)) {
        return res.status(400).json({
          success: false,
          message: "Transaction ID has already been used.",
        });
      }
    }

    // Verify purchase with Apple Server Verification
    const appleVerification = await verifyApplePurchase({
      verificationData: verificationData || localVerificationData,
      transactionId,
      productId,
    });

    if (!appleVerification || !appleVerification.isValid) {
      return res.status(400).json({
        success: false,
        message: appleVerification?.reason || "Invalid or expired subscription.",
      });
    }

    const purchaseDate = rawPurchaseDate
      ? new Date(rawPurchaseDate)
      : appleVerification.purchaseDate || new Date();

    let expiryDate = appleVerification.expiryDate;
    if (!expiryDate || isNaN(expiryDate.getTime())) {
      expiryDate = calculateExpiryFromMonths(purchaseDate, productConfig.months);
    }

    if (expiryDate.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired subscription.",
      });
    }

    let planDoc = await Plan.findOne({ planType: productConfig.planType });
    const planId = planDoc ? planDoc._id : new mongoose.Types.ObjectId();

    await Subscription.updateMany(
      { userId: user._id, status: "active" },
      { status: "cancelled" }
    );

    const subscription = new Subscription({
      userId: user._id,
      planId,
      planName: productConfig.planName,
      planType: productConfig.planType,
      billingCycle: productConfig.billingCycle,
      amount: productConfig.amount,
      currency: "INR",
      startDate: purchaseDate,
      expiryDate,
      status: "active",
      paymentMethod: "app_store",
      productId,
      transactionId,
      originalTransactionId: appleVerification.originalTransactionId || transactionId,
      source: source || "app_store",
      lastVerifiedAt: new Date(),
      isFreeTrial: false,
      notes: `Verified via Apple StoreKit (${productId})`,
    });

    await subscription.save();

    user.currentPlan = productConfig.planType;
    user.planStartDate = purchaseDate;
    user.planExpiryDate = expiryDate;
    user.subscriptionStatus = "active";
    user.isFreeTrialActive = false;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Subscription verified successfully.",
      isPremium: true,
      plan: productConfig.planName,
      billing: productConfig.billing,
      expiryDate: expiryDate.toISOString(),
    });
  } catch (error) {
    console.error("iOS purchase verification error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Invalid or expired subscription.",
    });
  }
};
