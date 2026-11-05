import React, { useEffect, useState } from "react";
import adminApi from "../utils/adminApi";
import styles from "./AdminContact.module.css"; // local styles
import adminStyles from "./AdminHome.module.css"; // shared admin header styles
import ConfirmModal from "./components/ConfirmModal";
import SkeletonLoader from "./components/SkeletonLoader";

// const BASE_URL = "http://localhost:5000"; // ✅ update if needed

function AdminContact() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeContact, setActiveContact] = useState(null);

  // 📥 Fetch all contacts
  const fetchContacts = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/api/contact`); // ✅ Fixed endpoint
      setContacts(res.data);
    } catch (err) {
      setError("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  };

  // ask for confirmation then delete
  const requestDelete = (id) => {
    setConfirmTarget(id);
    setConfirmOpen(true);
  };

  const openDetails = (contact) => {
    setActiveContact(contact);
    setDetailOpen(true);
  };

  const deleteContact = async (id) => {
    try {
      await adminApi.delete(`/api/contact/${id}`);
      setContacts((prev) => prev.filter((c) => c._id !== id));
      setConfirmOpen(false);
      setConfirmTarget(null);
    } catch (err) {
      alert("Failed to delete contact");
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const anyModalOpen = confirmOpen || detailOpen;

    if (anyModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [confirmOpen, detailOpen]);

  // Close modals on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setConfirmOpen(false);
        setConfirmTarget(null);
        setDetailOpen(false);
        setActiveContact(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) return <SkeletonLoader />;
  if (error) return <div className={styles.error}>{error}</div>;

  const filtered = contacts.filter(c => {
    if (!search || !search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (c.name||'').toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.subject||'').toLowerCase().includes(q) || (c.message||'').toLowerCase().includes(q);
  });
  const totalCount = contacts.length;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCount = contacts.filter((c) => {
    if (!c?.createdAt) return false;
    const key = new Date(c.createdAt).toISOString().slice(0, 10);
    return key === todayKey;
  }).length;
  const uniqueSenders = new Set(
    contacts
      .map((c) => c.email || c._id || "")
      .filter(Boolean)
  ).size;

  return (
    <div className={styles.container}>
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
        <div>
          <div className={adminStyles.activeTitle} style={{ fontSize: "1.75rem", fontWeight: 700 }}>Contacts</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 4 }}>User messages and enquiries</div>
        </div>

        <div className={styles.headerActions}>
          <input className={styles.searchInput} placeholder="Search name, email or subject" value={search} onChange={(e) => setSearch(e.target.value)} />
          {search.trim() && (
            <button className={styles.clearBtn} onClick={() => setSearch("")}>Clear</button>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Messages</div>
            <div className={styles.statValue}>{totalCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Today</div>
            <div className={styles.statValue}>{todayCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Unique Senders</div>
            <div className={styles.statValue}>{uniqueSenders}</div>
          </div>
        </div>

        <div className={styles.containerInner}>
        {filtered.length === 0 ? (
          <div className={styles.noData}>No contact messages found.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Subject</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((contact) => (
                  <tr key={contact._id}>
                    <td>
                      <div className={styles.senderCell}>
                        <div className={styles.avatar}>
                          {(contact.name || contact.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.senderName}>{contact.name || "Unknown Sender"}</div>
                          <div className={styles.senderEmail}>{contact.email || "-"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.subjectBadge}>{contact.subject || "No Subject"}</span>
                    </td>
                    <td className={styles.messageCell} title={contact.message || "-"}>
                      {contact.message || "-"}
                    </td>
                    <td className={styles.dateCell}>{new Date(contact.createdAt).toLocaleString()}</td>
                    <td>
                      <div className={styles.actionRow}>
                        <button className={styles.viewBtn} onClick={() => openDetails(contact)}>View</button>
                        <button className={styles.dangerBtnOutline} onClick={() => requestDelete(contact._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete message"
        message="Are you sure you want to delete this message? This can't be undone."
        onConfirm={() => deleteContact(confirmTarget)}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      {detailOpen && activeContact && (
        <div className={styles.modalOverlay} onClick={() => setDetailOpen(false)}>
          <div className={styles.detailsModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.detailsHeader}>
              <h3>Message Details</h3>
              <button className={styles.modalCloseBtn} onClick={() => setDetailOpen(false)}>×</button>
            </div>
            <div className={styles.detailsBody}>
              <div className={styles.detailItem}>
                <span>Name</span>
                <strong>{activeContact.name || "-"}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Email</span>
                <strong>{activeContact.email || "-"}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Subject</span>
                <strong>{activeContact.subject || "No Subject"}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Received</span>
                <strong>{new Date(activeContact.createdAt).toLocaleString()}</strong>
              </div>
              <div className={styles.messageBlock}>
                <span>Message</span>
                <p>{activeContact.message || "-"}</p>
              </div>
            </div>
            <div className={styles.detailsFooter}>
              <button className={styles.clearBtn} onClick={() => setDetailOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminContact;
