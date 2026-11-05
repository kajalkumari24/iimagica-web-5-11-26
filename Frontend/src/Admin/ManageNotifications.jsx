import React, { useEffect, useState, useRef } from "react";
import adminApi from "../utils/adminApi";
import styles from "./ManageNotifications.module.css";
import adminStyles from "./AdminHome.module.css";
import { FaTrash, FaPlus, FaClock, FaCalendarAlt, FaTag } from "react-icons/fa";
import AdminLayout from "./AdminLayout";
import ConfirmModal from "./components/ConfirmModal";
import SkeletonLoader from "./components/SkeletonLoader";
import CategoryDropdown from "./components/CategoryDropdown";

const PROFILE_TYPE_OPTIONS = [
  { value: "global", label: "Global" },
  { value: "business", label: "Business" },
  { value: "professional", label: "Professional" },
  { value: "personal", label: "Personal" },
  { value: "political", label: "Political" },
  { value: "social", label: "Social" },
  { value: "brand", label: "Brand" },
];

const normalizeTargetProfileType = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || normalized === "all") return "global";
  return normalized;
};

const formatTargetProfileType = (value = "") => {
  const normalized = normalizeTargetProfileType(value);
  const match = PROFILE_TYPE_OPTIONS.find((option) => option.value === normalized);
  return match?.label || (normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Global");
};

// const BASE_URL = "http://localhost:5000";

function ManageNotifications() {
  const [showForm, setShowForm] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [form, setForm] = useState({
    title: "",
    desc: "",
    date: "",
    time: "",
    category: "",
    targetProfileType: "global",
    coverImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [titleFilter, setTitleFilter] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc'); // 'asc' | 'desc'
  const [errors, setErrors] = useState({});
  const addModalRef = useRef(null);
  const firstInputRef = useRef(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImageSrc, setPreviewImageSrc] = useState(null);
  const fileInputRef = useRef(null);
  // table-only mode: cards UI removed
  const [dbParties, setDbParties] = useState([]);
  const [dbProfessionalTypes, setDbProfessionalTypes] = useState([]);
  const [dbBrandTypes, setDbBrandTypes] = useState([]);

  // ✅ Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await adminApi.get(`/api/notifications`);
      setNotifications(res.data);
      setAllNotifications(res.data);
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Fetch profile types for dynamic category dropdown
    const fetchProfileTypes = async () => {
      try {
        const [partiesRes, profRes, brandRes] = await Promise.all([
          adminApi.get('/api/profile-types/political'),
          adminApi.get('/api/profile-types/professional'),
          adminApi.get('/api/profile-types/brand')
        ]);
        setDbParties(partiesRes.data?.data || partiesRes.data || []);
        setDbProfessionalTypes(profRes.data?.data || profRes.data || []);
        setDbBrandTypes(brandRes.data?.data || brandRes.data || []);
      } catch (err) {
        console.warn('Could not fetch profile types:', err);
      }
    };
    fetchProfileTypes();
  }, []);

  useEffect(() => {
    const anyModalOpen = showAddModal || confirmOpen || detailOpen || previewOpen;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (anyModalOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showAddModal, confirmOpen, detailOpen, previewOpen]);

  // ✅ Handle input change
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) setForm({ ...form, coverImage: files[0] });
    else {
      if (name === 'targetProfileType') {
        setForm({ ...form, targetProfileType: value, category: '' });
      } else {
        setForm({ ...form, [name]: value });
      }
    }
  };

  // preview selected image file for add modal
  useEffect(() => {
    if (!form.coverImage) { setPreviewSrc(null); return; }
    const url = URL.createObjectURL(form.coverImage);
    setPreviewSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [form.coverImage]);

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const dt = e.dataTransfer;
    if (!dt || !dt.files) return;
    const incoming = Array.from(dt.files).filter((f) => f.type.startsWith('image/'));
    if (incoming.length === 0) {
      setToasts((t) => [...t, { id: Date.now(), text: 'Please drop image files only', type: 'warn' }]);
      return;
    }
    // take the first image file for cover
    setForm((f) => ({ ...f, coverImage: incoming[0] }));
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };

  // keyboard handling: Esc to close active modals and basic focus trap
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (showAddModal) {
          setShowAddModal(false);
          setIsEditing(false);
          setEditingId(null);
        }
        if (detailOpen) setDetailOpen(false);
        if (previewOpen) setPreviewOpen(false);
        if (confirmOpen) {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }
      }
      // basic focus-trap: keep focus inside modal when open and Tab pressed
      if ((showAddModal || detailOpen) && e.key === 'Tab') {
        const modal = addModalRef.current;
        if (!modal) return;
        const focusable = modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showAddModal, detailOpen, previewOpen, confirmOpen]);

  // ✅ Create new notification
  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    // inline validations
    const newErrors = {};
    if (!form.title) newErrors.title = 'Title is required';
    if (!form.desc) newErrors.desc = 'Description is required';
    if (!form.date) newErrors.date = 'Date is required';
    if (!form.time) newErrors.time = 'Time is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      setToasts((t) => [...t, { id: Date.now(), text: 'Please fix validation errors', type: 'warn' }]);
      return;
    }
    setAddLoading(true);

    const formData = new FormData();
    // Append only defined fields to avoid sending 'null' strings
    if (form.title) formData.append('title', form.title);
    if (form.desc) formData.append('desc', form.desc);
    if (form.date) formData.append('date', form.date);
    if (form.time) formData.append('time', form.time);
    if (form.category) formData.append('category', form.category);
    formData.append('targetProfileType', normalizeTargetProfileType(form.targetProfileType));
    if (form.coverImage instanceof File) formData.append('coverImage', form.coverImage);
    formData.append('sendPush', sendPush ? 'true' : 'false');

    // Optimistic UI: update local list immediately
    let rollback = null;
    try {
      if (isEditing && editingId) {
        // optimistic patch
        const prev = notifications;
        const patched = notifications.map(n => n._id === editingId ? {
          ...n,
          title: form.title,
          desc: form.desc,
          date: form.date,
          time: form.time,
          category: form.category,
          targetProfileType: normalizeTargetProfileType(form.targetProfileType),
          coverImage: form.coverImage instanceof File ? (previewSrc||n.coverImage) : n.coverImage
        } : n);
        setNotifications(patched);
        rollback = () => setNotifications(prev);

        await adminApi.put(`/api/notifications/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setToasts((t) => [...t, { id: Date.now(), text: 'Notification updated', type: 'success' }]);
      } else {
        // create optimistic item
        const tempId = `temp-${Date.now()}`;
        const tempItem = {
          _id: tempId,
          title: form.title,
          desc: form.desc,
          date: form.date,
          time: form.time,
          category: form.category,
          targetProfileType: normalizeTargetProfileType(form.targetProfileType),
          coverImage: form.coverImage instanceof File ? previewSrc : '',
          createdAt: new Date().toISOString()
        };
        setNotifications((cur) => [tempItem, ...cur]);
        rollback = () => setNotifications((cur) => cur.filter(i => i._id !== tempId));

        const res = await adminApi.post(`/api/notifications`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        // replace temp item with real item
        setNotifications((cur) => cur.map(i => i._id === tempId ? res.data : i));
        setToasts((t) => [...t, { id: Date.now(), text: 'Notification added', type: 'success' }]);
      }

      setForm({ title: '', desc: '', date: '', time: '', category: '', targetProfileType: 'global', coverImage: null });
      setPreviewSrc(null);
      setShowAddModal(false);
      setIsEditing(false);
      setEditingId(null);
      // ensure allNotifications sync
      fetchNotifications();
    } catch (error) {
      console.error('❌ Error saving notification:', error);
      if (rollback) rollback();
      setToasts((t) => [...t, { id: Date.now(), text: isEditing ? 'Failed to update notification' : 'Failed to add notification', type: 'error' }]);
    } finally {
      setAddLoading(false);
    }
  };

  // ✅ Delete notification
    const handleDelete = async (id) => {
      // optimistic remove
      const prev = notifications;
      const prevAll = allNotifications;
      setNotifications((cur) => cur.filter(n => n._id !== id));
      setAllNotifications((cur) => cur.filter(n => n._id !== id));
      try {
        await adminApi.delete(`/api/notifications/${id}`);
        setToasts((t) => [...t, { id: Date.now(), text: 'Notification deleted', type: 'success' }]);
      } catch (error) {
        console.error('❌ Error deleting notification:', error);
        setNotifications(prev); // rollback
        setAllNotifications(prevAll); // rollback
        setToasts((t) => [...t, { id: Date.now(), text: 'Failed to delete', type: 'error' }]);
      } finally {
        setConfirmOpen(false);
        setConfirmTarget(null);
      }
  };

  const confirmDelete = (id) => {
    setConfirmTarget(id);
    setConfirmOpen(true);
  };

  // auto-remove toasts
  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map(t => setTimeout(() => {
      setToasts(current => current.filter(c => c.id !== t.id));
    }, 3500));
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  // derive category options from fetched notifications
  const categoryOptions = Array.from(new Set(allNotifications.map(n => n.category).filter(Boolean)));

  // Keep `allNotifications` as the source-of-truth and derive the visible list using filters + sort
  const getDisplayedNotifications = () => {
    let out = Array.isArray(allNotifications) ? [...allNotifications] : [];

    // global search (title or category)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      out = out.filter(n => (n.title||'').toLowerCase().includes(q) || (n.category||'').toLowerCase().includes(q));
    }

    // category filter (exact match)
    if (categoryFilter) {
      out = out.filter(n => (n.category||'').toLowerCase() === categoryFilter.toLowerCase());
    }

    // title column filter (partial)
    if (titleFilter && titleFilter.trim()) {
      const q = titleFilter.trim().toLowerCase();
      out = out.filter(n => (n.title||'').toLowerCase().includes(q));
    }

    // sorting
    if (sortBy) {
      out.sort((a, b) => {
        let va = a[sortBy];
        let vb = b[sortBy];
        // guard for undefined
        if (va == null) va = '';
        if (vb == null) vb = '';

        // parse dates for known fields
        if (sortBy === 'date' || sortBy === 'createdAt') {
          const da = new Date(va).getTime() || 0;
          const db = new Date(vb).getTime() || 0;
          return sortDir === 'asc' ? da - db : db - da;
        }

        // string compare
        const sa = String(va).toLowerCase();
        const sb = String(vb).toLowerCase();
        if (sa < sb) return sortDir === 'asc' ? -1 : 1;
        if (sa > sb) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return out;
  };

  // Toggle sorting for a column
  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  // compute displayed list once per render
  const displayed = getDisplayedNotifications();
  const totalCount = allNotifications.length;
  const categoriesCount = categoryOptions.length;
  const upcomingCount = allNotifications.filter((n) => {
    if (!n?.date) return false;
    const t = n.time ? n.time : '00:00';
    const dt = new Date(`${n.date}T${t}`);
    if (Number.isNaN(dt.getTime())) return false;
    return dt.getTime() > Date.now();
  }).length;

  return (
    <div className={styles.container}>
      {loading ? (
        <SkeletonLoader />
      ) : (
      <>
      {/* Top dashboard header (reused styles) */}
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`} style={{ zIndex: 10000 }}>
        <div>
          <div className={adminStyles.activeTitle} style={{ fontSize: "1.75rem", fontWeight: 700 }}>Notifications</div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 4 }}>Manage push notifications and announcements</div>
        </div>

        <div className={styles.headerActions}>
          <input
            className={styles.searchInput}
            placeholder="Search title or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className={styles.btnPrimary}
            onClick={() => {
              setIsEditing(false);
              setEditingId(null);
              setForm({ title: '', desc: '', date: '', time: '', category: '', targetProfileType: 'global', coverImage: null });
              setPreviewSrc(null);
              setShowAddModal(true);
            }}
          >
            <FaPlus /> New Notification
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Notifications</div>
            <div className={styles.statValue}>{totalCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Upcoming</div>
            <div className={styles.statValue}>{upcomingCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Categories</div>
            <div className={styles.statValue}>{categoriesCount}</div>
          </div>
        </div>

        <div className={styles.controlsCardInner}>
          <div className={styles.leftGroup}>
            <CategoryDropdown
              options={categoryOptions}
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              placeholder="All Notifications"
              style={{ zIndex: 9999 }}
            />
            <input
              className={styles.titleFilter}
              placeholder="Filter title"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
            />
          </div>
        </div>

      {/* Add modal (polished popup) */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)} style={{ zIndex: 10001 }}>
          <div className={styles.modalDialog} role="dialog" aria-modal="true" aria-labelledby="addNotifTitle" onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowAddModal(false)} aria-label="Close">✕</button>
              <div className={styles.modalBody} ref={addModalRef}>
              <div className={styles.modalLeft}>
                <div className={styles.previewBox}>
                  {previewSrc ? (
                    <img src={previewSrc} alt="preview" className={styles.previewImage} />
                  ) : (
                    <div className={styles.previewPlaceholder}>
                      <div style={{ fontWeight: 700, marginBottom: 8 }}>Cover image</div>
                      <div style={{ color: '#64748b', fontSize: 13 }}>Optional — upload an image to show on the notification card.</div>
                    </div>
                  )}
                </div>

                <div
                  className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  <input ref={fileInputRef} type="file" name="coverImage" onChange={handleChange} accept="image/*" />
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexDirection: 'column' }}>
                    <div className={styles.dropzoneIcon}>📤</div>
                    <div className={styles.dropzoneText}>{form.coverImage ? form.coverImage.name : 'Choose image or drag here'}</div>
                    <div className={styles.dropzoneSubtext} style={{ fontSize: 13, color: '#64748b' }}>Optional — upload an image to show on the notification card.</div>
                  </div>
                </div>
              </div>

              <div className={styles.modalRight}>
                <h3 id="addNotifTitle" style={{ marginTop: 0 }}>{isEditing ? 'Edit Notification' : 'Add Notification'}</h3>
                <form className={`${styles.form}`} onSubmit={handleSubmit}>
                  <input
                    ref={firstInputRef}
                    type="text"
                    name="title"
                    placeholder="Title (required)"
                    value={form.title}
                    onChange={handleChange}
                    required
                  />
                  {errors.title && <div className={styles.fieldError}>{errors.title}</div>}
                  <textarea
                    name="desc"
                    placeholder="Description (required)"
                    value={form.desc}
                    onChange={handleChange}
                    required
                  />
                  {errors.desc && <div className={styles.fieldError}>{errors.desc}</div>}
                  <div className={styles.row}>
                    <input type="date" name="date" value={form.date} onChange={handleChange} required />
                    {errors.date && <div className={styles.fieldError}>{errors.date}</div>}
                    <input type="time" name="time" value={form.time} onChange={handleChange} required />
                    {errors.time && <div className={styles.fieldError}>{errors.time}</div>}
                  </div>
                  <select
                    name="targetProfileType"
                    value={form.targetProfileType}
                    onChange={handleChange}
                  >
                    {PROFILE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  {form.targetProfileType === 'political' ? (
                    <select name="category" value={form.category} onChange={handleChange}>
                      <option value="">Select Political Party (Optional)</option>
                      {dbParties.map(p => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
                    </select>
                  ) : form.targetProfileType === 'professional' ? (
                    <select name="category" value={form.category} onChange={handleChange}>
                      <option value="">Select Profession (Optional)</option>
                      {dbProfessionalTypes.map(p => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
                    </select>
                  ) : form.targetProfileType === 'brand' ? (
                    <select name="category" value={form.category} onChange={handleChange}>
                      <option value="">Select Brand (Optional)</option>
                      {dbBrandTypes.map(p => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="category"
                      placeholder="Category (optional)"
                      value={form.category}
                      onChange={handleChange}
                    />
                  )}

                  {!isEditing && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, marginTop: '10px', color: '#0f766e' }}>
                      <input 
                        type="checkbox" 
                        checked={sendPush} 
                        onChange={(e) => setSendPush(e.target.checked)} 
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      🔔 Also send as Push Notification to users
                    </label>
                  )}

                  <div className={styles.modalActions}>
                    <button type="button" className={styles.btnSecondary} onClick={() => { setShowAddModal(false); setForm({ title: '', desc: '', date: '', time: '', category: '', targetProfileType: 'global', coverImage: null }); setPreviewSrc(null); setIsEditing(false); setEditingId(null); }}>Cancel</button>
                    <button type="submit" disabled={addLoading || !form.title || !form.desc || !form.date || !form.time} className={`${styles.uploadActionBtn} ${addLoading ? styles.loading : ''}`}>
                      {addLoading ? (
                        <span className={styles.spinner} />
                      ) : (
                        <FaPlus />
                      )}
                      <span>{isEditing ? 'Save Changes' : 'Add Notification'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification List (cards or table) */}
      {/* Table-only notifications list */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cover</th>
              <th className={styles.sortable} onClick={() => toggleSort('title')}>Title & Description <span className={styles.sortIcon}>{sortBy==='title' ? (sortDir==='asc' ? '▲' : '▼') : '↕'}</span></th>
              <th className={styles.sortable} onClick={() => toggleSort('date')}>Date <span className={styles.sortIcon}>{sortBy==='date' ? (sortDir==='asc' ? '▲' : '▼') : ''}</span></th>
              <th>Time</th>
              <th className={styles.sortable} onClick={() => toggleSort('category')}>Category <span className={styles.sortIcon}>{sortBy==='category' ? (sortDir==='asc' ? '▲' : '▼') : ''}</span></th>
              <th className={styles.sortable} onClick={() => toggleSort('createdAt')}>Created <span className={styles.sortIcon}>{sortBy==='createdAt' ? (sortDir==='asc' ? '▲' : '▼') : ''}</span></th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {(!displayed || displayed.length === 0) ? (
              <tr><td colSpan="7" className={styles.noData}>No notifications found</td></tr>
            ) : (
              displayed.map(n => (
                <tr key={n._id}>
                  <td>{n.coverImage ? <img src={n.coverImage} alt="cover" className={styles.tableThumb} onClick={(e)=>{ e.stopPropagation(); setPreviewImageSrc(n.coverImage); setPreviewOpen(true); }} /> : <div className={styles.tableThumbPlaceholder}>—</div>}</td>
                  <td>
                    <div className={styles.tableTitle}>{n.title}</div>
                    <div className={styles.tableDesc}>{n.desc}</div>
                  </td>
                  <td>{n.date}</td>
                  <td>{n.time}</td>
                  <td>{n.category || 'N/A'}</td>
                  <td>{new Date(n.createdAt).toLocaleString()}</td>
                  <td>
                    <div style={{display:'flex', gap:8}}>
                      <button className={styles.btnPrimary} onClick={() => { setIsEditing(true); setEditingId(n._id); setForm({ title: n.title, desc: n.desc, date: n.date, time: n.time, category: n.category || '', targetProfileType: normalizeTargetProfileType(n.targetProfileType), coverImage: null }); setPreviewSrc(n.coverImage || null); setShowAddModal(true); }}>Edit</button>
                      <button className={styles.dangerBtnOutline} onClick={() => confirmDelete(n._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Confirm modal for delete */}
      <ConfirmModal
        open={confirmOpen}
        title="Delete notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
        onConfirm={() => handleDelete(confirmTarget)}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={false}
      />

      {/* Image preview modal (full-screen) */}
      {previewOpen && previewImageSrc && (
        <div className={styles.modalOverlay} onClick={() => setPreviewOpen(false)}>
          <div className={styles.imagePreviewDialog} onClick={(e)=>e.stopPropagation()}>
            <button className={styles.imagePreviewClose} onClick={() => setPreviewOpen(false)} aria-label="Close preview">✕</button>
            <img src={previewImageSrc} alt="preview" className={styles.imagePreviewImage} />
          </div>
        </div>
      )}

      {/* Detail modal for viewing a notification (polished) */}
      {detailOpen && selectedNotification && (
        <div className={styles.modalOverlay} onClick={() => setDetailOpen(false)}>
          <div className={styles.modalDialog} role="dialog" aria-modal="true" aria-labelledby="detailTitle" onClick={(e) => e.stopPropagation()} ref={addModalRef}>
            <button className={styles.closeBtn} onClick={() => setDetailOpen(false)} aria-label="Close">✕</button>

            <div className={styles.modalBody}>
              <div className={styles.modalLeft}>
                {selectedNotification.coverImage ? (
                  <img src={selectedNotification.coverImage} alt="cover" className={styles.detailImage} />
                ) : (
                  <div className={styles.previewPlaceholder} style={{ height: 220 }}>
                    <div style={{ fontWeight: 700 }}>No cover image</div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>This notification has no cover image.</div>
                  </div>
                )}
              </div>

              <div className={styles.modalRight}>
                <h3 id="detailTitle" className={styles.detailTitle}>{selectedNotification.title}</h3>
                <div className={styles.detailMeta}>{new Date(selectedNotification.createdAt).toLocaleString()}</div>

                <div className={styles.detailContent}>
                  <p style={{ marginTop: 6, color: '#374151', whiteSpace: 'pre-wrap' }}>{selectedNotification.desc}</p>

                  <div className={styles.metaRow} style={{ marginTop: 12 }}>
                    <div className={styles.metaItem}><FaCalendarAlt /> <strong>{selectedNotification.date}</strong></div>
                    <div className={styles.metaItem}><FaClock /> <strong>{selectedNotification.time}</strong></div>
                    <div className={styles.metaItem}><FaTag /> <strong>{selectedNotification.category || 'N/A'}</strong></div>
                    <div className={styles.metaItem}><strong>{formatTargetProfileType(selectedNotification.targetProfileType)}</strong></div>
                  </div>
                </div>

                <div className={styles.detailActions}>
                  <button className={styles.btnPrimary} onClick={() => { setDetailOpen(false); setIsEditing(true); setEditingId(selectedNotification._id); setShowAddModal(true); setForm({ title: selectedNotification.title, desc: selectedNotification.desc, date: selectedNotification.date, time: selectedNotification.time, category: selectedNotification.category || '', targetProfileType: normalizeTargetProfileType(selectedNotification.targetProfileType), coverImage: null }); }}>Edit</button>
                  <button className={styles.btnDanger} onClick={() => { setDetailOpen(false); confirmDelete(selectedNotification._id); }}>Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className={styles.toastContainer} aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={styles.toast} role="status">{t.text}</div>
        ))}
      </div>
      </div>
      </>
      )}
  </div>
  );
}

export default ManageNotifications;
