import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import "dotenv/config";
import passport, { initializeGoogleStrategy } from "./config/googleAuth.js";
import cors from "cors";
import session from "express-session";
import jwt from "jsonwebtoken";
import connectMongo from "connect-mongo";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import imageRoutes from "./routes/imageRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import frameRoutes from "./routes/frameRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import festivalRoutes from "./routes/festivalRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import splashVideoRoutes from "./routes/splashVideoRoutes.js";
import fcmRoutes from "./routes/fcmRoutes.js";
import translateRoutes from "./routes/translateRoutes.js";
import homeSlideRoutes from "./routes/homeSlideRoutes.js";
import profileTypeRoutes from "./routes/profileTypeRoutes.js";
import designLibraryRoutes from "./routes/designLibraryRoutes.js";
import designCategoryRoutes from "./routes/designCategoryRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import whatsappRoutes from "./routes/whatsappRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import privacyPolicyRoutes from "./routes/privacyPolicyRoutes.js";
import termsAndConditionsRoutes from "./routes/termsAndConditionsRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import footerAiRoutes from "./routes/footerAiRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

import { getCsrfToken } from "./middleware/csrfProtection.js";
import { refreshAccessToken } from "./controllers/refreshTokenController.js";
import { initializeFirebase } from "./config/firebase.js";
import path from "path";
import { fileURLToPath } from "url";

const MongoStore = connectMongo(session);

if (process.env.NODE_ENV === "production") {
  console.log = () => { };
  console.debug = () => { };
}

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is required");
  process.exit(1);
}

if (!process.env.SESSION_SECRET) {
  console.error("SESSION_SECRET is required");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
const httpServer = createServer(app);

// Socket.IO setup — works in dev (localhost) and prod (NGINX with upgrade headers)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || isLanOrLocalOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Socket CORS blocked: ${origin}`));
    },
    credentials: true,
  },
  transports: ["websocket", "polling"],
  path: "/socket.io",
});

// Make io globally accessible in controllers
global.io = io;

const onlineUsers = new Map(); // Tracks socket.id -> userId

io.on("connection", (socket) => {
  let connectedUserId = null;

  // 1. Auto-authenticate via cookie (Web Users ke liye)
  try {
    const cookieString = socket.request.headers.cookie || "";
    const match = cookieString.match(new RegExp('(^|;\\s*)userToken=([^;]*)'));
    const token = match ? decodeURIComponent(match[3]) : null;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && (decoded.id || decoded._id)) {
        connectedUserId = String(decoded.id || decoded._id);
        onlineUsers.set(socket.id, connectedUserId);
        // Admin panel ko batayein ki user online aa gaya hai
        io.emit("user_online", connectedUserId);
      }
    }
  } catch (err) {
    // Invalid or missing token, ignore
  }

  // 2. Manual registration (Mobile App Users ke liye)
  socket.on("register_user", (userId) => {
    if (userId) {
      connectedUserId = String(userId);
      onlineUsers.set(socket.id, connectedUserId);
      io.emit("user_online", connectedUserId);
    }
  });

  // Admin panel requests online users list
  socket.on("get_online_users", () => {
    const uniqueUsers = Array.from(new Set(onlineUsers.values()));
    socket.emit("online_users_list", uniqueUsers);
  });

  // Forward frameUpdated from admin editor to all other clients (user side)
  socket.on("frameUpdated", (data) => {
    socket.broadcast.emit("frameUpdated", data);
  });

  socket.on("disconnect", () => {
    if (connectedUserId) {
      onlineUsers.delete(socket.id);
      // Check karein ki kya user kisi aur tab/device par abhi bhi active hai
      const isStillOnline = Array.from(onlineUsers.values()).includes(connectedUserId);
      if (!isStillOnline) {
        io.emit("user_offline", connectedUserId);
      }
    }
  });
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

const getOrigins = () => {
  const originStr = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
  const origins = originStr
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const expandedOrigins = new Set(origins);
  origins.forEach((o) => {
    if (o.startsWith("https://www.")) {
      expandedOrigins.add(o.replace("https://www.", "https://"));
    } else if (o.startsWith("https://") && !o.startsWith("https://www.")) {
      expandedOrigins.add(o.replace("https://", "https://www."));
    }
  });

  return Array.from(expandedOrigins);
};

const isPrivateNetworkHost = (host) => {
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;

  const match172 = host.match(/^172\.(\d{1,3})\./);
  if (match172) {
    const secondOctet = Number(match172[1]);
    return secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
};

const isLanOrLocalOrigin = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;

    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
      return true;
    }

    return isPrivateNetworkHost(hostname);
  } catch {
    return false;
  }
};

const allowedOrigins = getOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || isLanOrLocalOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24,
  },
};

const mountRoutes = () => {
  // Backward-compatible Google OAuth aliases.
  // Some existing Google app configs still point to /api/auth/google or /api/auth/google/callback.
  app.get("/api/auth/google", (req, res) => {
    res.redirect(307, "/api/users/auth/google");
  });

  app.get("/api/auth/google/callback", (req, res) => {
    const queryIndex = req.originalUrl.indexOf("?");
    const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : "";
    res.redirect(307, `/api/users/auth/google/callback${query}`);
  });

  app.get("/api", (req, res) => {
    res.json({ message: "Welcome to the Imagica Backend API" });
  });

  app.get("/api/csrf-token", getCsrfToken);
  app.post("/api/refresh-token", refreshAccessToken);

  app.use("/api/frames", frameRoutes);
  app.use("/api/contact", contactRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/profiles", profileRoutes);
  app.use("/api/locations", locationRoutes);
  app.use("/api/images", imageRoutes);
  app.use("/api/feedback", feedbackRoutes);
  app.use("/api/admins", adminRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/festivals", festivalRoutes);
  app.use("/api/categories", categoryRoutes);
  app.use("/api/splash-video", splashVideoRoutes);
  app.use("/api/fcm", fcmRoutes);
  app.use("/api/translate", translateRoutes);
  app.use("/api/home-slides", homeSlideRoutes);
  app.use("/api/profile-types", profileTypeRoutes);
  app.use("/api/design-library", designLibraryRoutes);
  app.use("/api/design-categories", designCategoryRoutes);
  app.use("/api/plans", planRoutes);
  app.use("/api/payments", paymentRoutes);
  app.use("/api/subscriptions", subscriptionRoutes);
  app.use("/api/subscription", subscriptionRoutes);
  app.use("/api/whatsapp", whatsappRoutes);
  app.use("/api/reviews", reviewRoutes);
  app.use("/api", privacyPolicyRoutes);
  app.use("/api", termsAndConditionsRoutes);
  app.use("/api", blogRoutes);
  app.use("/api/footer-ai", footerAiRoutes);

  // Centralized Error Handler
  app.use(errorHandler);



  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../Frontend/dist")));

    app.get("*", (req, res) => {
      if (
        req.path.startsWith("/uploads/") ||
        req.path.startsWith("/public/") ||
        req.path.startsWith("/images/")
      ) {
        return res.status(404).json({ error: "Not found" });
      }

      res.sendFile(path.join(__dirname, "../Frontend/dist/index.html"));
    });
  }
};

const startServer = async () => {
  const PORT = process.env.PORT || 5007;
  const HOST = process.env.HOST || "0.0.0.0";
  let dbConnected = false;

  initializeFirebase();

  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 20000,
      });
      dbConnected = true;
      console.log("MongoDB connected");

      try {
        const coll = mongoose.connection.db.collection("refreshtokens");
        const idxs = await coll.indexes();
        if (Array.isArray(idxs) && idxs.some((i) => i.name === "token_1")) {
          await coll.dropIndex("token_1");
          console.log("Dropped legacy refreshtokens index token_1");
        }
      } catch (idxErr) {
        console.warn("Could not drop legacy refreshtokens index:", idxErr.message || idxErr);
      }
    } catch (err) {
      console.error("MongoDB connection error:", err?.message || err);
      if (process.env.STRICT_DB === "true") {
        console.error("STRICT_DB=true, exiting due to DB connection failure");
        process.exit(1);
      }
      console.warn("Continuing startup without MongoDB because STRICT_DB!=true");
    }
  } else {
    console.warn("MONGO_URI not set, skipping MongoDB connection.");
  }

  if (dbConnected && process.env.ENABLE_SESSION_STORE === "true") {
    sessionOptions.store = new MongoStore({
      mongooseConnection: mongoose.connection,
      ttl: 60 * 60 * 24,
    });
  } else if (process.env.ENABLE_SESSION_STORE === "true") {
    console.warn("Session store disabled because MongoDB is not connected.");
  } else if (process.env.MONGO_URI) {
    console.warn("Mongo URI provided but session store disabled (ENABLE_SESSION_STORE!=true).");
  }

  app.use(session(sessionOptions));
  initializeGoogleStrategy();
  app.use(passport.initialize());
  app.use(passport.session());

  mountRoutes();

  const hostDisplay = HOST === "0.0.0.0" ? "localhost" : HOST;
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server running at http://${hostDisplay}:${PORT}`);
  });
};

startServer();
