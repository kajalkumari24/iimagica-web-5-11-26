import { useEffect, useState } from "react";
import adminApi from "../utils/adminApi";
import styles from "./AdminFeedback.module.css";
import adminStyles from "./AdminHome.module.css";
import ConfirmModal from "./components/ConfirmModal";

const Stars = ({ value }) =>
  [1, 2, 3, 4, 5].map((s) => (
    <span key={s} style={{ color: s <= value ? "#f59e0b" : "#d1d5db", fontSize: "1.1rem" }}>
      ★
    </span>
  ));

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | visible | hidden
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await adminApi.get("/api/reviews/all");
      setReviews(res.data.data || []);
    } catch (err) {
      console.error("fetch reviews error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (id) => {
    try {
      const res = await adminApi.patch(`/api/reviews/${id}/toggle-visibility`);
      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, isVisible: res.data.data.isVisible } : r))
      );
    } catch (err) {
      console.error("toggle error:", err);
    }
  };

  const handleDelete = async (id) => {
    setConfirmOpen(false);
    try {
      await adminApi.delete(`/api/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      console.error("delete error:", err);
    }
  };

  const displayed = reviews.filter((r) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      (r.userId?.name || "").toLowerCase().includes(q) ||
      (r.userId?.email || "").toLowerCase().includes(q) ||
      (r.comment || "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "visible" && r.isVisible) ||
      (filter === "hidden" && !r.isVisible);
    return matchSearch && matchFilter;
  });

  const visibleCount = reviews.filter((r) => r.isVisible).length;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : "—";

  return (
    <div className={styles.container}>
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
        <div>
          <div className={adminStyles.activeTitle} style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            Reviews & Ratings
          </div>
          <div style={{ fontSize: "0.9rem", color: "#64748b", marginTop: 4 }}>
            Manage user reviews and control which ones appear publicly
          </div>
        </div>
        <div className={styles.headerActions}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "#f3f4f6",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <option value="all">All Reviews</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
          <input
            className={styles.searchInput}
            placeholder="Search name, email or comment"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Reviews</div>
            <div className={styles.statValue}>{reviews.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Visible</div>
            <div className={styles.statValue}>{visibleCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Avg. Rating</div>
            <div className={styles.statValue}>{avgRating} ★</div>
          </div>
        </div>

        <div className={styles.contentArea}>
          {loading ? (
            <p>Loading reviews...</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th>Date</th>
                    <th>Visibility</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan="7" className={styles.noData}>
                        No reviews found
                      </td>
                    </tr>
                  ) : (
                    displayed.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <strong>{r.userId?.name || "Unknown"}</strong>
                        </td>
                        <td>{r.userId?.email || "—"}</td>
                        <td>
                          <Stars value={r.rating} />
                        </td>
                        <td className={styles.tableDesc}>{r.comment || "—"}</td>
                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => toggleVisibility(r._id)}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 8,
                              border: "none",
                              cursor: "pointer",
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              background: r.isVisible ? "#dcfce7" : "#fef3c7",
                              color: r.isVisible ? "#16a34a" : "#b45309",
                            }}
                          >
                            {r.isVisible ? "Visible" : "Hidden"}
                          </button>
                        </td>
                        <td>
                          <button
                            className={styles.dangerBtnOutline}
                            onClick={() => {
                              setConfirmTarget(r._id);
                              setConfirmOpen(true);
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete review"
        message="Are you sure you want to delete this review?"
        onConfirm={() => handleDelete(confirmTarget)}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}
