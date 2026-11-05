import React, { useEffect, useState } from "react";
import adminApi from "../utils/adminApi";
import styles from "./AdminFeedback.module.css";
import adminStyles from "./AdminHome.module.css";
import ConfirmModal from "./components/ConfirmModal";

function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  // detail view removed per request (no separate 'View' modal)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await adminApi.get(`/api/feedback/all`);
      const list = res.data?.data?.feedbacks || res.data.feedbacks || [];
      setFeedbacks(list);
      setAllFeedbacks(list);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setConfirmTarget(id);
    setConfirmOpen(true);
  };

  const handleDelete = async (id) => {
    setConfirmOpen(false);
    try {
      await adminApi.delete(`/api/feedback/${id}`);
      setAllFeedbacks((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      console.error("Error deleting feedback:", err);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const getDisplayed = () => {
    let out = Array.isArray(allFeedbacks) ? [...allFeedbacks] : [];
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      out = out.filter(f => (f.userId?.name || '').toLowerCase().includes(q) || (f.userId?.email || '').toLowerCase().includes(q) || (f.feedback || '').toLowerCase().includes(q));
    }

    if (sortBy) {
      out.sort((a, b) => {
        let va = a[sortBy];
        let vb = b[sortBy];
        if (sortBy === 'createdAt') {
          const da = new Date(va).getTime() || 0;
          const db = new Date(vb).getTime() || 0;
          return sortDir === 'asc' ? da - db : db - da;
        }
        const sa = String(va || '').toLowerCase();
        const sb = String(vb || '').toLowerCase();
        if (sa < sb) return sortDir === 'asc' ? -1 : 1;
        if (sa > sb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return out;
  };

  const displayed = getDisplayed();
  const totalCount = allFeedbacks.length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCount = allFeedbacks.filter((f) => {
    if (!f?.createdAt) return false;
    const key = new Date(f.createdAt).toISOString().slice(0, 10);
    return key === todayKey;
  }).length;
  const uniqueUsers = new Set(
    allFeedbacks
      .map((f) => f.userId?.email || f.userId?._id || "")
      .filter(Boolean)
  ).size;

  return (
    <div className={styles.container}>
      {/* Header: match Notifications header layout for consistent admin look */}
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
        <div>
          <div className={adminStyles.activeTitle} style={{ fontSize: "1.75rem", fontWeight: 700 }}>Feedback</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 4 }}>Review and manage user feedback submissions</div>
        </div>

        <div className={styles.headerActions}>
          <input
            className={styles.searchInput}
            placeholder="Search name, email or feedback"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Feedback</div>
            <div className={styles.statValue}>{totalCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Today</div>
            <div className={styles.statValue}>{todayCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Unique Users</div>
            <div className={styles.statValue}>{uniqueUsers}</div>
          </div>
        </div>

        <div className={styles.contentArea}>
        {loading ? (
          <p>Loading feedbacks...</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sortable} onClick={() => toggleSort('user')}>User</th>
                  <th>Email</th>
                  <th>Feedback</th>
                  <th className={styles.sortable} onClick={() => toggleSort('createdAt')}>Created <span className={styles.sortIcon}>{sortBy==='createdAt' ? (sortDir==='asc' ? '▲' : '▼') : ''}</span></th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(!displayed || displayed.length === 0) ? (
                  <tr><td colSpan="5" className={styles.noData}>No feedbacks found</td></tr>
                ) : (
                  displayed.map(f => (
                    <tr key={f._id}>
                      <td><strong>{f.userId?.name || 'Unknown'}</strong></td>
                      <td>{f.userId?.email || '—'}</td>
                      <td className={styles.tableDesc}>{f.feedback}</td>
                      <td>{new Date(f.createdAt).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className={styles.dangerBtnOutline} onClick={() => confirmDelete(f._id)}>Delete</button>
                        </div>
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
        title="Delete feedback"
        message="Are you sure you want to delete this feedback?"
        onConfirm={() => handleDelete(confirmTarget)}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}

export default AdminFeedback;
