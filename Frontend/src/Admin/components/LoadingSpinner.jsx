import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <div className={styles.loadingText}>{text}</div>
    </div>
  );
};

export default LoadingSpinner;