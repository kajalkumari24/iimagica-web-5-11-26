



import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CategoryPage.module.css";
import { BASE_URL } from "../url";
import Header from "../page/Header/Header";

 const DesignCategoryPage = () => {
  const { category } = useParams();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cached = sessionStorage.getItem(`designImages:${category}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setImages(parsed);
          setLoading(false);
        }
      } catch {
      }
    }

    const fetchImages = async () => {
      try {
        if (!cached) setLoading(true);
        const res = await axios.get(`${BASE_URL}/api/designs/category/${category}`, { withCredentials: true });
        const data = res.data || [];
        setImages(data);
        sessionStorage.setItem(`designImages:${category}`, JSON.stringify(data));
      } catch (err) {
        console.error("Error fetching design images:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [category]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category]);

  return (
    <div className={styles.contentOffset}>
        <Header />

        <div className={styles.pageContainer}>
          <div className={styles.headerSection}>
            <div className={styles.titleWrapper}>
              <h1 className={styles.pageTitle} style={{textTransform: 'capitalize'}}>{category} Designs</h1>
              <p className={styles.pageSubtitle}>{images.length} Designs Available</p>
            </div>
            <button className={styles.backBtn} onClick={() => navigate('/home')}>← Back to Home</button>
          </div>

          <div className={styles.imageGrid}>
            {loading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div key={`skeleton-${index}`} className={`${styles.imageItem} ${styles.skeletonItem}`}>
                    <div className={styles.imageCard}>
                      <div className={styles.imageSkeleton} />
                    </div>
                  </div>
                ))
              : images.map((img, index) => (
                  <div
                    key={index}
                    className={styles.imageItem}
                    onClick={() => {
                      const encodedCategory = encodeURIComponent(category);
                      navigate(`/image-view/${encodedCategory}`, { state: { selectedImage: img.url, images } });
                    }}
                  >
                    <div className={styles.imageCard}>
                      <img src={img.url} alt={`${category} design ${index + 1}`} className={styles.imageThumb} />
                      <div className={styles.cardOverlay}>
                        <div className={styles.overlayIcon}>View</div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
    </div>
  )
};

export default DesignCategoryPage;
