import nodemailer from "nodemailer";

// Email service configurations for different providers
const emailConfigs = {
  gmail: {
    service: "gmail",
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  },
  
  // For better performance, consider using dedicated email services
  sendgrid: {
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false,
    pool: true,
    maxConnections: 10,
    maxMessages: 200,
    rateDelta: 1000,
    rateLimit: 10,
    connectionTimeout: 5000,
    greetingTimeout: 3000,
    socketTimeout: 5000,
  },
  
  mailgun: {
    host: "smtp.mailgun.org",
    port: 587,
    secure: false,
    pool: true,
    maxConnections: 10,
    maxMessages: 200,
    rateDelta: 1000,
    rateLimit: 10,
    connectionTimeout: 5000,
    greetingTimeout: 3000,
    socketTimeout: 5000,
  },
  
  ses: {
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 587,
    secure: false,
    pool: true,
    maxConnections: 10,
    maxMessages: 200,
    rateDelta: 1000,
    rateLimit: 10,
    connectionTimeout: 5000,
    greetingTimeout: 3000,
    socketTimeout: 5000,
  }
};

export const getEmailConfig = (service = "gmail") => {
  const config = emailConfigs[service.toLowerCase()] || emailConfigs.gmail;
  const normalizedService = String(service || "gmail").toLowerCase();
  const rawPass = process.env.EMAIL_PASS || "";
  // Gmail app passwords are often copied with spaces; strip whitespace safely.
  const normalizedPass =
    normalizedService === "gmail" ? rawPass.replace(/\s+/g, "") : rawPass;
  
  return {
    ...config,
    auth: {
      user: process.env.EMAIL_USER,
      pass: normalizedPass,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  };
};

export default emailConfigs;
