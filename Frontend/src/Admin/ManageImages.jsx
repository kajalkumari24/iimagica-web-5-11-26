import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import adminApi from "../utils/adminApi";
import styles from "./ManageImages.module.css";
import adminStyles from "./AdminHome.module.css";
import { useNavigate } from "react-router-dom";
import { FaTrash, FaDownload, FaEye, FaCloudUploadAlt } from "react-icons/fa";
import ConfirmModal from "./components/ConfirmModal";
import SkeletonLoader from "./components/SkeletonLoader";
import CategoryDropdown from './components/CategoryDropdown';

const PAGE_SIZE = 3;

function ManageImages({
  forcedCategory = "",
  pageTitle = "Image Management",
  hideCategoryControls = false,
}) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [imagePreviewData, setImagePreviewData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [totalImages, setTotalImages] = useState(0);
  const [bulkProgress, setBulkProgress] = useState({ show: false, current: 0, total: 0, operation: '' });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analytics, setAnalytics] = useState({ storageUsed: 0, totalFiles: 0 });
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagModalImage, setTagModalImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({ show: false, current: 0, total: 0, currentFile: '' });
  const [maxFileSize] = useState(10 * 1024 * 1024); // 10MB per file
  const [maxFiles] = useState(50); // 50 files per upload
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreTriggerRef = useRef(null);

  const closeUploadPreview = useCallback(() => {
    setPreviewOpen(false);
    setPreviewFiles([]);
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = null;
  }, []);

  const categoryNames = useMemo(() => {
    return (categories || [])
      .map((cat) => (typeof cat === "string" ? cat : cat?.name))
      .map((name) => String(name || "").trim())
      .filter(Boolean);
  }, [categories]);

  useEffect(() => {
    if (forcedCategory) setSelectedCategory(forcedCategory);
  }, [forcedCategory]);

  useEffect(() => {
    if (forcedCategory) return;
    if (categoryNames.length === 0) return;

    const normalizedSelected = String(selectedCategory || "").trim().toLowerCase();
    const isCurrentValid = categoryNames.some(
      (name) => name.toLowerCase() === normalizedSelected
    );

    if (!normalizedSelected || !isCurrentValid) {
      setSelectedCategory(categoryNames[0]);
    }
  }, [categoryNames, forcedCategory, selectedCategory]);


const fetchCategories = async () => {
  try {
    const res = await adminApi.get(`/api/categories/detailed`);
    // console.log('ManageImages - Fetched categories:', res.data);
    setCategories(res.data || []);
  } catch (err) {
    console.error("Error fetching categories:", err);
    addToast('Failed to load categories', 'error');
  }
};

// Fetch analytics
const fetchAnalytics = async () => {
  try {
    setAnalytics({ storageUsed: 1024 * 1024 * 50, totalFiles: totalImages });
  } catch (err) {
    console.error('Analytics fetch error:', err);
  }
};

// Tag management
const addTagToImage = async (imageId, tag) => {
  try {
    addToast('Tag added', 'success');
  } catch (err) {
    addToast('Failed to add tag', 'error');
  }
};

  const fetchImages = async (
    category,
    searchTerm = '',
    currentSortBy = sortBy,
    currentSortOrder = sortOrder,
    pageNum = 1,
    append = false
  ) => {
    if (!category) return;
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: PAGE_SIZE,
        sortBy: currentSortBy,
        sortOrder: currentSortOrder,
        ...(searchTerm && { search: searchTerm })
      });
      const res = await adminApi.get(`/api/images/category/${category}?${params}`);
      const newImages = res.data || [];
      if (append) {
        setImages(prev => [...prev, ...newImages]);
      } else {
        setImages(newImages);
      }
      setHasMore(newImages.length === PAGE_SIZE);
      setPage(pageNum);
      
      // Get total count
      if (!append || pageNum === 1) {
        const countRes = await adminApi.get(`/api/images/category/${category}/count`);
        setTotalImages(countRes.data?.data?.count || countRes.data.count || 0);
      }
    } catch (err) {
      console.error("Error fetching images:", err);
      addToast('Failed to load images', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  const fileInputRef = useRef(null);

  // derive a friendly name for an image: prefer public_id, then filename from URL, then _id
  const getImageDisplayName = (img) => {
    if (!img) return '';
    let name = '';
    // prefer public_id but only its basename (no folder path)
    if (img.public_id) {
      const s = img.public_id.toString();
      name = s.includes('/') ? s.substring(s.lastIndexOf('/') + 1) : s;
    } else if (img.filename) {
      const s = img.filename.toString();
      name = s.includes('/') ? s.substring(s.lastIndexOf('/') + 1) : s;
    } else if (img.url) {
      try {
        const p = new URL(img.url).pathname;
        name = p.substring(p.lastIndexOf('/') + 1);
      } catch (e) {
        const parts = (img.url || '').split('/');
        name = parts[parts.length - 1] || '';
      }
    } else {
      name = img._id || '';
    }
    // remove leading timestamp prefix like "1758001524118-"
    name = name.replace(/^\d+-\s*/, '');
    return name;
  };
  const handleFileChange = (e) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
    const imageFiles = selectedFiles.filter((f) => f.type.startsWith("image/"));
    
    // Check file count limit
    if (imageFiles.length > maxFiles) {
      addToast(`Maximum ${maxFiles} files allowed per upload`, 'error');
      return;
    }
    
    // Check file size limit
    const oversizedFiles = imageFiles.filter(f => f.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      addToast(`Files must be under ${maxFileSize / 1024 / 1024}MB each`, 'error');
      return;
    }
    
    if (imageFiles.length === 0) {
      addToast('Please select image files only');
      return;
    }
    
    setFiles(imageFiles);
    setPreviewFiles(imageFiles);
    setPreviewOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const dt = e.dataTransfer;
    if (!dt || !dt.files) return;
    const incoming = Array.from(dt.files).filter((f) => f.type.startsWith("image/"));
    if (incoming.length === 0) {
      addToast('Please drop image files only');
      return;
    }
    setFiles(incoming);
    setPreviewFiles(incoming);
    setPreviewOpen(true);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };

  const handleUpload = async () => {
    if (!selectedCategory || files.length === 0) {
      addToast('Select category and choose files to upload');
      return;
    }
    
    setUploadProgress({ show: true, current: 0, total: files.length, currentFile: '' });
    
    try {
      setUploading(true);
      
      // Upload files in batches of 5
      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const formData = new FormData();
        
        batch.forEach(file => {
          formData.append("images", file);
        });
        formData.append("category", selectedCategory);
        
        setUploadProgress(prev => ({ 
          ...prev, 
          currentFile: batch[0].name,
          current: i 
        }));
        
        await adminApi.post(`/api/images/upload`, formData, {
          timeout: 60000,
          onUploadProgress: (p) => {
            if (!p.total) return;
            const pct = Math.round((p.loaded / p.total) * 100);
            setUploadProgress(prev => ({ ...prev, currentFile: batch[0].name, current: i, percent: pct }));
          }
        });
        
        setUploadProgress(prev => ({ 
          ...prev, 
          current: Math.min(i + batchSize, files.length)
        }));
      }
      
      addToast(`${files.length} image(s) uploaded successfully`, 'success');
      setFiles([]);
      setPreviewFiles([]);
      setPreviewOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = null;
      fetchImages(selectedCategory, searchTerm, sortBy, sortOrder, 1, false);
    } catch (err) {
      console.error("Error uploading images:", err);
      const msg = err?.response?.data?.message || err?.message || 'Upload failed';
      addToast(`Upload failed: ${msg}`, 'error');
    } finally {
      setUploading(false);
      setUploadProgress({ show: false, current: 0, total: 0, currentFile: '' });
    }
  };

  // Request deletion for a single image (will open confirm modal)
  const requestDeleteSingle = (id) => {
    setConfirmPayload({ type: 'single', id });
    setConfirmOpen(true);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const newIds = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      setSelectAll(newIds.length === images.length && images.length > 0);
      return newIds;
    });
  };

  const toggleSelectAll = () => {
    if (!selectAll) {
      const allIds = images.map((img) => img._id);
      setSelectedIds(allIds);
      setSelectAll(true);
    } else {
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  // Request deletion for selected images (opens confirm modal)
  const requestDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setConfirmPayload({ type: 'selected' });
    setConfirmOpen(true);
  };

  // Helper function to download an image robustly.
  // Tries to fetch the file as a blob (works around cross-origin/open-in-new-tab issues),
  // then creates an object URL and triggers a download. Falls back to opening the URL
  // in a new tab if fetching is not allowed.
  const downloadImage = async (url, filename) => {
    try {
      const res = await fetch(url, { mode: 'cors' });
      if (!res.ok) throw new Error('Network response not ok');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      a.remove();
      // release memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      // If fetch fails (CORS or other), fallback to opening the file in a new tab
      // so the user can still save it manually.
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  // Download selected images sequentially to avoid many parallel fetches
  const handleDownloadSelected = async () => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const img = images.find((i) => i._id === id);
      if (img && img.url) {
        const filename = getImageDisplayName(img);
        // eslint-disable-next-line no-await-in-loop
        await downloadImage(img.url, filename);
      }
    }
  };

  // Request delete all in category
  const requestDeleteAll = () => {
    if (!selectedCategory) return;
    setConfirmPayload({ type: 'all' });
    setConfirmOpen(true);
  };

  // perform confirm modal action
  const performConfirmAction = async () => {
    if (!confirmPayload) return;
    setConfirmLoading(true);
    try {
      if (confirmPayload.type === 'single') {
        const id = confirmPayload.id;
        await adminApi.delete(`/api/images/category/${selectedCategory}/${id}`);
        addToast('Image deleted successfully');
        setImages((prev) => prev.filter((img) => img._id !== id));
        fetchImages(selectedCategory, searchTerm, sortBy, sortOrder, 1, false);
      } else if (confirmPayload.type === 'selected') {
        setBulkProgress({ show: true, current: 0, total: selectedIds.length, operation: 'Deleting' });
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < selectedIds.length; i++) {
          const id = selectedIds[i];
          try {
            await adminApi.delete(`/api/images/category/${selectedCategory}/${id}`);
            successCount++;
          } catch (err) {
            console.error(`Failed to delete image ${id}:`, err);
            failCount++;
          }
          setBulkProgress(prev => ({ ...prev, current: i + 1 }));
        }
        
        setBulkProgress({ show: false, current: 0, total: 0, operation: '' });
        
        if (successCount > 0) {
          addToast(`${successCount} images deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`, successCount === selectedIds.length ? 'success' : 'warning');
        } else {
          addToast('Failed to delete images', 'error');
        }
        
        setSelectedIds([]);
        setSelectAll(false);
        fetchImages(selectedCategory, searchTerm, sortBy, sortOrder, 1, false);
      } else if (confirmPayload.type === 'all') {
        await adminApi.delete(`/api/images/category/${selectedCategory}`);
        addToast('All images deleted successfully');
        setImages([]);
        fetchImages(selectedCategory, searchTerm, sortBy, sortOrder, 1, false);
      }
    } catch (err) {
      console.error('Error performing delete:', err);
      addToast('Delete failed');
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmPayload(null);
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (previewOpen || imagePreviewOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [previewOpen, imagePreviewOpen]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;

      if (confirmOpen) {
        setConfirmOpen(false);
        setConfirmPayload(null);
        return;
      }

      if (showTagModal) {
        setShowTagModal(false);
        return;
      }

      if (showAnalytics) {
        setShowAnalytics(false);
        return;
      }

      if (imagePreviewOpen) {
        setImagePreviewOpen(false);
        return;
      }

      if (previewOpen) {
        closeUploadPreview();
      }
    };

    const hasOpenModal =
      confirmOpen ||
      showTagModal ||
      showAnalytics ||
      imagePreviewOpen ||
      previewOpen;

    if (hasOpenModal) window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmOpen, showTagModal, showAnalytics, imagePreviewOpen, previewOpen, closeUploadPreview]);

  // Category / sort change => reset and fetch first page
  useEffect(() => {
    if (!selectedCategory) {
      setImages([]);
      setTotalImages(0);
      setPage(1);
      setHasMore(false);
      return;
    }
    fetchImages(selectedCategory, searchTerm, sortBy, sortOrder, 1, false);
  }, [selectedCategory, sortBy, sortOrder]);

  // Debounced search (resets pagination)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (selectedCategory) {
        fetchImages(selectedCategory, searchTerm, sortBy, sortOrder, 1, false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadMoreImages = () => {
    if (!selectedCategory || loading || loadingMore || !hasMore) return;
    fetchImages(selectedCategory, searchTerm, sortBy, sortOrder, page + 1, true);
  };

  // Bottom-trigger lazy loading (same pattern as Home)
  useEffect(() => {
    const node = loadMoreTriggerRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!loading && !loadingMore && hasMore) {
          loadMoreImages();
        }
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, page, selectedCategory, searchTerm, sortBy, sortOrder]);

  useEffect(() => {
    const initializeData = async () => {
      await fetchCategories();
    };
    initializeData();
    
    // Listen for focus events to refresh categories when returning to this page
    const handleFocus = () => {
      fetchCategories();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Toast helper with type support
  const addToast = (message, type = 'info', timeout = 3000) => {
    const id = Date.now().toString();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout);
  };

  // Preview modal confirm handler
  const confirmUploadFromPreview = async () => {
    await handleUpload();
  };

  return (
    <div className={styles.container}>
      {loading ? (
        <SkeletonLoader />
      ) : (
      <>
      {/* Fixed admin header */}
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
        <div>
          <div className={adminStyles.activeTitle} style={{ fontSize: '1.75rem', fontWeight: 700 }}>{pageTitle}</div>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.analyticsBtn}
            onClick={() => { setShowAnalytics(true); fetchAnalytics(); }}
          >
            📊 Analytics
          </button>
          <select 
            value={`${sortBy}-${sortOrder}`} 
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className={styles.sortSelect}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="filename-asc">Name A-Z</option>
            <option value="filename-desc">Name Z-A</option>
          </select>
          <div className={styles.searchContainer}>
            <input
              className={styles.searchInput}
              placeholder="Search images, filenames..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent} style={{ marginTop: 80 }}>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarCard}>
            <div className={styles.toolbarCardInner}>
              <div className={styles.leftGroup}>
                <div className={`${styles.selectPill} ${selectedIds.length > 0 ? styles.selectPillActive : ''}`} onClick={toggleSelectAll} style={{cursor:'pointer'}}>
                  <input type="checkbox" checked={selectAll} readOnly />
                  <div className={styles.selectPillLabel}>{selectedIds.length ? `${selectedIds.length} selected` : 'Select all'}</div>
                </div>

                {!hideCategoryControls && (
                  <>
                    <div className={styles.categoryControl}>
                      <CategoryDropdown
                        categories={categories}
                        value={selectedCategory}
                        onChange={(v) => { setSelectedCategory(v); }}
                      />
                    </div>

                    <button className={styles.addCategoryBtn} onClick={async () => {
                      await fetchCategories(); // Refresh categories first
                      navigate('/admin/categories');
                    }}>Manage Categories</button>
                  </>
                )}
              </div>

              <div className={styles.rightGroup}>
                <div className={styles.statsText}>{totalImages} images</div>
                <button className={styles.exportBtn} onClick={() => {
                  if (!images.length) return;
                  const csvData = images.map(img => ({
                    Filename: getImageDisplayName(img),
                    Category: selectedCategory,
                    URL: img.url,
                    'Created Date': new Date(img.createdAt || Date.now()).toLocaleDateString()
                  }));
                  
                  const csvContent = [
                    Object.keys(csvData[0]).join(','),
                    ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
                  ].join('\n');
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `images-${selectedCategory}-${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }} disabled={!images.length}>Export</button>
                <button className={styles.uploadBtn} onClick={() => { fileInputRef.current?.click(); }} disabled={!selectedCategory}>Upload</button>
                <button className={styles.deleteBtn} onClick={requestDeleteAll} disabled={!selectedCategory}>Delete All</button>
              </div>
            </div>
          </div>
        </div>

        {/* Prevent body scroll when modal is open */}
        {previewOpen || imagePreviewOpen ? (
          <style>{`body { overflow: hidden; }`}</style>
        ) : null}

        {/* Upload Section / Dropzone */}
        <div style={{marginTop:12}}>
          {!selectedCategory ? (
            <div className={styles.emptyState}>
              <p className={styles.helperText}>Please select a category from the toolbar to manage images.</p>
            </div>
          ) : (
            <div
              className={`${styles.uploadSection} ${styles.dropzone} ${dragActive ? styles.dragActive : ''}`}
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
            >
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <FaCloudUploadAlt size={24} color="#0f172a" />
                <div>
                  <div style={{fontWeight:700, fontSize:16}}>Drag & drop images here</div>
                  <div style={{color:'#64748b', fontSize:13}}>Drop files to upload to the selected category, or click to browse</div>
                  <div className={styles.uploadLimits}>
                    <span>📁 Max {maxFiles} files</span>
                    <span>📏 Max {maxFileSize / 1024 / 1024}MB each</span>
                  </div>
                </div>
              </div>
              <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} accept="image/*" style={{display:'none'}} />
            </div>
          )}
        </div>

        {/* Bulk Progress Modal */}
        {bulkProgress.show && (
          <div className={styles.modalOverlay}>
            <div className={styles.progressModal}>
              <h3>🗑️ {bulkProgress.operation} Images</h3>
              <div className={styles.progressInfo}>
                <div>{bulkProgress.current} of {bulkProgress.total} images</div>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{width: `${(bulkProgress.current / bulkProgress.total) * 100}%`}}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Progress Modal */}
        {uploadProgress.show && (
          <div className={styles.modalOverlay}>
            <div className={styles.progressModal}>
              <h3>📤 Uploading Images</h3>
              <div className={styles.progressInfo}>
                <div>Current: {uploadProgress.currentFile}</div>
                <div>{uploadProgress.current} of {uploadProgress.total} files</div>
              </div>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{width: `${(uploadProgress.current / uploadProgress.total) * 100}%`}}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {previewOpen && previewFiles && previewFiles.length > 0 && (
          <div 
            className={styles.modalOverlay} 
            onClick={() => setPreviewOpen(false)}
            onWheel={(e) => e.stopPropagation()}
          >
            <div 
              className={styles.modalContent} 
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              <div style={{display:'flex', alignItems:'center', marginBottom:16}}>
                <div className={styles.confirmIcon} style={{background: 'linear-gradient(135deg, rgba(14,165,164,0.12), rgba(6,182,212,0.08))', color: 'var(--color-primary)'}}><FaCloudUploadAlt size={20} /></div>
                <div>
                  <div style={{color:'#374151', fontSize:16, fontWeight:600}}>Upload Preview - Confirm before uploading to "{selectedCategory}".</div>
                </div>
              </div>
              <div style={{display:'flex', justifyContent:'center', marginBottom:16}}>
                <div style={{background:'white', padding:'16px', borderRadius:'12px', boxShadow:'var(--shadow-sm)', border:'1px solid var(--color-neutral-200)'}}>
                  {/* previewFiles[0] is guarded above */}
                  <img src={URL.createObjectURL(previewFiles[0])} alt={previewFiles[0].name} style={{maxWidth:'100%', maxHeight:'200px', borderRadius:'8px', display:'block'}} />
                  <div style={{marginTop:8, color:'#64748b', fontSize:13, textAlign:'center', wordWrap:'break-word', maxWidth:'200px', margin:'8px auto 0'}}>{previewFiles[0].name}</div>
                </div>
              </div>
              <div style={{display:'flex', justifyContent:'center', gap:12}}>
                <button className={`${styles.smallBtn} ${styles.modalCancelBtn}`} style={{padding:'10px 16px', fontSize:'14px'}} onClick={closeUploadPreview} disabled={uploading}>Cancel</button>
                <button
                  className={`${styles.smallBtn} ${styles.modalConfirmBtn}`}
                  style={{padding:'10px 16px', fontSize:'14px', display:'inline-flex', alignItems:'center', gap:8}}
                  onClick={confirmUploadFromPreview}
                  disabled={!previewFiles || previewFiles.length === 0 || uploading}
                >
                  {uploading ? (
                    <>
                      <span className={styles.inlineSpinner} aria-hidden />
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {imagePreviewOpen && (
          <div 
            className={styles.modalOverlay} 
            onClick={() => setImagePreviewOpen(false)}
            onWheel={(e) => e.stopPropagation()}
          >
            <div 
              className={`${styles.modalContent} ${styles.imagePreviewModal}`} 
              onClick={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              <button className={styles.closeBtn} onClick={() => setImagePreviewOpen(false)}>&times;</button>
              <div className={styles.imagePreviewContainer}>
                <img src={imagePreviewUrl} alt="Preview" className={styles.previewImage} />
              </div>
            </div>
          </div>
        )}

        {/* Analytics Modal */}
        {showAnalytics && (
          <div className={styles.modalOverlay} onClick={() => setShowAnalytics(false)}>
            <div className={styles.analyticsModal} onClick={(e) => e.stopPropagation()}>
              <h3>📊 Analytics</h3>
              <div className={styles.analyticsContent}>
                <div className={styles.statCard}>
                  <h4>Storage Used</h4>
                  <p>Loading...</p>
                </div>
                <div className={styles.statCard}>
                  <h4>Total Files</h4>
                  <p>{totalImages}</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setShowAnalytics(false)}>&times;</button>
            </div>
          </div>
        )}

        {/* Tag Modal */}
        {showTagModal && tagModalImage && (
          <div className={styles.modalOverlay} onClick={() => setShowTagModal(false)}>
            <div className={styles.tagModal} onClick={(e) => e.stopPropagation()}>
              <h3>🏷️ Add Tag</h3>
              <input 
                type="text" 
                placeholder="Enter tag name"
                className={styles.tagInput}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    addTagToImage(tagModalImage._id, e.target.value.trim());
                    e.target.value = '';
                    setShowTagModal(false);
                  }
                }}
              />
              <button className={styles.closeBtn} onClick={() => setShowTagModal(false)}>&times;</button>
            </div>
          </div>
        )}

        {/* Toasts */}
        <div className={styles.toastContainer} aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className={`${styles.toast} ${styles[t.type] || ''}`}>{t.message}</div>
          ))}
        </div>

        {/* Image List */}
        {loading ? (
          <p className={styles.helperText}>Loading images...</p>
        ) : images.length > 0 ? (
          <>
            <div className={styles.imageGrid}>
              {images.map((img) => (
                <div key={img._id} className={styles.imageCard}>
                  <div className={styles.checkboxWrap}>
                    <input type="checkbox" checked={selectedIds.includes(img._id)} onChange={() => toggleSelect(img._id)} />
                  </div>
                  <img src={img.url} alt={img.filename || 'image'} />
                  <div className={styles.overlay}>
                    <div className={styles.overlayActions}>
                      <button className={`${styles.iconBtn} ${styles.primary}`} onClick={() => { setImagePreviewUrl(img.url); setImagePreviewData(img); setImagePreviewOpen(true); }} title="Preview"><FaEye/></button>
                      <button className={`${styles.iconBtn} ${styles.primary}`} onClick={() => downloadImage(img.url, getImageDisplayName(img))} title="Download"><FaDownload/></button>
                      <button className={`${styles.iconBtn} ${styles.secondary}`} onClick={() => { setTagModalImage(img); setShowTagModal(true); }} title="Tags">🏷️</button>
                      <button className={`${styles.iconBtn} ${styles.danger}`} onClick={() => requestDeleteSingle(img._id)} title="Delete"><FaTrash/></button>
                    </div>
                  </div>
                  <div className={styles.cardFooter}>
                    <div className={styles.helperText}>{getImageDisplayName(img)}</div>
                  </div>
                </div>
              ))}
            </div>
            {loadingMore && hasMore && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 }}>
                <span className={styles.inlineSpinner} aria-hidden />
                <span className={styles.helperText}>Loading next {PAGE_SIZE} images...</span>
              </div>
            )}
            {hasMore && <div ref={loadMoreTriggerRef} style={{ height: 1 }} />}
          </>
        ) : (
          selectedCategory && <div className={styles.emptyState}><p className={styles.helperText}>No images found in this category.</p></div>
        )}
        {/* Selection action bar (appears when images are selected) */}
        {selectedIds.length > 0 && (
          <div className={styles.selectionBar}>
            <div>{selectedIds.length} selected</div>
            <div className={styles.selectionBarActions}>
              <button className={`${styles.btnPrimary}`} onClick={handleDownloadSelected}><FaDownload />Download</button>
              <button className={`${styles.btnDanger}`} onClick={requestDeleteSelected}><FaTrash />Delete</button>
            </div>
          </div>
        )}
        {/* Confirm modal for deletes */}
        <ConfirmModal
          open={confirmOpen}
          title={confirmPayload?.type === 'selected' ? 'Delete selected images' : confirmPayload?.type === 'all' ? 'Delete all images' : 'Delete image'}
          message={
            confirmPayload?.type === 'selected'
              ? `Delete ${selectedIds.length} selected images? This action cannot be undone.`
              : confirmPayload?.type === 'all'
              ? `Delete all images in category "${selectedCategory}"? This action cannot be undone.`
              : 'Delete this image? This action cannot be undone.'
          }
          onConfirm={performConfirmAction}
          onCancel={() => { setConfirmOpen(false); setConfirmPayload(null); }}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          loading={confirmLoading}
        />
      </div>
      </>
      )}
    </div>
  );
}

export default ManageImages;



