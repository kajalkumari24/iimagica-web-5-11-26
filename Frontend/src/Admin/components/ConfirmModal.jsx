import React from 'react';
import styles from './ConfirmModal.module.css'; // Assume CSS module

const ConfirmModal = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
  confirmBtnClass = 'danger',
  loading = false
}) => {
  if (!open) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          <button 
            className={`${styles.btn} ${styles.cancel}`} 
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>
          <button 
            className={`${styles.btn} ${styles[confirmBtnClass]}`} 
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

