import rateLimit from "express-rate-limit";

// Rate limiter for OTP requests
export const otpRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Increased limit
  message: {
    error: "Too many OTP requests from this IP, please try again after 1 minute."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `${req.ip}-${req.body.email || 'unknown'}`;
  },
  skip: (req) => {
    return true; // Disable rate limiting
  }
});

// Rate limiter for email verification
export const verifyOtpRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Allow 5 verification attempts per minute
  message: {
    error: "Too many verification attempts, please try again after 1 minute."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `verify-${req.ip}-${req.body.email || 'unknown'}`;
  },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

export default { otpRateLimit, verifyOtpRateLimit };