import React, { useEffect } from "react";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(255, 255, 255, 0.85)",
  zIndex: 99999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(4px)",
  padding: "20px",
  WebkitBackdropFilter: "blur(4px)", // For Safari
};

const cardStyle = {
  background: "#ffffff",
  padding: "32px",
  borderRadius: "16px",
  border: "1px solid #e5e7eb",
  textAlign: "center",
  maxWidth: "420px",
  width: "100%",
  boxShadow: "0 10px 40px rgba(0,0,0,0.1), 0 25px 50px -12px rgba(0,0,0,0.15)",
  position: "relative",
};

export default function SubscriptionExpiredModal({
  open,
  onClose,
  onUpgrade,
  title = "Subscription Expired",
  message = "Your free trial or premium plan has ended. Please upgrade your plan to continue.",
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "transparent",
            border: "none",
            color: "#9ca3af",
            fontSize: "24px",
            cursor: "pointer",
          }}
        >
          &times;
        </button>
        <h2 style={{ color: "#ef4444", fontSize: "26px", margin: "0 0 14px" }}>{title}</h2>
        <p style={{ color: "#4b5563", fontSize: "16px", lineHeight: "1.6", margin: "0 0 24px" }}>
          {message}
        </p>
        <button
          type="button"
          onClick={onUpgrade}
          style={{
            background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
            color: "#ffffff",
            border: "none",
            padding: "14px 24px",
            fontSize: "16px",
            fontWeight: "700",
            borderRadius: "8px",
            cursor: "pointer",
            width: "100%",
          }}
        >
          Upgrade Plan
        </button>
      </div>
    </div>
  );
}
