

import nodemailer from "nodemailer";
import { getEmailConfig } from "../config/emailConfig.js";

// Create a reusable transporter
const createTransporter = () => {
  const config = getEmailConfig(process.env.EMAIL_SERVICE);
  return nodemailer.createTransport(config);
};

// Global transporter instance
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
}

function generateOTPHtml({ appName = "iimagica", otp, expiresIn = 5, supportEmail = process.env.SUPPORT_EMAIL || "support@iimagica.example", frontendUrl = process.env.FRONTEND_URL || "https://iimagica.com", appIcon = process.env.APP_ICON_URL || null }) {
  // Inline, minimal CSS to ensure consistent rendering across clients
  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${appName} — Your OTP</title>
    <style>
      body { margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#0b1020; color:#e6eef8; }
      .wrap { max-width:600px; margin:36px auto; background:linear-gradient(180deg,#071026 0%, #051021 100%); border-radius:12px; padding:28px; box-shadow:0 12px 40px rgba(2,6,23,0.6); border:1px solid rgba(255,255,255,0.03);} 
      .brand { display:flex; align-items:center; gap:12px; }
      /* logo placeholder: keep transparent so it doesn't show a grey box when no icon provided */
      .logo { width:48px; height:48px; border-radius:8px; overflow:hidden; display:inline-block; background:transparent; display:flex; align-items:center; justify-content:center }
      .logo img{ width:100%; height:100%; object-fit:contain; display:block }
      .brand strong { color: #ffffff; }
      h1 { font-size:20px; margin:10px 0 6px; color:#fff; }
      p { margin:8px 0; color:rgba(230,238,248,0.9); }
      .otp { display:block; margin:18px 0; font-size:36px; letter-spacing:6px; text-align:center; font-weight:800; color:#0b1020; background:#ffdbb7; padding:12px 8px; border-radius:8px; }
      .note { font-size:13px; color:rgba(255,255,255,0.75); }
      .actions { display:flex; justify-content:center; margin-top:16px; }
      .btn { padding:10px 16px; border-radius:8px; text-decoration:none; color:#111; background:linear-gradient(90deg,#ff7a18,#ffb86b); font-weight:700; }
      .footer { margin-top:18px; font-size:13px; color:rgba(255,255,255,0.6); }
      .muted { color:rgba(255,255,255,0.5); font-size:13px; }
      @media (max-width:480px){ .otp{font-size:28px; letter-spacing:4px} }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="brand">
        <a href="${frontendUrl}" target="_blank" rel="noreferrer" style="display:inline-flex;align-items:center;text-decoration:none;">
          <div class="logo" aria-hidden>
            ${appIcon ? `<img src="${appIcon}" alt="${appName} logo" />` : `
              <svg width="40" height="40" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${appName} logo">
                <defs>
                  <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0%" stop-color="#6a11cb"/>
                    <stop offset="100%" stop-color="#2575fc"/>
                  </linearGradient>
                </defs>
                <rect width="48" height="48" rx="10" fill="url(#g1)" />
                <text x="50%" y="55%" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="20" fill="#fff">i</text>
              </svg>
            `}
          </div>
          <div style="margin-left:12px;">
            <strong style="font-size:16px">${appName}</strong>
            <div class="muted">One-time passcode</div>
          </div>
        </a>
      </div>

      <h1>Your verification code</h1>
      <p class="note">Use the code below to complete your sign-in. This code expires in ${expiresIn} minutes and can only be used once.</p>

      <div class="otp" role="text" aria-label="Your one time code">${otp}</div>

      <div style="text-align:center;">
        <a class="btn" href="${frontendUrl}" target="_blank" rel="noreferrer">Open ${appName}</a>
      </div>

      <p class="footer">If you didn't request this code, you can safely ignore this email or <a href="mailto:${supportEmail}" style="color:rgba(255,184,77,0.95)">contact support</a>.</p>
      <p class="muted" style="margin-top:12px">This email was sent by ${appName}. For security, do not share this code.</p>
      <p style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.8)">
    </div>
  </body>
  </html>
  `;
}

export const sendOTPEmail = async (email, otp, opts = {}) => {
  if (String(process.env.EMAIL_ENABLED || "true").toLowerCase() === "false") {
    console.log(`Email disabled by EMAIL_ENABLED=false. OTP for ${email}: ${otp}`);
    return { success: true, messageId: "email-disabled", html: null };
  }

  const transporter = getTransporter();

  const appName = process.env.APP_NAME || "iimagica";
  const appIcon = process.env.APP_ICON_URL || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/$/,"")}/favicon.ico` : null);
  const html = generateOTPHtml({ appName, otp, expiresIn: opts.expiresIn || 5, supportEmail: opts.supportEmail, frontendUrl: process.env.FRONTEND_URL, appIcon });

  const mailOptions = {
    from: `"${appName}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${appName} — Your verification code`,
    text: `Your OTP is ${otp}. It will expire in ${opts.expiresIn || 5} minutes.`,
    html,
    priority: 'high',
    headers: {
      'X-Priority': '1',
      'X-MSMail-Priority': 'High',
      'Importance': 'high'
    }
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    // console.log(`OTP sent to ${email} - MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId, html };
  } catch (error) {
    console.error(`Failed to send OTP to ${email}:`, error);
    if (error?.code === "EAUTH") {
      throw new Error(
        "Email auth failed (EAUTH 535). Check EMAIL_USER and Gmail App Password (16 chars, no spaces), and ensure 2-Step Verification is enabled."
      );
    }
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

export const generateOTPEmailHtml = (opts) => generateOTPHtml(opts);