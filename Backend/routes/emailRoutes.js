import express from "express";
import { sendOTPEmail, generateOTPEmailHtml } from "../utils/sendOTPEmail.js";

const router = express.Router();

// Preview OTP HTML in browser
// GET /api/email/otp-preview?email=test%40example.com&otp=123456
router.get("/otp-preview", (req, res) => {
  const { otp = "123456", email = "user@example.com" } = req.query;
  const html = generateOTPEmailHtml({ appName: process.env.APP_NAME || "iimagica", otp, frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173", appIcon: process.env.APP_ICON_URL || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/$/,"")}/favicon.ico` : null) });
  res.setHeader("Content-Type", "text/html");
  return res.send(html);
});

// Send OTP via email (for testing)
// POST /api/email/send-otp  { email: "user@example.com", otp: "123456" }
router.post("/send-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "email and otp are required" });
  try {
    const result = await sendOTPEmail(email, otp, { expiresIn: 5 });
    return res.json({ sent: true, result });
  } catch (err) {
    console.error("send-otp error", err);
    return res.status(500).json({ error: "failed to send" });
  }
});

export default router;
