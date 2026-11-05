import crypto from "crypto";
import Plan from "../models/Plan.js";
import Subscription from "../models/Subscription.js";
import User from "../models/User.js";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

const getBasicAuthHeader = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
};

const normalizeBillingLabel = (value = "") => {
  const lower = String(value).toLowerCase();
  if (lower.includes("half")) return "Half-Yearly";
  if (lower.includes("year") || lower.includes("annual")) return "Annually";
  if (lower.includes("quarter")) return "Quarterly";
  return "Monthly";
};

const calculateExpiryDate = (billing = "", startDate = new Date()) => {
  const lower = String(billing).toLowerCase();
  const startTime = startDate.getTime();

  if (lower.includes("half")) return new Date(startTime + 180 * 24 * 60 * 60 * 1000);
  if (lower.includes("year") || lower.includes("annual")) return new Date(startTime + 365 * 24 * 60 * 60 * 1000);
  if (lower.includes("quarter")) return new Date(startTime + 90 * 24 * 60 * 60 * 1000);
  return new Date(startTime + 30 * 24 * 60 * 60 * 1000);
};

const getEffectiveSubscriptionBaseDate = (user, now = new Date()) => {
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchRazorpayPayment = async (paymentId) => {
  const response = await fetch(`${RAZORPAY_API_BASE}/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.description || "Failed to fetch Razorpay payment");
  }

  return data;
};

const captureRazorpayPayment = async (paymentId, amount, currency = "INR") => {
  const response = await fetch(`${RAZORPAY_API_BASE}/payments/${paymentId}/capture`, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, currency }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.description || "Failed to capture Razorpay payment");
  }

  return data;
};

const settleRazorpayPayment = async (paymentId, expectedAmount) => {
  let payment = await fetchRazorpayPayment(paymentId);

  if (payment.status === "captured") {
    return payment;
  }

  if (Number(payment.amount) !== expectedAmount) {
    throw new Error("Payment amount mismatch");
  }

  if (payment.status === "authorized") {
    try {
      payment = await captureRazorpayPayment(paymentId, expectedAmount, payment.currency || "INR");
    } catch (error) {
      const message = String(error.message || "");
      const alreadyCaptured = message.toLowerCase().includes("already been captured");
      if (!alreadyCaptured) {
        throw error;
      }
    }
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    payment = await fetchRazorpayPayment(paymentId);
    if (payment.status === "captured") {
      return payment;
    }
    if (payment.status === "failed") {
      throw new Error(payment.error_description || "Payment failed on Razorpay");
    }
    await sleep(1200);
  }

  return payment;
};

export const createCheckoutOrder = async (req, res) => {
  try {
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: "Plan ID is required" });
    }

    const plan = await Plan.findById(planId);
    if (!plan || plan.isActive === false) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const amount = Math.round(Number(plan.price || 0) * 100);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid plan amount" });
    }

    const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
      method: "POST",
      headers: {
        Authorization: getBasicAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `plan_${plan._id}_${Date.now()}`.slice(0, 40),
        notes: {
          planId: String(plan._id),
          planType: plan.planType,
          billing: normalizeBillingLabel(plan.billing),
          customerId: String(req.user?._id || ""),
          customerEmail: req.user?.email || "",
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: data?.error?.description || "Failed to create Razorpay order",
      });
    }

    return res.status(200).json({
      success: true,
      order: data,
      plan: {
        id: plan._id,
        name: plan.name,
        planType: plan.planType,
        billing: normalizeBillingLabel(plan.billing),
        duration: plan.duration,
        amount,
        price: plan.price,
      },
      user: {
        name: req.user?.email?.split("@")[0] || "Customer",
        email: req.user?.email || "",
        contact: req.user?.phone || "",
      },
    });
  } catch (error) {
    console.error("Create checkout order error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create checkout order",
    });
  }
};

export const verifyCheckoutPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: "Payment verification data is required" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, message: "Razorpay secret is not configured" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    if (!planId) {
      return res.status(400).json({ success: false, message: "Plan ID is required" });
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const plan = await Plan.findById(planId).select("name planType billing duration price isActive");
    if (!plan || plan.isActive === false) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const expectedAmount = Math.round(Number(plan.price || 0) * 100);
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid plan amount" });
    }

    const existingSubscription = await Subscription.findOne({
      userId: user._id,
      razorpayPaymentId: razorpay_payment_id,
    }).populate("planId", "name planType billing duration price");

    if (existingSubscription) {
      return res.status(200).json({
        success: true,
        message: "Payment already verified successfully",
        payment: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
        },
        plan: existingSubscription.planId,
        user: {
          id: user._id,
          email: user.email || "",
        },
      });
    }

    let payment = await fetchRazorpayPayment(razorpay_payment_id);

    if (payment.order_id !== razorpay_order_id) {
      return res.status(400).json({ success: false, message: "Payment does not match the provided order" });
    }

    if (Number(payment.amount) !== expectedAmount) {
      return res.status(400).json({ success: false, message: "Payment amount mismatch" });
    }

    payment = await settleRazorpayPayment(razorpay_payment_id, expectedAmount);

    if (payment.status !== "captured") {
      return res.status(400).json({
        success: false,
        message: payment.error_description || `Payment is not captured. Current status: ${payment.status}`,
      });
    }

    const now = new Date();
    const subscriptionBaseDate = getEffectiveSubscriptionBaseDate(user, now);
    const expiryDate = calculateExpiryDate(plan.billing, subscriptionBaseDate);

    await Subscription.updateMany(
      { userId: user._id, status: "active" },
      { status: "cancelled" }
    );

    const subscription = await Subscription.create({
      userId: user._id,
      planId: plan._id,
      planName: plan.name,
      planType: plan.planType,
      billingCycle: plan.billing,
      amount: Number(plan.price),
      currency: payment.currency || "INR",
      startDate: now,
      expiryDate,
      status: "active",
      paymentMethod: "razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      isFreeTrial: false,
      notes: `Paid via Razorpay (${payment.method || "unknown"})`,
    });

    user.currentPlan = plan.planType;
    user.planStartDate = now;
    user.planExpiryDate = expiryDate;
    user.subscriptionStatus = "active";
    user.isFreeTrialActive = false;
    // Do NOT null out freeTrialStartDate — it tracks that user already used their trial
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: payment.status,
      },
      plan: {
        id: plan._id,
        name: plan.name,
        planType: plan.planType,
        billing: normalizeBillingLabel(plan.billing),
        duration: plan.duration,
        price: plan.price,
      },
      subscription: {
        id: subscription._id,
        startDate: subscription.startDate,
        expiryDate: subscription.expiryDate,
        status: subscription.status,
      },
      user: {
        id: user._id,
        email: user.email || "",
      },
    });
  } catch (error) {
    console.error("Verify checkout payment error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};
