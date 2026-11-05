

import { useEffect, useState, useRef } from "react";
import axios from "../axiosConfig";
import { BASE_URL } from "../url";
import socket from "../socket";

const StarRating = ({ value, onChange, readonly = false }) => (
  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        onClick={() => !readonly && onChange && onChange(s)}
        style={{
          fontSize: "1.3rem",
          cursor: readonly ? "default" : "pointer",
          color: s <= value ? "#f59e0b" : "#d1d5db",
          transition: "color 0.15s",
        }}
      >
        ★
      </span>
    ))}
  </div>
);

// showFormForEligible=false → only show existing visible reviews (used on landing page)
export default function ReviewSection({ showFormForEligible = true }) {
  const [visibleReviews, setVisibleReviews] = useState([]);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  const blobAnimation = `
  @keyframes floatBlobReview {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-15px) scale(1.02); }
  }
  `;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchReviews = () => {
    axios
      .get("/api/reviews/visible")
      .then((r) => setVisibleReviews(r.data.data || []))
      .catch(() => {});
  };

  useEffect(() => {
    fetchReviews();
    socket.on("reviewUpdated", fetchReviews);
    return () => socket.off("reviewUpdated", fetchReviews);
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden w-full bg-white">
      <style>{blobAnimation}</style>
      
      {/* 🔥 BACKGROUND BLOBS */}
      <div
        className="absolute w-[100px] h-[100px] md:w-[138px] md:h-[138px] rounded-full opacity-15 z-0"
        style={{
          background: "#FF4D4D",
          top: "10%",
          left: "5%",
          animation: visible ? "floatBlobReview 8s ease-in-out infinite" : "none",
        }}
      />
      <div
        className="absolute w-[100px] h-[100px] md:w-[122px] md:h-[122px] rounded-full opacity-15 z-0"
        style={{
          background: "#E84D8A",
          top: "20%",
          right: "5%",
          animation: visible ? "floatBlobReview 10s ease-in-out infinite" : "none",
        }}
      />
      <div
        className="absolute w-[100px] h-[100px] md:w-[138px] md:h-[138px] rounded-full opacity-15 z-0"
        style={{
          background: "#FF7A30",
          bottom: "15%",
          left: "10%",
          animation: visible ? "floatBlobReview 7s ease-in-out infinite" : "none",
        }}
      />
      <div
        className="absolute w-[100px] h-[100px] md:w-[154px] md:h-[154px] rounded-full opacity-15 z-0"
        style={{
          background: "#FF7A30",
          bottom: "5%",
          right: "10%",
          animation: visible ? "floatBlobReview 9s ease-in-out infinite" : "none",
        }}
      />

      {/* 🔥 MAIN CONTENT WRAPPER */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", padding: "6rem 1rem" }}>
      <h2
        style={{
          marginTop: "-2rem",
          fontWeight: 700,
          fontSize: "2.2rem",
          marginBottom: "3.1rem",
          textAlign: "center",
        }}
      >
        What Our Users Say
      </h2>

      {visibleReviews.length === 0 ? (
        <p style={{ color: "#94a3b8", textAlign: "center" }}>No reviews yet.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 260px))",
            justifyContent: "center",
            gap: 24,
          }}
        >
          {visibleReviews.map((r) => {
            const dbAvatar = r.userId?.file;
            const avatarSrc = dbAvatar
              ? dbAvatar.startsWith("http")
                ? dbAvatar
                : `${BASE_URL}${dbAvatar.startsWith("/") ? "" : "/"}${dbAvatar}`
              : null;

            return (
              <div
                key={r._id}
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "2rem 1.5rem",
                  textAlign: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* 1. Avatar */}
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginBottom: 16,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "#6366f1",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1.4rem",
                      marginBottom: 16,
                    }}
                  >
                    {(r.userId?.name || "U")[0].toUpperCase()}
                  </div>
                )}

                {/* 2. Star rating */}
                <div style={{ marginBottom: 14 }}>
                  <StarRating value={r.rating} readonly />
                </div>

                {/* 3. Comment */}
                {r.comment && (
                  <p
                    style={{
                      margin: "0 0 16px",
                      color: "#475569",
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {r.comment}
                  </p>
                )}

                {/* 4. User name */}
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "#1e293b",
                    fontWeight: 600,
                  }}
                >
                  - {r.userId?.name || "User"}
                </p>
              </div>
            );
          })}
        </div>
      )}
      </div>
    </section>
  );
}