import { io } from "socket.io-client";
import { BASE_URL } from "./url";

// ENV se URL lo (best practice)
const SOCKET_URL = BASE_URL;

// Socket instance
const socket = io(SOCKET_URL, {
  withCredentials: true,

  // Recommended transport
  transports: ["websocket"],

  // Path (default hai but explicitly de diya)
  path: "/socket.io",

  // Auto connect
  autoConnect: true,

  // Reconnection settings
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

// Debug logs (optional but useful)
socket.on("connect", () => {
  // console.log("✅ Socket Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket Connection Error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ Socket Disconnected:", reason);
});

export default socket;