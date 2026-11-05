import React from 'react';
import styles from '../MyProfile.module.css';

const SubmitRow = ({ isSaving }) => (
  <div className={styles.submitRow}>
    <button type="submit" className={styles.submitBtn} disabled={isSaving}>
      {isSaving ? (
        <>
          <span className={styles.spinner} aria-hidden /> Saving...
        </>
      ) : (
        " Save Changes"
      )}
    </button>
  </div>
);

export default SubmitRow;
