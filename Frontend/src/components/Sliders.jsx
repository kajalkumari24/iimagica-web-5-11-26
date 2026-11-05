
// import React, { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import Card from "@mui/material/Card";
// import CardActionArea from "@mui/material/CardActionArea";
// import CardMedia from "@mui/material/CardMedia";
// import { Link, useNavigate } from "react-router-dom";
// import { BASE_URL } from "../url";
// import styles from "./Sliders.module.css";
// import shared from "./SharedModal.module.css";
// import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
// import DownloadMenu from "./DownloadMenu";
// import socket from "../socket";

// const Sliders = ({ category, title, queryCategory, calendarEventId }) => {
//   const effectiveCategory = String(queryCategory || category || "").trim();
//   const eventQuery = calendarEventId ? `&calendarEventId=${encodeURIComponent(calendarEventId)}` : "";
//   const ref = useRef(null);
//   const [images, setImages] = useState([]);
//   const navigate = useNavigate();
//   const [canScrollPrev, setCanScrollPrev] = useState(false);
//   const [canScrollNext, setCanScrollNext] = useState(true);
//   const [modalImage, setModalImage] = useState(null);
//   const [downloadOpen, setDownloadOpen] = useState(false);
//   const downloadBtnRef = useRef(null);
//   const cardRef = useRef(null);
//   const [menuAnchor, setMenuAnchor] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const [hasMore, setHasMore] = useState(true);
//   const scrollTickingRef = useRef(false);

//   // ✅ Fetch initial 5 images by category
//   useEffect(() => {
//     const fetchImages = async () => {
//       try {
//         const res = await axios.get(
//           `${BASE_URL}/api/images/category/${encodeURIComponent(effectiveCategory)}?page=1&limit=5${eventQuery}`
//         );
//         let data = res.data || [];
//         // If calendarEventId filter returned fewer than 5, also fetch without it to fill up
//         if (calendarEventId && data.length < 5) {
//           try {
//             const res2 = await axios.get(
//               `${BASE_URL}/api/images/category/${encodeURIComponent(effectiveCategory)}?page=1&limit=5`
//             );
//             const extra = (res2.data || []).filter(
//               (img) => !data.some((d) => d._id === img._id || d.url === img.url)
//             );
//             data = [...data, ...extra].slice(0, 5);
//           } catch (_) {}
//         }
//         setImages(data);
//         setHasMore(data.length === 5);
//         setPage(1);
//       } catch (err) {
//         console.error("Error fetching images:", err);
//       }
//     };
//     fetchImages();
//   }, [effectiveCategory, eventQuery]);

//   // ✅ Load more images function
//   const loadMoreImages = async () => {
//     if (loading || !hasMore) return;
//     setLoading(true);
//     try {
//       const nextPage = page + 1;
//       const res = await axios.get(`${BASE_URL}/api/images/category/${encodeURIComponent(effectiveCategory)}?page=${nextPage}&limit=5${eventQuery}`);
//       const newImages = res.data;
//       setImages(prev => [...prev, ...newImages]);
//       setPage(nextPage);
//       setHasMore(newImages.length === 5);
//     } catch (err) {
//       console.error("Error loading more images:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ✅ Scroll to direction
//   const scrollTo = async (direction) => {
//     if (!ref.current) return;
//     const scrollAmount = 240 + 16;
//     if (direction === "next" && hasMore && !loading) {
//       const { scrollLeft, scrollWidth, clientWidth } = ref.current;
//       // Near end — load more first, then scroll
//       if (scrollLeft + clientWidth + scrollAmount >= scrollWidth - 50) {
//         await loadMoreImages();
//       }
//     }
//     ref.current.scrollBy({
//       left: direction === "prev" ? -scrollAmount : scrollAmount,
//       behavior: "smooth",
//     });
//   };

//   // ✅ Handle scroll visibility and lazy loading
//   const handleScroll = () => {
//     if (!ref.current) return;
//     const { scrollLeft, scrollWidth, clientWidth } = ref.current;
//     setCanScrollPrev(scrollLeft > 0);
//     setCanScrollNext(scrollLeft + clientWidth < scrollWidth - 5);
//     if (!scrollTickingRef.current) {
//       scrollTickingRef.current = true;
//       requestAnimationFrame(() => {
//         sessionStorage.setItem(`homeSliderScroll:${effectiveCategory}:${calendarEventId || "all"}`, String(scrollLeft));
//         scrollTickingRef.current = false;
//       });
//     }
//     // Check if scrolled near the end for lazy loading
//     if (scrollLeft + clientWidth >= scrollWidth - 100 && hasMore && !loading) {
//       loadMoreImages();
//     }
//   };

//   // Re-attach scroll listener whenever hasMore/loading changes so closure is fresh
//   useEffect(() => {
//     const slider = ref.current;
//     if (!slider) return;
//     slider.addEventListener("scroll", handleScroll);
//     return () => slider.removeEventListener("scroll", handleScroll);
//   }, [hasMore, loading]);

//   // Real-time: when admin adds/deletes images, refresh this slider
//   useEffect(() => {
//     const handler = ({ category: updatedCategory } = {}) => {
//       if (updatedCategory && updatedCategory.toLowerCase() !== effectiveCategory.toLowerCase()) return;
//       // Reset and re-fetch first page
//       setPage(1);
//       setHasMore(true);
//       axios.get(`${BASE_URL}/api/images/category/${encodeURIComponent(effectiveCategory)}?page=1&limit=5${eventQuery}`)
//         .then(res => {
//           let data = res.data || [];
//           setImages(data);
//           setHasMore(data.length === 5);
//         })
//         .catch(() => {});
//     };
//     socket.on('imageUpdated', handler);
//     return () => socket.off('imageUpdated', handler);
//   }, [effectiveCategory, eventQuery]);

//   // ✅ Close modal & menus on ESC key press
//   useEffect(() => {
//     const handleEsc = (e) => {
//       if (e.key === "Escape") {
//         setModalImage(null);
//         setDownloadOpen(false);
//       }
//     };
//     window.addEventListener("keydown", handleEsc);
//     return () => window.removeEventListener("keydown", handleEsc);
//   }, []);

//   useEffect(() => {
//     const saved = sessionStorage.getItem(`homeSliderScroll:${effectiveCategory}:${calendarEventId || "all"}`);
//     if (!ref.current || !saved) return;
//     const x = Number(saved);
//     if (!Number.isFinite(x)) return;
//     requestAnimationFrame(() => {
//       if (ref.current) ref.current.scrollLeft = x;
//     });
//   }, [effectiveCategory, images.length, calendarEventId]);

//   const handleImageClick = async (imgUrl) => {
//     const encodedCategory = encodeURIComponent(effectiveCategory);
//     navigate(`/image-view/${encodedCategory}`, { state: { selectedImage: imgUrl, images } });
//   };

//   const closeModal = () => setModalImage(null);


//   return (
//     <div className={styles.sliderSection}>
//       <div className={styles.sliderHeader}>
//         <h1 className={styles.sliderTitle}>{title}</h1>
//         <Link to={`/category/${encodeURIComponent(effectiveCategory)}`} className={styles.sliderMore}>
//           More
//         </Link>
//       </div>

//       <hr className={styles.sliderDivider} />

//       <div className={styles.sliderWrapper}>
//         {canScrollPrev && (
//           <button className={`${styles.sliderBtn} ${styles.prevBtn}`} onClick={() => scrollTo("prev")}>
//             <FaChevronLeft />
//           </button>
//         )}

//         <ul ref={ref} className={styles.sliderList}>
//           {images.map((img, index) => (
//             <li key={index} className={styles.sliderItem}>
//               <Card className={styles.sliderCard}>
//                 <CardActionArea onClick={() => handleImageClick(img.url)}>
//                   <div className={styles.cardGroup}>
//                     <CardMedia
//                       component="img"
//                       image={img.url}
//                       alt={`Image ${index + 1}`}
//                       className={styles.cardImg}
//                     />
//                     <div className={styles.cardOverlay}>
//                       <div className={styles.overlayLabel}>View</div>
//                     </div>
//                   </div>
//                 </CardActionArea>
//               </Card>
//             </li>
//           ))}
//           {loading && (
//             <li className={styles.loadingItem}>
//               <div className={styles.loadingSpinner}>
//                 <div className={styles.spinner}></div>
//                 <p>Loading...</p>
//               </div>
//             </li>
//           )}
//         </ul>

//         {/* Modal preview */}
//         {modalImage && (
//           <div className={shared.overlay} onClick={closeModal}>
//             <button className={shared.close} onClick={closeModal}>×</button>
//             <div className={shared.card} ref={cardRef} onClick={(e) => e.stopPropagation()}>
//               <div className={shared.media}>
//                 <img src={modalImage} alt="preview" />
//               </div>
//               <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
//                 {downloadOpen && (
//                   <DownloadMenu image={modalImage} onClose={() => setDownloadOpen(false)} anchorStyle={menuAnchor} />
//                 )}
//               </div>
//               <div className={shared.actionsBottom}>
//                 <button ref={downloadBtnRef} className={`${shared.btn} ${shared.ghost}`} onClick={(e) => {
//                   e.stopPropagation();
//                   if (!downloadOpen) {
//                     const cardRect = cardRef.current?.getBoundingClientRect();
//                     const btnRect = downloadBtnRef.current?.getBoundingClientRect();
//                       if (cardRect && btnRect) {
//                         const leftViewport = btnRect.left + btnRect.width / 2;
//                         const topViewport = btnRect.top; // anchor at button top
//                         // translate up by 110% so the menu sits slightly above the button
//                         setMenuAnchor({ left: `${leftViewport}px`, top: `${topViewport}px`, transform: 'translate(-50%, -110%)' });
//                       } else {
//                         setMenuAnchor({ left: '50%', top: '50%', transform: 'translate(-50%, -100%)' });
//                       }
//                   }
//                   setDownloadOpen(open => !open);
//                 }}>Download</button>
//                 <button className={`${shared.btn} ${shared.primary}`} onClick={() => { navigate('/edit', { state: { image: modalImage, category: effectiveCategory } }); }}>Edit</button>
//               </div>
//             </div>
//           </div>
//         )}

//         {(canScrollNext || hasMore) && (
//           <button className={`${styles.sliderBtn} ${styles.nextBtn}`} onClick={() => scrollTo("next")}>
//             <FaChevronRight />
//           </button>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Sliders;
