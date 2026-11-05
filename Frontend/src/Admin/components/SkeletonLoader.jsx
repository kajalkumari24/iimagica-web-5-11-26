import React from 'react';
import styles from './SkeletonLoader.module.css';

const SkeletonLoader = () => {
  return (
    <div className={styles.container}>
      {/* Header skeleton */}
      <div className={styles.header}>
        <div className={styles.titleSkeleton}></div>
        <div className={styles.searchSkeleton}></div>
      </div>
      
      {/* Stats cards skeleton */}
      <div className={styles.statsGrid}>
        {[1,2,3,4].map(i => (
          <div key={i} className={styles.statCard}>
            <div className={styles.statIcon}></div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}></div>
              <div className={styles.statValue}></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Charts skeleton */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartTitle}></div>
          <div className={styles.chartContent}></div>
        </div>
        <div className={styles.sidePanel}>
          <div className={styles.chartCard}>
            <div className={styles.chartTitle}></div>
            <div className={styles.chartContent}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;