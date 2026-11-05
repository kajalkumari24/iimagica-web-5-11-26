import User from "../models/User.js";
import jwt from "jsonwebtoken";
import BlacklistedToken from "../models/BlacklistedToken.js";
import Profile from "../models/Profile.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendOTPEmail } from "../utils/sendOTPEmail.js";
import { sendWhatsAppOTP } from "../utils/sendWhatsAppOTP.js";
import { normalizePhoneNumber } from "../utils/phone.js";
import UserAuthAuditLog from "../models/UserAuthAuditLog.js";
import RefreshToken from "../models/RefreshToken.js";
import crypto from 'crypto';
import { createHash } from 'crypto';
import { parseDurationToMs } from "../utils/parseDuration.js";
import { startFreeTrial } from "./subscriptionController.js";
import { deleteUserAccount } from "../services/userService.js";

const DEMO_ACCOUNT_EMAIL = process.env.DEMO_ACCOUNT_EMAIL || 'demo@gmail.com';
const DEMO_ACCOUNT_OTP = process.env.DEMO_ACCOUNT_OTP || '1234';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN; // must be provided via env
const JWT_COOKIE_MAXAGE_MS = parseDurationToMs(JWT_EXPIRES_IN, 15 * 60 * 1000);
const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS || '7', 10);
const REFRESH_TOKEN_MS = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000;
const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '5', 10);
const ENABLE_DEMO_IN_PROD = String(process.env.ENABLE_DEMO_IN_PROD || 'false').toLowerCase() === 'true';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || "91";

const isProduction = process.env.NODE_ENV === "production";

const userCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "None" : "Lax",  // 🔥 production me None
  secure: isProduction ? true : false,      // 🔥 HTTPS me true
};

const userClearCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? "None" : "Lax",
  secure: isProduction ? true : false,
};

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set in environment variables. JWT signing will fail in production.');
}
if (!JWT_EXPIRES_IN) {
  console.warn('Warning: JWT_EXPIRES_IN is not set. Tokens will be created without expiry unless you set this env variable.');
}

const logUserAuth = async (req, userId, email, action, meta = {}) => {
  try {
    await UserAuthAuditLog.create({
      userId,
      email,
      action,
      ip: req.ip,
      userAgent: req.get("user-agent") || "",
      meta,
    });
  } catch (err) {
    console.warn("User auth audit log failed:", err?.message || err);
  }
};

const getProfileForUser = async (user) => {
  if (!user?._id) return null;
  return Profile.findOne({
    $or: [{ userId: user._id }, ...(user.email ? [{ email: user.email }] : [])],
  });
};

const resolveOtpTarget = (payload = {}) => {
  const email = String(payload.email || "").trim().toLowerCase();
  const phone = payload.phone
    ? normalizePhoneNumber(payload.phone, DEFAULT_COUNTRY_CODE)
    : undefined;
  const requestedChannel = String(payload.channel || "").trim().toLowerCase();
  const channel =
    requestedChannel === "whatsapp" || requestedChannel === "email"
      ? requestedChannel
      : phone
        ? "whatsapp"
        : "email";
  return { email, phone, channel };
};

const findOtpUser = async ({ email, phone }) => {
  if (email && phone) {
    const users = await User.find({ $or: [{ email }, { phone }] });
    const userByEmail = users.find((user) => String(user.email || "").toLowerCase() === email);
    const userByPhone = users.find((user) => String(user.phone || "") === phone);

    if (userByEmail && userByPhone && String(userByEmail._id) !== String(userByPhone._id)) {
      const error = new Error("Email and mobile number belong to different accounts");
      error.statusCode = 409;
      throw error;
    }

    return userByEmail || userByPhone || null;
  }

  return User.findOne(email ? { email } : { phone });
};

export const issueUserSession = async (res, user, remember = true) => {
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  const refreshHash = createHash("sha256").update(refreshToken).digest("hex");

  await RefreshToken.create({
    userId: user._id,
    tokenHash: refreshHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_MS),
  });

  const cookieOptions = {
    ...userCookieOptions,
    ...(remember ? { maxAge: JWT_COOKIE_MAXAGE_MS } : {}),
  };

  res.cookie("userToken", token, cookieOptions);
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MS });

  // 🟢 Live update Admin Panel that a user just logged in or registered
  if (global.io && user && user._id) {
    global.io.emit("userUpdated");
    global.io.emit("user_online", String(user._id));
  }

  return { token, refreshToken };
};

const verifyGoogleToken = async (idToken) => {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!response.ok) {
    throw new Error("Invalid Google token");
  }

  const payload = await response.json();
  const validIssuer =
    payload.iss === "accounts.google.com" || payload.iss === "https://accounts.google.com";

  if (!validIssuer || payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error("Google token audience mismatch");
  }

  if (String(payload.email_verified).toLowerCase() !== "true") {
    throw new Error("Google account email is not verified");
  }

  return payload;
};

export const requestOTP = async (req, res) => {
  try {
    const { email, phone, channel } = resolveOtpTarget(req.body);
    if (!email && !phone) {
      return res.status(400).json({ message: "Email or mobile number is required" });
    }

    let user = await findOtpUser({ email, phone });
    const MIN_SECONDS_BETWEEN_OTPS = 30;
    const now = Date.now();

    if (user && user.lastOtpSentAt && now - new Date(user.lastOtpSentAt).getTime() < MIN_SECONDS_BETWEEN_OTPS * 1000) {
      return res.status(429).json({ message: `Please wait ${MIN_SECONDS_BETWEEN_OTPS} seconds before requesting again` });
    }

    const isDemo = email && String(email).toLowerCase() === String(DEMO_ACCOUNT_EMAIL).toLowerCase()
      && (process.env.NODE_ENV !== 'production' || ENABLE_DEMO_IN_PROD);
    const otp = isDemo ? DEMO_ACCOUNT_OTP : generateOTP();
    const otpExpiry = isDemo ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);

    if (user) {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.forceOTP = false;
      user.lastOtpSentAt = new Date();
      user.otpVerifyAttempts = 0;
      user.otpVerifyWindowStart = null;
      user.otpLockedUntil = null;
      if (email) user.email = email;
      if (phone && channel === "whatsapp") {
        user.phone = phone;
        user.authProvider = "phone";
      } else if (email && channel === "email") {
        user.authProvider = "email";
      }
      await user.save();
    } else {
      const userData = {
        otp,
        otpExpiry,
        lastOtpSentAt: new Date(),
        authProvider: channel === "whatsapp" ? "phone" : "email",
      };

      if (email) userData.email = email;
      if (phone) userData.phone = phone;

      user = await User.create(userData);
    }

    let deliveryChannel = channel;
    let destination = channel === "whatsapp" ? phone : email;
    let deliveryMessage = channel === "whatsapp" ? "OTP sent on WhatsApp successfully" : "OTP sent successfully";

    if (!isDemo) {
      if (deliveryChannel === "whatsapp") {
        try {
          await sendWhatsAppOTP(phone, otp, { expiresIn: OTP_EXPIRES_MINUTES });
          // console.log(`WhatsApp OTP accepted by Meta API for ${phone}: ${otp}`);
        } catch (whatsAppError) {
          console.error("WhatsApp sending failed:", whatsAppError);

          if (!email) {
            // console.log(`OTP for ${phone}: ${otp} (WhatsApp failed, no email fallback)`);
            return res.status(502).json({
              message:
                process.env.NODE_ENV !== "production"
                  ? `WhatsApp API Error: ${whatsAppError.message}`
                  : "Failed to send OTP on WhatsApp. Check WhatsApp API configuration and approved template.",
            });
          }

          try {
            await sendOTPEmail(email, otp, { expiresIn: OTP_EXPIRES_MINUTES });
            deliveryChannel = "email";
            destination = email;
            deliveryMessage = "WhatsApp unavailable. OTP sent to email successfully";
            // console.log(`OTP fallback sent to ${email}: ${otp}`);
          } catch (emailError) {
            console.error("Email fallback failed:", emailError);
            return res.status(502).json({
              message:
                process.env.NODE_ENV !== "production"
                  ? `WhatsApp API Error: ${whatsAppError.message}. Email fallback also failed: ${emailError.message}`
                  : "Failed to send OTP. Email fallback also failed.",
            });
          }
        }
      } else {
        try {
          await sendOTPEmail(email, otp, { expiresIn: OTP_EXPIRES_MINUTES });
          // console.log(`OTP sent to ${email}: ${otp}`);
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
          return res.status(502).json({
            message:
              process.env.NODE_ENV !== "production"
                ? `Email delivery failed: ${emailError.message}`
                : "Failed to send OTP email",
          });
        }
      }
    } else {
      // console.log(`Demo OTP for ${destination}: ${otp}`);
    }

    req.session.otpIdentifier = destination;
    req.session.otpChannel = deliveryChannel;

    await logUserAuth(req, user?._id, destination, "otp_requested", { channel: deliveryChannel });
    // For demo accounts return OTP in response to simplify testing (enabled via env)
    if (isDemo) {
      return res.status(200).json({
        message: deliveryMessage,
        otp,
        channel: deliveryChannel,
        destination,
      });
    }
    return res.status(200).json({
      message: deliveryMessage,
      channel: deliveryChannel,
      destination,
    });
  } catch (error) {
    console.error("Request OTP error:", error);
    return res.status(error.statusCode || 500).json({
      message: process.env.NODE_ENV !== "production"
        ? (error?.message || "Failed to send OTP")
        : "Failed to send OTP",
    });
  }
};

// ---------------- Verify OTP ----------------
export const verifyOTP = async (req, res) => {
  try {
    const { otp, remember = true } = req.body;
    const { email, phone, channel } = resolveOtpTarget(req.body);
    if (!email && !phone) return res.status(400).json({ message: "Email or mobile number is required" });

    const identifier = channel === "whatsapp" ? phone : email || phone;
    const isDemo = email && String(email).toLowerCase() === String(DEMO_ACCOUNT_EMAIL).toLowerCase()
      && (process.env.NODE_ENV !== 'production' || ENABLE_DEMO_IN_PROD);

    let user = await findOtpUser({ email, phone });
    if (!user) {
      if (isDemo) {
        const userData = {
          emailVerified: true,
          phoneVerified: !!phone,
          profileCompleted: true,
          authProvider: phone ? "phone" : "email",
          role: process.env.DEMO_ACCOUNT_ROLE || "user",
          status: "active",
        };

        if (email) userData.email = email;
        if (phone) userData.phone = phone;

        user = await User.create(userData);
      } else {
        await logUserAuth(req, null, identifier, "otp_failed", { reason: "user_not_found", channel });
        return res.status(404).json({ message: "User not found" });
      }
    }

    // Demo shortcut: accept fixed OTP regardless of stored otp/expiry
    if (isDemo && String(otp).trim() === String(DEMO_ACCOUNT_OTP).trim()) {
      user.otp = null;
      user.otpExpiry = null;
      user.lastLoginAt = new Date();
      user.lastActiveAt = new Date();
      user.loginCount = (user.loginCount || 0) + 1;
      if (channel === "whatsapp") {
        user.phone = phone;
        user.phoneVerified = true;
        user.authProvider = "phone";
      } else {
        user.email = email;
        user.emailVerified = true;
        user.authProvider = user.authProvider === "google" ? user.authProvider : "email";
      }
      user.otpVerifyAttempts = 0;
      user.otpVerifyWindowStart = null;
      user.otpLockedUntil = null;
      await user.save();

      const { token, refreshToken } = await issueUserSession(res, user, remember);

      const profile = await getProfileForUser(user);
      const isNewUser = !profile;

      await logUserAuth(req, user._id, identifier, "otp_verified_demo", { channel });
      return res.status(200).json({
        message: "OTP verified successfully (demo)",
        token,
        refreshToken,
        email: user.email,
        role: user.role,
        isNewUser,
      });
    }

    const now = Date.now();
    if (user.otpLockedUntil && now < new Date(user.otpLockedUntil).getTime()) {
      await logUserAuth(req, user._id, identifier, "otp_failed", { reason: "locked", channel });
      return res.status(429).json({ message: "Too many attempts. Please try again later." });
    }

    if (!user.otp || !user.otpExpiry || Date.now() > user.otpExpiry.getTime()) {
      await logUserAuth(req, user._id, identifier, "otp_failed", { reason: "expired", channel });
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    if (String(user.otp).trim() !== String(otp).trim()) {
      const WINDOW_MS = 10 * 60 * 1000;
      const MAX_ATTEMPTS = 5;
      const LOCK_MS = 10 * 60 * 1000;

      const windowStart = user.otpVerifyWindowStart
        ? new Date(user.otpVerifyWindowStart).getTime()
        : null;
      if (!windowStart || now - windowStart > WINDOW_MS) {
        user.otpVerifyWindowStart = new Date(now);
        user.otpVerifyAttempts = 0;
      }

      user.otpVerifyAttempts = (user.otpVerifyAttempts || 0) + 1;

      if (user.otpVerifyAttempts >= MAX_ATTEMPTS) {
        user.otpLockedUntil = new Date(now + LOCK_MS);
        user.otpVerifyAttempts = 0;
        user.otpVerifyWindowStart = null;
      }

      await user.save();
      await logUserAuth(req, user._id, identifier, "otp_failed", { reason: "invalid_otp", channel });
      return res.status(400).json({ message: "Invalid OTP" });
    }

    user.otp = null;
    user.otpExpiry = null;
    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    if (channel === "whatsapp") {
      user.phone = phone;
      user.phoneVerified = true;
      user.authProvider = "phone";
    } else {
      user.email = email;
      user.emailVerified = true;
      user.authProvider = user.authProvider === "google" ? user.authProvider : "email";
    }
    user.otpVerifyAttempts = 0;
    user.otpVerifyWindowStart = null;
    user.otpLockedUntil = null;
    await user.save();

    const { token, refreshToken } = await issueUserSession(res, user, remember);

    const profile = await getProfileForUser(user);
    const isNewUser = !profile;

    // Start free trial for new users
    if (isNewUser && !user.isFreeTrialActive && !user.freeTrialStartDate) {
      try {
        // Create a mock request object for the subscription controller
        const mockReq = { user: { _id: user._id } };
        const mockRes = {
          status: () => ({ json: () => { } }),
          json: () => { }
        };
        await startFreeTrial(mockReq, mockRes);
        // Refresh user data to get updated trial info
        user = await User.findById(user._id);
      } catch (trialError) {
        console.error("Failed to start free trial:", trialError);
        // Don't fail the login if trial start fails
      }
    }

    await logUserAuth(req, user._id, identifier, "otp_verified", { channel });
    return res.status(200).json({
      message: "OTP verified successfully",
      token,
      refreshToken,
      email: user.email,
      role: user.role,
      isNewUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Internal server error" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { credential, remember = true } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const payload = await verifyGoogleToken(credential);
    const email = payload.email
      ? String(payload.email).trim().toLowerCase()
      : undefined;

    if (!email) {
      return res.status(400).json({ message: "Google account email is missing" });
    }

    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email }],
    });

    if (!user) {
      user = await User.create({
        email,
        googleId: payload.sub,
        authProvider: "google",
        name: payload.name || "",
        avatar: payload.picture || "",
        emailVerified: true,
      });
    } else {
      user.googleId = payload.sub;
      user.authProvider = "google";
      user.email = user.email || email;
      user.name = payload.name || user.name || "";
      user.avatar = payload.picture || user.avatar || "";
      user.emailVerified = true;
    }

    user.lastLoginAt = new Date();
    user.lastActiveAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    await user.save();

    const { token, refreshToken } = await issueUserSession(res, user, remember);
    const profile = await getProfileForUser(user);
    const isNewUser = !profile;

    // Start free trial for new users
    if (isNewUser && !user.isFreeTrialActive && !user.freeTrialStartDate) {
      try {
        // Create a mock request object for the subscription controller
        const mockReq = { user: { _id: user._id } };
        const mockRes = {
          status: () => ({ json: () => { } }),
          json: () => { }
        };
        await startFreeTrial(mockReq, mockRes);
        // Refresh user data to get updated trial info
        user = await User.findById(user._id);
      } catch (trialError) {
        console.error("Failed to start free trial:", trialError);
        // Don't fail the login if trial start fails
      }
    }

    await logUserAuth(req, user._id, user.email, "google_login");

    return res.status(200).json({
      message: "Google login successful",
      token,
      refreshToken,
      email: user.email,
      role: user.role,
      isNewUser,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Google login error:", error?.message || error);
    const statusCode =
      error?.message === "GOOGLE_CLIENT_ID is not configured"
        ? 500
        : 401;
    return res.status(statusCode).json({ message: error?.message || "Google login failed" });
  }
};

import admin from "firebase-admin";

// ================= PHONE LOGIN =================

const formatPhone = (phone) => phone?.replace(/\D/g, "");

export const phoneLogin = async (req, res) => {
  try {
    const { token, phone: inputPhone } = req.body;

    let phone;

    //  LIVE MODE (WhatsApp Custom Phone Flow)
    if (!token) {
      if (!inputPhone) {
        return res.status(400).json({ message: "Phone number required" });
      }

      phone = formatPhone(inputPhone);

      if (phone.length < 10) {
        return res.status(400).json({ message: "Invalid phone number" });
      }
    }

    // 🔒 FALLBACK: PRODUCTION MODE (Firebase)
    else {
      if (!token) {
        return res.status(400).json({ message: "Firebase token required" });
      }

      const decoded = await admin.auth().verifyIdToken(token);

      phone = formatPhone(decoded.phone_number);

      if (!phone) {
        return res.status(400).json({ message: "Invalid phone number" });
      }
    }

    // ✅ ATOMIC USER CREATE / UPDATE (NO DUPLICATE)
    let user = await User.findOneAndUpdate(
      { phone },
      {
        $setOnInsert: {
          phone,
          phoneVerified: true,
          authProvider: "phone"
        },
        $set: {
          lastLoginAt: new Date(),
          lastActiveAt: new Date(),
          phoneVerified: true
        },
        $inc: {
          loginCount: 1
        }
      },
      {
        new: true,
        upsert: true
      }
    );

    const profile = await getProfileForUser(user);
    const isNewUser = !profile;

    if (isNewUser && !user.isFreeTrialActive && !user.freeTrialStartDate) {
      try {
        const mockReq = { user: { _id: user._id } };
        const mockRes = {
          status: () => ({ json: () => { } }),
          json: () => { }
        };
        await startFreeTrial(mockReq, mockRes);
        user = await User.findById(user._id);
      } catch (trialError) {
        console.error("Failed to start free trial for phone login:", trialError);
      }
    }

    const { token: accessToken, refreshToken } = await issueUserSession(res, user, true);
    // await logUserAuth(req, user._id, user.phone, "phone_login");

    return res.status(200).json({
      message: "Phone login successful",
      token: accessToken,
      refreshToken,
      isNewUser,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        email: user.email || "",
      }
    });

  } catch (error) {
    console.error("Phone login error:", error?.message || error);
    return res.status(500).json({ message: "Phone login failed" });
  }
};
// ---------------- Resend OTP ----------------
export const resendOTP = async (req, res) => {
  try {
    const sessionIdentifier = req.session.otpIdentifier;
    const sessionChannel = req.session.otpChannel;
    const { email, phone, channel } = resolveOtpTarget({
      email: req.body.email,
      phone: req.body.phone,
      channel: req.body.channel || sessionChannel,
    });
    const identifier = email || phone || sessionIdentifier;
    const resolvedChannel = channel || sessionChannel || (phone ? "whatsapp" : "email");
    if (!identifier) return res.status(400).json({ message: "Email or mobile number is required" });

    const userQuery =
      resolvedChannel === "email"
        ? { email: email || sessionIdentifier }
        : { phone: phone || sessionIdentifier };

    const user = await User.findOne(userQuery);
    if (!user) {
      await logUserAuth(req, null, identifier, "otp_resend_failed", { reason: "user_not_found", channel: resolvedChannel });
      return res.status(404).json({ message: "User not found" });
    }

    // Rate-limit resend: avoid sending multiple OTPs in quick succession
    const MIN_SECONDS_BETWEEN_OTPS = 30;
    const now = Date.now();
    if (user.lastOtpSentAt && now - new Date(user.lastOtpSentAt).getTime() < MIN_SECONDS_BETWEEN_OTPS * 1000) {
      return res.status(200).json({ message: `OTP already sent recently. Please wait ${MIN_SECONDS_BETWEEN_OTPS} seconds before resending.` });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    user.lastOtpSentAt = new Date();
    await user.save();

    let deliveryChannel = resolvedChannel;
    let deliveryMessage = deliveryChannel === "whatsapp"
      ? "WhatsApp OTP resent successfully"
      : "OTP resent successfully";

    try {
      if (deliveryChannel === "whatsapp") {
        await sendWhatsAppOTP(user.phone, otp, { expiresIn: OTP_EXPIRES_MINUTES });
        // console.log(`WhatsApp OTP resend accepted by Meta API for ${user.phone}: ${otp}`);
      } else {
        await sendOTPEmail(user.email, otp, { expiresIn: OTP_EXPIRES_MINUTES });
        // console.log(`OTP resent to ${user.email}: ${otp}`);
      }
    } catch (deliveryError) {
      console.error("Resend OTP delivery failed:", deliveryError?.message || deliveryError);
      if (deliveryChannel === "whatsapp" && user.email) {
        try {
          await sendOTPEmail(user.email, otp, { expiresIn: OTP_EXPIRES_MINUTES });
          deliveryChannel = "email";
          deliveryMessage = "WhatsApp unavailable. OTP resent to email successfully";
        } catch (emailError) {
          return res.status(502).json({
            message: process.env.NODE_ENV !== "production"
              ? `WhatsApp API Error: ${deliveryError.message}. Email fallback also failed: ${emailError.message}`
              : "Failed to resend OTP. Email fallback also failed.",
          });
        }
      } else {
        return res.status(502).json({
          message: deliveryChannel === "whatsapp"
            ? (process.env.NODE_ENV !== "production" ? `WhatsApp API Error: ${deliveryError.message}` : "Failed to resend WhatsApp OTP")
            : "Failed to resend OTP email",
        });
      }
    }

    req.session.otpIdentifier = deliveryChannel === "whatsapp" ? user.phone : user.email;
    req.session.otpChannel = deliveryChannel;

    await logUserAuth(req, user._id, identifier, "otp_resent", { channel: deliveryChannel });
    return res.status(200).json({
      message: deliveryMessage,
      channel: deliveryChannel,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({ message: error.message || "Internal server error" });
  }
};

// ---------------- Auto Login (JWT Verify) ----------------
export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-otp -otpExpiry");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// ---------------- Update FCM Token ----------------
export const updateFCMToken = async (req, res) => {
  try {
    const fcmToken = String(req.body?.fcmToken || "").trim();
    const userId = req.user.id || req.user._id; // JWT middleware से आएगा

    if (!(req.user?.id || req.user?._id)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!fcmToken) {
      return res.status(400).json({ success: false, message: "FCM token is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true }
    ).select("-otp -otpExpiry");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    return res.status(200).json({
      success: true,
      message: "FCM token updated successfully",
      data: {
        userId: String(user._id),
        fcmToken: user.fcmToken,
      },
    });
  } catch (error) {
    console.error("Update FCM Token error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ---------------- Logout ----------------
// controllers/userController.js


export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const refreshTokenFromCookie = req.cookies?.refreshToken || req.body?.refreshToken;
    let logoutUserId = null;
    let logoutUserEmail = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.decode(token);

      if (decoded?.exp) {
        await BlacklistedToken.create({
          token,
          expiresAt: new Date(decoded.exp * 1000),
        });
      }

      if (decoded?.id) {
        await User.findByIdAndUpdate(decoded.id, { forceOTP: true, lastActiveAt: null });
        logoutUserId = decoded.id;
      }
      if (decoded?.email) logoutUserEmail = decoded.email;
    }

    if (req.cookies?.userToken) {
      const decoded = jwt.decode(req.cookies.userToken);
      if (decoded?.exp) {
        await BlacklistedToken.create({
          token: req.cookies.userToken,
          expiresAt: new Date(decoded.exp * 1000),
        });
      }
      if (decoded?.id) {
        await User.findByIdAndUpdate(decoded.id, { forceOTP: true, lastActiveAt: null });
        logoutUserId = decoded.id;
      }
      if (decoded?.email) logoutUserEmail = decoded.email;
    }

    // Invalidate refresh token(s) so session cannot auto-refresh after logout.
    if (refreshTokenFromCookie) {
      try {
        const hash = createHash('sha256').update(refreshTokenFromCookie).digest('hex');
        await RefreshToken.deleteOne({ tokenHash: hash });
      } catch (e) {
        // fallback: remove any matching field if schema still contains raw token
        await RefreshToken.deleteOne({ token: refreshTokenFromCookie });
      }
    }
    // 🚀 FIX: Do not delete all refresh tokens for the user to support multi-device login/logout.
    // if (logoutUserId) {
    //   await RefreshToken.deleteMany({ userId: logoutUserId });
    // }

    const finalizeLogout = () => {
      res.clearCookie("connect.sid");
      res.clearCookie("userToken", userClearCookieOptions);
      res.clearCookie("refreshToken", userClearCookieOptions);
      logUserAuth(req, logoutUserId, logoutUserEmail, "logout");
    if (global.io && logoutUserId) {
      global.io.emit("user_offline", String(logoutUserId));
      global.io.emit("userUpdated"); // Refresh admin table on logout
    }
      return res.status(200).json({
        success: true,
        message: "Logged out successfully.",
      });
    };

    if (req.session && typeof req.session.destroy === "function") {
      req.session.destroy(() => finalizeLogout());
      return;
    }

    return finalizeLogout();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "Refresh token required" });

    const presentedToken = refreshToken;
    const presentedHash = createHash('sha256').update(String(presentedToken)).digest('hex');
    const tokenDoc = await RefreshToken.findOne({ tokenHash: presentedHash });
    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      if (tokenDoc) await RefreshToken.deleteOne({ _id: tokenDoc._id });
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
      // rotate refresh token: generate new, replace hash and expiry
    // const newRefreshToken = crypto.randomBytes(40).toString('hex');
    // const newRefreshHash = createHash('sha256').update(newRefreshToken).digest('hex');
    // tokenDoc.tokenHash = newRefreshHash;
    // 🚀 FIX: Token rotation removed to prevent race conditions during concurrent requests.
    const newRefreshToken = presentedToken;
    tokenDoc.expiresAt = new Date(Date.now() + REFRESH_TOKEN_MS);
    await tokenDoc.save();

    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie("userToken", newAccessToken, {
      ...userCookieOptions,
      maxAge: JWT_COOKIE_MAXAGE_MS
    });
    // set raw refresh token cookie (HttpOnly)
    res.cookie("refreshToken", newRefreshToken, { ...userCookieOptions, maxAge: REFRESH_TOKEN_MS });

    return res.status(200).json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ---------------- Delete Account ----------------
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: User ID not found" });
    }

    // 1. Get and blacklist the current JWT access token to invalidate the session immediately
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.headers["x-auth-token"]) {
      token = req.headers["x-auth-token"];
    } else if (req.headers["x-access-token"]) {
      token = req.headers["x-access-token"];
    } else if (req.cookies?.userToken) {
      token = req.cookies.userToken;
    }

    if (token) {
      const decoded = jwt.decode(token);
      if (decoded?.exp) {
        await BlacklistedToken.create({
          token,
          expiresAt: new Date(decoded.exp * 1000),
        });
      }
    }

    // 2. Perform cascade deletions across all database collections and delete ImageKit files
    await deleteUserAccount(userId);

    // 3. Clear cookies on response
    res.clearCookie("connect.sid");
    res.clearCookie("userToken", userClearCookieOptions);
    res.clearCookie("refreshToken", userClearCookieOptions);

    // 4. Emit live update events via Socket.IO
    if (global.io) {
      global.io.emit("user_offline", String(userId));
      global.io.emit("userUpdated");
    }

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete user account controller error:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};