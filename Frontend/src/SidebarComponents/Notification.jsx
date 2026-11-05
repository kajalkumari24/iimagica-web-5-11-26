import React, { useEffect, useState } from "react";
import styles from "./Notification.module.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../url";
import Header from "../page/Header/Header";

import BottomNavbar from '../components/BottomNavbar';
import { FaBell, FaCheck } from 'react-icons/fa';
import socket from "../socket";
import imm4Logo from "../assets/imm4.png";

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

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [showExpiryPopup, setShowExpiryPopup] = useState(false);
  const navigate = useNavigate();
  const readIdsKey = "imagica_read_notifications_v1";

  const getReadIds = () => {
    try { return JSON.parse(localStorage.getItem(readIdsKey) || "[]"); } catch { return []; }
  };

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/profiles/me`, { withCredentials: true });
        const sub = res.data?.subscription;
        if (sub) {
          if (sub.subscriptionStatus === "expired") {
            setIsExpired(true);
          } else if (sub.expiryDate) {
            setExpiryDate(sub.expiryDate);
          }
        }
        return res.data?.profile || res.data || {};
      } catch (err) {
        console.error("Error checking subscription:", err);
        return {};
      }
    };

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const userProfile = await checkSubscription();
        const userProfileType = String(userProfile?.profiletype || userProfile?.profileType || "").toLowerCase();
        
        const getUserCategory = () => {
          if (userProfileType === 'political') return String(userProfile?.partyname || "").toLowerCase();
          if (userProfileType === 'professional') return String(userProfile?.categories || "").toLowerCase();
          if (userProfileType === 'brand') return String(userProfile?.brandName || "").toLowerCase();
          return "";
        };
        const userCategory = getUserCategory();
        const res = await axios.get(`${BASE_URL}/api/notifications`, { withCredentials: true });
        
        // Filter notifications based on targetProfileType and category
        const filteredData = (res.data || []).filter((note) => {
          const targetType = String(note.targetProfileType || 'global').toLowerCase();
          if (targetType === 'all' || targetType === 'global') return true;
          if (targetType !== userProfileType) return false;
          
          const noteCategory = String(note.category || "").toLowerCase().trim();
          if (noteCategory && userCategory && !userCategory.includes(noteCategory)) return false;
          return true;
        });

        // console.log("📢 Notifications fetched:", filteredData);
        filteredData.forEach(note => {
          // console.log(`Notification: ${note.title}`, {
          //   coverImage: note.coverImage,
          // });
        });

        const read = getReadIds();
        const mapped = filteredData.map((n) => ({ ...n, unread: !read.includes(n._id) }));
        mapped.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
        setNotifications(mapped);
      } catch (err) {
        console.error("Error fetching notifications:", err);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();

    // 🟢 Listen for real-time new notifications
    const handleSocketUpdate = (data) => {
      // console.log("🔔 Socket Event Received: notificationUpdated", data);
      fetchNotifications();
    };
    socket.on('notificationUpdated', handleSocketUpdate);

    return () => {
      socket.off('notificationUpdated', handleSocketUpdate);
    };
  }, []);

  // ✅ Close expiry popup on ESC key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowExpiryPopup(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const handleClick = (note) => {
    if (isExpired) {
      setShowExpiryPopup(true); // Expired hone par direct popup dikhayein
      return;
    }
    if (note.category) {
      const encoded = encodeURIComponent(note.category);
      navigate(`/category/${encoded}`, {
        state: { selectedImage: note.coverImage, category: note.category },
      });
    }
  };

  const handleMarkAsRead = (e, notificationId) => {
    e?.stopPropagation();
    setNotifications((prev) => prev.map((p) => (p._id === notificationId ? { ...p, unread: false } : p)));
    const read = new Set(getReadIds());
    read.add(notificationId);
    localStorage.setItem(readIdsKey, JSON.stringify([...read]));
  };

  const handleMarkAllAsRead = () => {
    const ids = notifications.map((n) => n._id);
    localStorage.setItem(readIdsKey, JSON.stringify(ids));
    setNotifications((prev) => prev.map((p) => ({ ...p, unread: false })));
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", paddingBottom: "80px" }}>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", width: "100%", position: "fixed", top: 0, left: 0, zIndex: 1000, background: "#ffffff" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ width: 36, height: 36, border: "3px solid #f1f5f9", borderTop: "3px solid #F10D64", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "12px" }}></div>
          <p style={{ color: "#64748b", marginTop: "16px" }}>Loading notifications...</p>
        </div>
      ) : (
        <>
          {/* ✅ Expiry Blocker Popup */}
          {showExpiryPopup && (
            <div style={{
              position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
              backgroundColor: "rgba(3, 3, 24, 0.85)", zIndex: 99999,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(4px)"
            }}>
              <div style={{
                background: "#111", padding: "40px", borderRadius: "16px",
                border: "1px solid #333", textAlign: "center", maxWidth: "420px", boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                position: "relative", margin: "20px"
              }}>
                <button onClick={(e) => { e.stopPropagation(); setShowExpiryPopup(false); }} style={{ position: "absolute", top: "15px", right: "15px", background: "transparent", border: "none", color: "#888", fontSize: "24px", cursor: "pointer" }}>
                  &times;
                </button>
                <h2 style={{ color: "#ff6b7a", fontSize: "26px", marginBottom: "16px", marginTop: 0 }}>Subscription Expired</h2>
                <p style={{ color: "#ccc", fontSize: "16px", marginBottom: "30px", lineHeight: "1.5" }}>
                  Your free trial or premium plan has ended. Please upgrade your plan to select frames and edit images.
                </p>
                <button onClick={() => navigate('/premium')} style={{
                  background: "linear-gradient(90deg, #00d4ff, #0088ff)", color: "#000", border: "none", padding: "14px 24px",
                  fontSize: "16px", fontWeight: "bold", borderRadius: "8px", cursor: "pointer", width: "100%"
                }}>
                  View Premium Plans
                </button>
              </div>
            </div>
          )}
        <div style={{ paddingTop: "max(60px, 5vh)" }}>
          <Header />
          <div className={styles.container}>
            <div className={styles.header}>
              <FaBell className={styles.headerIcon} />
              <h2 className={styles.title}>Notifications</h2>
            </div>

            {/* ✅ Mark all as read button */}
            {notifications.length > 0 && notifications.some(n => n.unread) && (
              <div className={styles.markAllSection}>
                <button 
                  className={styles.markAllButton}
                  onClick={handleMarkAllAsRead}
                >
                  <FaCheck size={12} /> Mark all as read
                </button>
              </div>
            )}

            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <FaBell size={80} />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className={styles.notificationList}>
                {notifications.map((note) => {
                  const raw = note.coverImage || "";
                  const src = raw && String(raw).startsWith("http") ? raw : (raw ? `${BASE_URL}${raw}` : imm4Logo);
                  
                  return (
                    <div 
                      key={note._id} 
                      className={`${styles.notificationCard} ${note.unread ? styles.cardUnread : styles.cardRead}`}
                      onClick={() => handleClick(note)}
                    >
                      {/* Left side - Image/Icon */}
                      <div className={styles.notifThumb}>
                        <img 
                          src={src} 
                          alt={note.title} 
                          className={styles.thumbImage}
                          onError={(e) => {
                            e.target.src = imm4Logo;
                          }}
                        />
                      </div>

                      {/* Center - Content */}
                      <div className={styles.notifBody}>
                        <div className={styles.notifHeader}>
                          <h3 className={styles.notifTitle}>{note.title}</h3>
                          <span className={styles.notifTime}>{shortTime(note.createdAt || note.date)}</span>
                        </div>
                        <p className={styles.notifDesc}>{note.desc}</p>
                        <div className={styles.notifFooter}>
                          {note.category && (
                            <span className={styles.notifCategory}>{note.category}</span>
                          )}
                          {note.unread && (
                            <button 
                              className={styles.markReadButton}
                              onClick={(e) => handleMarkAsRead(e, note._id)}
                            >
                              <FaCheck size={10} /> Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        </>
      )}
      <BottomNavbar isAuthenticated={true} />
    </div>
  );
}

export default Notification;
