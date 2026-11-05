import { useEffect, useState } from "react";
import axios from "../axiosConfig";

const StarRating = ({ value, onChange }) => (
  <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        onClick={() => onChange(s)}
        style={{
          fontSize: "2rem",
          cursor: "pointer",
          color: s <= value ? "#f59e0b" : "#d1d5db",
          transition: "color 0.15s",
        }}
      >
        ★
      </span>
    ))}
  </div>
);

// eligibility: free trial done OR on a paid plan (not free plan on trial)
const isEligible = (user) => {
  if (!user) return false;
  const plan = user.currentPlan || "";
  const status = user.subscriptionStatus || "";
  // eligible if they have any paid plan OR trial is expired/active non-trial
  if (plan !== "free" && plan !== "") return true;
  if (status === "active" || status === "expired" || status === "cancelled") return true;
  return false;
};

export default function ReviewPopup({ onClose }) {
  const [user, setUser] = useState(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const [meRes, reviewRes] = await Promise.all([
          axios.get("/api/users/me", { withCredentials: true }),
          axios.get("/api/reviews/my-review"),
        ]);
        setUser(meRes.data?.user || null);
        if (reviewRes.data?.data) {
          setAlreadyReviewed(true);
          setRating(reviewRes.data.data.rating);
          setComment(reviewRes.data.data.comment || "");
        }
      } catch {
        // not logged in or error — close popup
        onClose();
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return setMsg("Please select a star rating.");
    setSubmitting(true);
    setMsg("");
    try {
      await axios.post("/api/reviews/submit", { rating, comment });
      setDone(true);
    } catch (err) {
      setMsg(err.response?.data?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Close popup if user is not eligible
  if (!checking && user && !isEligible(user)) {
    onClose();
    return null;
  }

  if (checking) return null;

  const overlay = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  };

  const card = {
    background: "#fff",
    borderRadius: 16,
    padding: "2rem",
    width: "100%",
    maxWidth: 420,
    textAlign: "center",
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  };

  return (
    <div style={overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={card}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            background: "none",
            border: "none",
            fontSize: "1.3rem",
            cursor: "pointer",
            color: "#94a3b8",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {done ? (
          <>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: 8 }}>
              Thanks for your review!
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: 20 }}>
              Your feedback will be visible once approved.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: "0.6rem 2rem",
                background: "#6366f1",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>⭐</div>
            <h3 style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: 6 }}>
              {alreadyReviewed ? "Update your review" : "How's your experience?"}
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: 20 }}>
              {alreadyReviewed
                ? "You can update your rating and comment."
                : "Share your feedback — it helps us improve!"}
            </p>

            <form onSubmit={handleSubmit}>
              <StarRating value={rating} onChange={setRating} />
              <textarea
                rows={3}
                placeholder="Write a comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 14,
                  padding: "0.65rem 0.85rem",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  resize: "vertical",
                  fontSize: "0.92rem",
                  boxSizing: "border-box",
                }}
              />
              {msg && (
                <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: "6px 0 0" }}>{msg}</p>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: "0.6rem",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  Maybe Later
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: "0.6rem",
                    background: "#6366f1",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? "Submitting…" : alreadyReviewed ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
