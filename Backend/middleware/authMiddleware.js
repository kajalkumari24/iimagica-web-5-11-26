
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import BlacklistedToken from "../models/BlacklistedToken.js";

const authCookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  secure: process.env.NODE_ENV === "production",
};

const clearAuthCookies = (res) => {
  res.clearCookie("userToken", authCookieOptions);
  res.clearCookie("refreshToken", authCookieOptions);
};

export const authMiddleware = async (req, res, next) => {
  try {
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
    } else if (req.headers.cookie) {
      // Fallback simple cookie parse if cookie-parser is not present
      const match = req.headers.cookie.split(";").map(c => c.trim()).find(c => c.startsWith("userToken="));
      if (match) token = decodeURIComponent(match.split("=")[1] || "");
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      clearAuthCookies(res);
      return res.status(401).json({ success: false, message: "Token has been invalidated. Please log in again." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach full user data to the request object
    const user = await User.findById(decoded.id).select("-otp -otpExpiry -password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Track user activity (debounce to 2 minutes to reduce DB load)
    const now = new Date();
    if (!user.lastActiveAt || (now.getTime() - new Date(user.lastActiveAt).getTime() > 2 * 60 * 1000)) {
      User.updateOne({ _id: user._id }, { $set: { lastActiveAt: now } }).exec();
      user.lastActiveAt = now;
    }

    req.user = user;
    next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      // Do NOT clear cookies here — let the frontend use refreshToken to silently refresh
      // console.warn("Auth token expired:", error.message);
    } else if (error?.name === "JsonWebTokenError") {
      // Invalid/tampered token — safe to clear
      clearAuthCookies(res);
      console.warn("Auth token invalid:", error.message);
    } else {
      console.error("Auth error:", error);
    }
    res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired token" });
  }
};