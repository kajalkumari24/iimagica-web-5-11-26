import React, { useEffect, useState, useRef } from "react";
import { FaBell, FaTimes, FaCheck } from "react-icons/fa";
import { BASE_URL } from "../url";
import styles from "./NotificationPopup.module.css";
import imm4Logo from "../assets/imm4.png";
import { getAuthToken } from "../utils/auth";

function shortTime(ts) {
  if (!ts) return "";
  const now = Date.now();
  const diff = now - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default function NotificationPopup({ onClose, profileData, onUpdateCount }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const wrapRef = useRef();

  const readIdsKey = "imagica_read_notifications_v1";

  const getReadIds = () => {
    try { return JSON.parse(localStorage.getItem(readIdsKey) || "[]"); } catch { return []; }
  };

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onClose]);

  // Fetch Notifications
  useEffect(() => {
    let mounted = true;
    const fetchNotifs = async () => {
      setLoading(true);
      try {
        const token = getAuthToken();
        const headers = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}/api/notifications`, {
          credentials: "include",
          headers,
        });

        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const read = getReadIds();
        
        if (!mounted) return;

        // Custom filtering logic (if profileData exists)
        const userProfileType = String(profileData?.profiletype || profileData?.profileType || "").toLowerCase();
        const getUserCategory = () => {
          if (userProfileType === 'political') return String(profileData?.partyname || "").toLowerCase();
          if (userProfileType === 'professional') return String(profileData?.categories || "").toLowerCase();
          if (userProfileType === 'brand') return String(profileData?.brandName || "").toLowerCase();
          return "";
        };
        const userCategory = getUserCategory();

        let filteredData = (data || []).filter((note) => {
          if (!profileData) return true; // Show all if no profile loaded yet
          const targetType = String(note.targetProfileType || 'global').toLowerCase();
          if (targetType === 'all' || targetType === 'global') return true;
          if (targetType !== userProfileType) return false;
          
          const noteCategory = String(note.category || "").toLowerCase().trim();
          if (noteCategory && userCategory && !userCategory.includes(noteCategory)) return false;
          return true;
        });

        const mapped = filteredData.map((n) => ({ ...n, unread: !read.includes(n._id) }));
        mapped.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        
        setNotifications(mapped);
      } catch (err) {
        console.warn("Notifications fetch failed", err);
        if (mounted) setNotifications([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    fetchNotifs();
    return () => (mounted = false);
  }, [profileData]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Update Navbar Badge count
  useEffect(() => {
    if (onUpdateCount) {
      onUpdateCount(unreadCount);
    }
  }, [unreadCount, onUpdateCount]);

  const markRead = (id, e) => {
    e?.stopPropagation();
    setNotifications((prev) => prev.map((p) => (p._id === id ? { ...p, unread: false } : p)));
    const read = new Set(getReadIds());
    read.add(id);
    localStorage.setItem(readIdsKey, JSON.stringify([...read]));
  };

  const markAllRead = () => {
    const ids = notifications.map((n) => n._id);
    localStorage.setItem(readIdsKey, JSON.stringify(ids));
    setNotifications((prev) => prev.map((p) => ({ ...p, unread: false })));
  };

  return (
    <div className={styles.popupWrapper} ref={wrapRef}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <FaBell className={styles.headerIcon} />
          <span className={styles.headerTitle}>Notifications</span>
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <FaTimes size={14} />
        </button>
      </div>

      {/* Action bar */}
      {unreadCount > 0 && (
        <div className={styles.actionBar}>
          <button className={styles.markAllBtn} onClick={markAllRead}>
            <FaCheck size={12} /> Mark all as read
          </button>
        </div>
      )}

      {/* Notifications list */}
      <div className={styles.listContainer}>
        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading...</p>
          </div>
        )}
        
        {!loading && notifications.length === 0 && (
          <div className={styles.emptyState}>
            <FaBell size={48} className={styles.emptyIcon} />
            <p>No notifications yet</p>
          </div>
        )}

        {!loading && notifications.map((n) => {
          const raw = n.coverImage || "";
          const src = raw && String(raw).startsWith("http") ? raw : (raw ? `${BASE_URL}${raw}` : imm4Logo);
          
          return (
            <div 
              key={n._id} 
              className={`${styles.notificationItem} ${n.unread ? styles.itemUnread : styles.itemRead}`}
            >
              <img src={src} alt={n.title} className={styles.itemImage} />
              <div className={styles.itemContent}>
                <div className={styles.itemHeader}>
                  <h4 className={styles.itemTitle}>{n.title}</h4>
                  <span className={styles.itemTime}>{shortTime(n.createdAt || n.date)}</span>
                </div>
                <p className={styles.itemDesc}>{n.desc}</p>
                <div className={styles.itemFooter}>
                  {n.category && (
                    <span className={styles.itemCategory}>{n.category}</span>
                  )}
                  {n.unread && (
                    <button className={styles.markReadBtn} onClick={(e) => markRead(n._id, e)}>
                      <FaCheck size={10} /> Mark as read
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}