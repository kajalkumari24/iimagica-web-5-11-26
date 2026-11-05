import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";

const onlineUsers = new Map(); // Tracks socket.id -> userId

export const initSocket = (httpServer, allowedOrigins, allowLanInDev, isLanOrLocalOrigin) => {
  // Socket.IO setup — works in dev (localhost) and prod (NGINX with upgrade headers)
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || (allowLanInDev && isLanOrLocalOrigin(origin))) {
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

  io.on("connection", (socket) => {
    let connectedUserId = null;

    // console.log("🔌 New Socket Connection:", socket.id);

    // 1. Auto-authenticate via cookie (Web Users)
    try {
      const cookieString = socket.request.headers.cookie || "";
      const match = cookieString.match(new RegExp('(^|;\\s*)userToken=([^;]*)'));
      const token = match ? decodeURIComponent(match[3]) : null;
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded && (decoded.id || decoded._id)) {
          connectedUserId = String(decoded.id || decoded._id);
          onlineUsers.set(socket.id, connectedUserId);
          io.emit("user_online", connectedUserId);
        }
      }
    } catch (err) {
      // Invalid or missing token, ignore
    }

    // 2. Manual registration (Mobile App Users)
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

    // Forward events from admin editor to all other clients
    socket.on("frameUpdated", (data) => socket.broadcast.emit("frameUpdated", data));
    socket.on("profileTypeUpdated", (data) => socket.broadcast.emit("profileTypeUpdated", data));
    socket.on("reviewUpdated", (data) => socket.broadcast.emit("reviewUpdated", data));

    socket.on("disconnect", () => {
      // console.log("⚠️ Socket Disconnected:", socket.id);
      if (connectedUserId) {
        onlineUsers.delete(socket.id);
        const isStillOnline = Array.from(onlineUsers.values()).includes(connectedUserId);
        if (!isStillOnline) io.emit("user_offline", connectedUserId);
      }
    });
  });
};