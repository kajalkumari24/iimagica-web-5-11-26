// NotificationToast.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NotificationToast.module.css";
import imm4Logo from "../assets/imm4.png";

function NotificationToast({ notification, onClose }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification) return;
    if (notification.link) {
      navigate(notification.link, {
        state: { selectedImage: notification.coverImage, category: notification.category },
      });
    } else {
      navigate("/notification");
    }
    onClose?.(); // close the toast
  };

  if (!notification) return null;

  const imgSrc = notification.coverImage && String(notification.coverImage).startsWith("http") ? notification.coverImage : (notification.coverImage || imm4Logo);

  return (
    <div className={styles.toast} onClick={handleClick} role="status" aria-live="polite">
      <button
        className={styles.close}
        onClick={(e) => {
          e.stopPropagation(); // prevent triggering handleClick
          onClose?.();
        }}
        aria-label="Close notification"
      >
        ×
      </button>
      <img
        src={imgSrc}
        alt={notification.title}
      />
      <div className={styles.content}>
        <h4 style={{margin:0, fontSize:14, color:'#fff'}}>{notification.title}</h4>
        <p style={{margin:0, fontSize:13, color:'rgba(255,255,255,0.9)'}}>{notification.desc}</p>
      </div>
    </div>
  );
}

export default NotificationToast;
