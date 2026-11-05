


import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CategoryPage.module.css";
import shared from "./SharedModal.module.css";
import ImageEditor from "./ImageEditor";
import DownloadMenu from "./DownloadMenu";
import { BASE_URL } from "../url";
import Header from "../page/Header/Header";
import SubscriptionExpiredModal from "./SubscriptionExpiredModal";
import useSubscriptionGate from "../utils/useSubscriptionGate";
// import { BASE_URL } from "./url"; // ✅ Add this line


const CategoryPage = () => {
  const { category } = useParams();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null); // ✅ for opening editor
  const [modalIndex, setModalIndex] = useState(null);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const downloadBtnRef = useRef(null);
  const cardRef = useRef(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const navigate = useNavigate();
  const { showExpiredModal, setShowExpiredModal, ensureSubscriptionAccess } = useSubscriptionGate();

  useEffect(() => {
    const cached = sessionStorage.getItem(`categoryImages:${category}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setImages(parsed);
          setLoading(false);
        }
      } catch {
        // ignore cache parse errors
      }
    }

    const fetchImages = async () => {
      try {
        if (!cached) setLoading(true);
        const res = await axios.get(`${BASE_URL}/api/images/category/${category}`);
        const data = res.data || [];
        setImages(data);
        sessionStorage.setItem(`categoryImages:${category}`, JSON.stringify(data));
      } catch (err) {
        console.error("Error fetching images:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [category]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [category]);

  const handleImageClick = async (imgUrl) => {
    await ensureSubscriptionAccess(() => {
      const encodedCategory = encodeURIComponent(category);
      navigate(`/image-view/${encodedCategory}`, { state: { selectedImage: imgUrl, images } });
    });
  };

  // keyboard navigation for modal: ESC to close, left/right to navigate
  useEffect(() => {
    const handleKey = (e) => {
      if (modalIndex === null) return;
      if (e.key === "Escape") setModalIndex(null);
      if (e.key === "ArrowLeft") setModalIndex((idx) => (idx - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setModalIndex((idx) => (idx + 1) % images.length);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [modalIndex, images.length]);

  return (
    <div className={styles.lightContainer}>
      <SubscriptionExpiredModal
        open={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        onUpgrade={() => navigate("/pricing")}
        message="Your free trial or premium plan has ended. Please upgrade your plan to open templates and continue editing."
      />

      <div className={`${styles.lightContent} ${styles.contentOffset}`}>
        <Header />

        <div className={styles.pageContainer}>
          <div className={styles.headerSection}>
            <div className={styles.titleWrapper}>
              <h1 className={styles.pageTitle}>{category}</h1>
              <p className={styles.pageSubtitle}>{images.length} Templates Available</p>
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
                    onClick={() => handleImageClick(img.url)}
                  >
                    <div className={styles.imageCard}>
                      <img src={img.url} alt={`${category} ${index + 1}`} className={styles.imageThumb} />
                      <div className={styles.cardOverlay}>
                        <div className={styles.overlayIcon}>View</div>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
      {/* ✅ Image Editor Page (opens when user chooses Edit in preview modal) */}
      {selectedImage && (
        <ImageEditor image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}

      {/* Shared preview modal (opened by clicking any card) */}
      {modalIndex !== null && images[modalIndex] && (
        <div className={shared.overlay} onClick={() => setModalIndex(null)}>
          <button className={shared.close} onClick={() => setModalIndex(null)}>×</button>
          <div className={shared.card} ref={cardRef} onClick={(e) => e.stopPropagation()}>
            <div className={shared.media}>
              <img src={images[modalIndex].url} alt={`Image ${modalIndex + 1}`} />
            </div>
            <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
              {downloadOpen && (
                <DownloadMenu image={images[modalIndex].url} onClose={() => setDownloadOpen(false)} anchorStyle={menuAnchor} />
              )}
            </div>
            <div className={shared.actionsBottom}>
              <button ref={downloadBtnRef} className={`${shared.btn} ${shared.ghost}`} onClick={(e) => {
                e.stopPropagation();
                if (!downloadOpen) {
                  const cardRect = cardRef.current?.getBoundingClientRect();
                  const btnRect = downloadBtnRef.current?.getBoundingClientRect();
                  if (cardRect && btnRect) {
                    const leftViewport = btnRect.left + btnRect.width / 2;
                    const topViewport = btnRect.top;
                    setMenuAnchor({ left: `${leftViewport}px`, top: `${topViewport}px`, transform: 'translate(-50%, -110%)' });
                  } else {
                    setMenuAnchor({ left: '50%', top: '50%', transform: 'translate(-50%, -100%)' });
                  }
                }
                setDownloadOpen(o => !o);
              }}>Download</button>
              <button className={`${shared.btn} ${shared.primary}`} onClick={() => { setModalIndex(null); navigate('/edit', { state: { image: images[modalIndex].url } }); }}>Edit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
