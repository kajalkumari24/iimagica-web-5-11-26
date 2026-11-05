import React from 'react';
import styles from './SkeletonLoader.module.css';

const SkeletonLoader = () => {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerBar}>
        <div className={styles.backBtnSkeleton}></div>
        <div className={styles.titleSkeleton}></div>
      </div>

      <div className={styles.mainGrid}>
        {/* Left: Preview Section Skeleton */}
        <div className={styles.previewSection}>
          <div className={styles.sectionTitleSkeleton}></div>
          <div className={styles.previewContainer}>
            <div className={styles.previewImageSkeleton}></div>
            <div className={styles.downloadBtnSkeleton}></div>
          </div>
        </div>

        {/* Right: Controls Section Skeleton */}
        <div className={styles.controlsSection}>
          <div className={styles.framesPanel}>
            <div className={styles.sectionTitleSkeleton}></div>
            <div className={styles.gridContainer}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.frameItemSkeleton}></div>
              ))}
            </div>
          </div>

          <div className={styles.imagesPanel}>
            <div className={styles.sectionTitleSkeleton}></div>
            <div className={styles.gridContainer}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={styles.imageItemSkeleton}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;