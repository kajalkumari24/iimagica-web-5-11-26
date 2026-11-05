import React, { useEffect, useRef } from 'react';
import styles from './SharedModal.module.css';

const IconJpg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <path d="M4 4H20V20H4V4Z" fill="currentColor" opacity="0.12"/>
    <path d="M7 15H9V9H7V15Z" fill="currentColor"/>
    <path d="M12 15H14V11H16V9H12V15Z" fill="currentColor"/>
  </svg>
);

const IconPng = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" opacity="0.12"/>
    <path d="M7 15H9V9H7V15Z" fill="currentColor"/>
    <path d="M11 9H13C14.1 9 15 9.9 15 11V15H13V11H11V9Z" fill="currentColor"/>
  </svg>
);

export default function DownloadMenu({ image, onClose, anchorStyle }) {
  const ref = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onClose();
    };
    window.addEventListener('mousedown', onDocClick);
    return () => window.removeEventListener('mousedown', onDocClick);
  }, [onClose]);

  const doDownload = async (format) => {
    try {
      const mod = await import('../utils/downloadImage');
      await mod.downloadImageAs(image, format);
    } catch (err) {
      console.error('Download failed', err);
      // fallback: open image in new tab
      window.open(image, '_blank');
    } finally {
      onClose();
    }
  };

  return (
    <div ref={ref} className={styles.downloadMenu} role="menu" aria-label="Download image" style={{ position: 'fixed', zIndex: 9999, ...anchorStyle }}>
      <button className={styles.downloadOption} onClick={() => doDownload('jpg')}>
        <IconJpg />
        <span style={{ marginLeft: 8 }}>JPG</span>
      </button>
      <button className={styles.downloadOption} onClick={() => doDownload('png')}>
        <IconPng />
        <span style={{ marginLeft: 8 }}>PNG</span>
      </button>
    </div>
  );
}
