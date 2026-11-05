import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";
import BlacklistedToken from "../models/BlacklistedToken.js";

export const adminAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies?.adminToken) {
      token = req.cookies.adminToken;
    } else if (req.headers.cookie) {
      // Fallback simple cookie parse if cookie-parser is not present
      const match = req.headers.cookie.split(";").map(c => c.trim()).find(c => c.startsWith("adminToken="));
      if (match) token = decodeURIComponent(match.split("=")[1] || "");
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "No admin token provided" });
    }

    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ success: false, message: "Token has been invalidated. Please log in again." });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find admin by ID from the token payload
    const admin = await Admin.findById(decoded.id).select("-password");

    if (!admin || !decoded.adminId) {
      return res.status(403).json({ success: false, message: "Forbidden: Not an admin" });
    }

    // Attach admin data to the request object
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin Auth error:", error);
    res.status(401).json({ success: false, message: "Unauthorized: Invalid or expired admin token" });
  }
};
