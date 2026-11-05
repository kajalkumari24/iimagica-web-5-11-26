import React, { useEffect, useMemo, useState, useRef } from "react";
import adminApi from "../utils/adminApi";
import styles from "./ManageFrames.module.css";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../url";
import ConfirmModal from "./components/ConfirmModal";
import LayoutEditor from "./components/LayoutEditor";
// import CanvasFrameEditor from "./components/CanvasFrameEditor";
import FullscreenFrameEditor from "./components/FullscreenFrameEditor";
import SkeletonLoader from "./components/SkeletonLoader";
import adminStyles from "./AdminHome.module.css";
import AdminProfileType from "./AdminProfileType";
import socket from "../socket";
import { FaInstagram, FaFacebook, FaLinkedin, FaTwitter, FaYoutube, FaTelegramPlane, FaDiscord, FaSnapchatGhost, FaImage, FaUser, FaBuilding, FaIdBadge, FaGlobe, FaInfoCircle, FaPhone, FaMapMarkerAlt, FaTags, FaEnvelope, FaAddressCard, } from "react-icons/fa";

const PAGE_SIZE = 3;

const getBaseFieldKey = (fieldKey) => String(fieldKey || "").toLowerCase().replace(/^social_/, "");

const FieldIcon = ({ fieldKey, size = 14 }) => {
  const key = getBaseFieldKey(fieldKey);
  const style = { width: size, height: size, minWidth: size, minHeight: size, display: "block" };

  if (key === "photo" || key === "image") return <FaImage style={{ ...style, color: "#2563eb" }} />;
  if (key === "name" || key === "personalprimary") return <FaUser style={{ ...style, color: "#1d4ed8" }} />;
  if (key === "personaldetails") return <FaAddressCard style={{ ...style, color: "#4f46e5" }} />;
  if (key === "businessname" || key === "organization" || key === "partyname") return <FaBuilding style={{ ...style, color: "#7c3aed" }} />;
  if (key === "designation" || key === "position" || key === "positionname") return <FaIdBadge style={{ ...style, color: "#0f766e" }} />;
  if (key === "website") return <FaGlobe style={{ ...style, color: "#0369a1" }} />;
  if (key === "bio") return <FaInfoCircle style={{ ...style, color: "#6b7280" }} />;
  if (key === "contact" || key === "mobile") return <FaPhone style={{ ...style, color: "#0f766e" }} />;
  if (key === "address") return <FaMapMarkerAlt style={{ ...style, color: "#dc2626" }} />;
  if (key === "categories") return <FaTags style={{ ...style, color: "#b45309" }} />;
  if (key === "email") return <FaEnvelope style={{ ...style, color: "#334155" }} />;
  if (key === "social") return <FaAddressCard style={{ ...style, color: "#7c3aed" }} />;

  if (key === "instagram") return <FaInstagram style={{ ...style, color: "#E4405F" }} />;
  if (key === "facebook") return <FaFacebook style={{ ...style, color: "#1877F2" }} />;
  if (key === "linkedin") return <FaLinkedin style={{ ...style, color: "#0A66C2" }} />;
  if (key === "twitter") return <FaTwitter style={{ ...style, color: "#1DA1F2" }} />;
  if (key === "youtube") return <FaYoutube style={{ ...style, color: "#ff0000" }} />;
  if (key === "telegram") return <FaTelegramPlane style={{ ...style, color: "#229ED9" }} />;
  if (key === "discord") return <FaDiscord style={{ ...style, color: "#5865F2" }} />;
  if (key === "snapchat") return <FaSnapchatGhost style={{ ...style, color: "#eab308" }} />;

  return <FaAddressCard style={{ ...style, color: "#64748b" }} />;
};

const layoutFields = [
  { key: "photo", label: "Image" },
  { key: "personalPrimary", label: "Name / Business Name" },
  { key: "personalDetails", label: "Profile Details" },
  { key: "contact", label: "Contact" },
  { key: "social", label: "Social Media" },
  { key: "address", label: "Address" },
];

const layoutFieldsByCategory = {
  political: [
    { key: "photo", label: "Photo" },
    { key: "name", label: "Name" },
    { key: "positionname", label: "Position" },
    { key: "mobile", label: "Mobile" },
    { key: "address", label: "Address" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "twitter", label: "Twitter" },
  ],
  social: layoutFields,
  personal: layoutFields,
  professional: layoutFields,
  business: layoutFields,
  brand: layoutFields,
};

const getBaseCategoryKey = (value) => String(value || "").split("-")[0].toLowerCase();

const getFieldsForCategory = (categoryValue) => {
  const baseKey = getBaseCategoryKey(categoryValue);
  return layoutFieldsByCategory[baseKey] || [];
};

const migrateLegacyLayout = (layoutInput = {}) => {
  const source = (layoutInput && typeof layoutInput === "object") ? layoutInput : {};
  const migrated = { ...source };
  const hasLegacyPersonal = !!source.personal;
  const hasPrimary = !!source.personalPrimary;
  const hasDetails = !!source.personalDetails;

  if (hasLegacyPersonal && !hasPrimary) {
    migrated.personalPrimary = { ...source.personal };
  }

  if (hasLegacyPersonal && !hasDetails) {
    const legacyTop = Number(source.personal?.top);
    migrated.personalDetails = {
      ...source.personal,
      top: Number.isFinite(legacyTop) ? legacyTop + 28 : source.personal?.top,
    };
  }

  return migrated;
};

const professionalCanvasPreset = {
  name: { fontSize: 22, fontWeight: "bold", fontColour: "#0f172a", fontFamily: "Poppins" },
  designation: { fontSize: 16, fontWeight: "600", fontColour: "#1e293b", fontFamily: "Poppins" },
  categories: { fontSize: 13, fontWeight: "500", fontColour: "#334155", fontFamily: "Poppins" },
  address: { fontSize: 12, fontWeight: "normal", fontColour: "#475569", fontFamily: "Poppins" },
  contact: { fontSize: 12, fontWeight: "600", fontColour: "#0f172a", fontFamily: "Poppins" },
  website: { fontSize: 12, fontWeight: "500", fontColour: "#1d4ed8", fontFamily: "Poppins" },
  instagram: { fontSize: 12, fontWeight: "500", fontColour: "#be185d", fontFamily: "Poppins" },
  facebook: { fontSize: 12, fontWeight: "500", fontColour: "#1d4ed8", fontFamily: "Poppins" },
  linkedin: { fontSize: 12, fontWeight: "500", fontColour: "#0369a1", fontFamily: "Poppins" },
  twitter: { fontSize: 12, fontWeight: "500", fontColour: "#0ea5e9", fontFamily: "Poppins" },
};



function ManageFrames() {
  const navigate = useNavigate();
  const [frames, setFrames] = useState([]);
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [selectedParty, setSelectedParty] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [totalFrames, setTotalFrames] = useState(0);
  const [files, setFiles] = useState([]);
  const buildLayout = (fields) =>
    fields.reduce((acc, field) => {
      acc[field.key] = {
        top: "",
        left: "",
        width: "",
        height: "",
        fontSize: "",
        fontColour: "#000000",
        fontWeight: "normal",
        fontFamily: "",
      };
      return acc;
    }, {});
  const [layout, setLayout] = useState(() => buildLayout(layoutFields));
  const [editingFrame, setEditingFrame] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFile, setEditFile] = useState(null);
  const [editPreview, setEditPreview] = useState("");
  const [editUploading, setEditUploading] = useState(false);
  const [editMessage, setEditMessage] = useState("");
  const [uploadProgressAdd, setUploadProgressAdd] = useState(0);
  const [uploadProgressEdit, setUploadProgressEdit] = useState(0);
  const [editSuccess, setEditSuccess] = useState('');
  const [imgBroken, setImgBroken] = useState(false);
  const [maxFileSize] = useState(2 * 1024 * 1024); // 2MB
  const [maxFiles] = useState(20); // 20 files max
  const [dragActive, setDragActive] = useState(false);
  const uploadPreviewRef = useRef(null);
  const loadMoreTriggerRef = useRef(null);
  const skipSearchEffectRef = useRef(true);
  const fetchRequestIdRef = useRef(0);
  const totalCountLoadedRef = useRef(false);
  const editPreviewRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmAction, setConfirmAction] = useState(() => () => { });
  const [confirmLoadingKey, setConfirmLoadingKey] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  // Add-modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalFiles, setModalFiles] = useState([]);
  const [modalPreviews, setModalPreviews] = useState([]);
  const [modalCategory, setModalCategory] = useState("");
  const [modalProfessionalType, setModalProfessionalType] = useState("");
  const [modalParty, setModalParty] = useState("");
  const [modalCustomCategory, setModalCustomCategory] = useState("");
  const [partyOptions, setPartyOptions] = useState([]);
  const [newPartyInput, setNewPartyInput] = useState('');
  const [dbParties, setDbParties] = useState([]);
  const [partyMgmtInput, setPartyMgmtInput] = useState('');
  const [partyMgmtLoading, setPartyMgmtLoading] = useState(false);
  const [showPartyMgmt, setShowPartyMgmt] = useState(false);
  const [dbProfessionalTypes, setDbProfessionalTypes] = useState([]);
  const [dbBrandTypes, setDbBrandTypes] = useState([]);
  const [modalBrandType, setModalBrandType] = useState('');
  const [newBrandInput, setNewBrandInput] = useState('');
  const [profMgmtInput, setProfMgmtInput] = useState('');
  const [profMgmtLoading, setProfMgmtLoading] = useState(false);
  const [showProfMgmt, setShowProfMgmt] = useState(false);
  const [editingProfId, setEditingProfId] = useState(null);
  const [editingProfName, setEditingProfName] = useState('');
  const [showProfileTypeMgmt, setShowProfileTypeMgmt] = useState(false);
  const [editingPartyId, setEditingPartyId] = useState(null);
  const [editingPartyName, setEditingPartyName] = useState('');
  const [uploadingFrames, setUploadingFrames] = useState(false);
  const [editEditorMode, setEditEditorMode] = useState('canvas'); // 'canvas' | 'manual'
  const [fullscreenFrame, setFullscreenFrame] = useState(null); // frame object for fullscreen editor
  const [bulkStyle, setBulkStyle] = useState({
    fontSize: "",
    fontColour: "#000000",
    fontWeight: "normal",
    width: "",
    height: "",
    sampleText: "",
    applySizeBox: false,
    applySampleText: false,
  });

  // Fetch parties from DB
  const fetchDbParties = async () => {
    try {
      const res = await adminApi.get('/api/profile-types/political');
      setDbParties(res.data?.data || []);
    } catch (err) {
      console.warn('Could not fetch party types:', err);
    }
  };

  // Fetch professional types from DB
  const fetchDbProfessionalTypes = async () => {
    try {
      const res = await adminApi.get('/api/profile-types/professional');
      setDbProfessionalTypes(res.data?.data || []);
    } catch (err) {
      console.warn('Could not fetch professional types:', err);
    }
  };

  // Fetch brand types from DB
  const fetchDbBrandTypes = async () => {
    try {
      const res = await adminApi.get('/api/profile-types/brand');
      setDbBrandTypes(res.data?.data || []);
    } catch (err) {
      console.warn('Could not fetch brand types:', err);
    }
  };

  const handleAddProfession = async () => {
    const name = profMgmtInput.trim();
    if (!name) return;
    setProfMgmtLoading(true);
    try {
      await adminApi.post('/api/profile-types', { type: 'professional', name });
      await fetchDbProfessionalTypes();
      setProfMgmtInput('');
      showNotification(`Profession "${name}" added`, 'success');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to add profession', 'error');
    } finally {
      setProfMgmtLoading(false);
    }
  };

  const handleUpdateProfession = async (id) => {
    const name = editingProfName.trim();
    if (!name) return;
    setProfMgmtLoading(true);
    try {
      await adminApi.put(`/api/profile-types/${id}`, { name });
      await fetchDbProfessionalTypes();
      showNotification(`Profession updated to "${name}"`, 'success');
      setEditingProfId(null);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setProfMgmtLoading(false);
    }
  };

  const handleDeleteProfession = (prof) => {
    setConfirmTitle("Delete Profession");
    setConfirmMessage(`Are you sure you want to delete the profession "${prof.name}"?`);
    setConfirmLoadingKey(`prof-${prof._id}`);
    setConfirmAction(() => async () => {
      try {
        await adminApi.delete(`/api/profile-types/${prof._id}`);
        await fetchDbProfessionalTypes();
        showNotification(`Profession "${prof.name}" deleted`, 'success');
      } finally {
        setConfirmOpen(false);
        setConfirmLoadingKey(null);
      }
    });
    setConfirmOpen(true);
  };

  // Combine DB parties with user-added local parties
  const dynamicParties = useMemo(() => {
    const fromDb = dbParties.map((p) => p.name);
    const combined = [...new Set([...fromDb, ...partyOptions])];
    return combined.sort();
  }, [dbParties, partyOptions]);

  const closeProfileTypeMgmt = () => {
    setShowProfileTypeMgmt(false);
    fetchCategories();
    fetchDbParties();
    fetchDbProfessionalTypes();
    fetchDbBrandTypes();
    fetchFrames(1, false, searchTerm);
  };


  // Reset layout when category changes
  useEffect(() => {
    if (modalCategory) {
      const fields = layoutFieldsByCategory[modalCategory.toLowerCase()] || [];
      setLayout(buildLayout(fields));
    }
  }, [modalCategory]);

  // cleanup previews when modal closes or component unmounts
  useEffect(() => {
    if (!showAddModal && modalPreviews.length) {
      modalPreviews.forEach((u) => { try { URL.revokeObjectURL(u); } catch (e) { } });
      setModalPreviews([]);
      setModalFiles([]);
      setModalCategory("");
      setModalProfessionalType("");
      setModalParty("");
      setModalBrandType("");
      setLayout(buildLayout(layoutFields));
      setUploadProgressAdd(0);
    }
    return () => {
      // on unmount
      modalPreviews.forEach((u) => { try { URL.revokeObjectURL(u); } catch (e) { } });
    };
  }, [showAddModal]);

  // cleanup edit preview when edit modal closes/unmounts
  useEffect(() => {
    if (!showEditModal && editPreview) {
      try { URL.revokeObjectURL(editPreview); } catch (e) { }
      setEditPreview('');
      setEditFile(null);
    }
    return () => {
      if (editPreview) { try { URL.revokeObjectURL(editPreview); } catch (e) { } }
    };
  }, [showEditModal]);

  // close the topmost open modal on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;

      if (confirmOpen) {
        setConfirmOpen(false);
        setConfirmLoadingKey(null);
        return;
      }

      if (fullscreenFrame) {
        setFullscreenFrame(null);
        return;
      }

      if (showEditModal) {
        setShowEditModal(false);
        return;
      }

      if (showAddModal) {
        setShowAddModal(false);
        return;
      }

      if (showPreviewModal) {
        setShowPreviewModal(false);
        return;
      }

      if (showProfileTypeMgmt) {
        closeProfileTypeMgmt();
        return;
      }

      if (showProfMgmt) {
        setShowProfMgmt(false);
        setEditingProfId(null);
        return;
      }

      if (showPartyMgmt) {
        setShowPartyMgmt(false);
        setEditingPartyId(null);
      }
    };

    const hasOpenModal =
      confirmOpen ||
      !!fullscreenFrame ||
      showEditModal ||
      showAddModal ||
      showPreviewModal ||
      showProfileTypeMgmt ||
      showProfMgmt ||
      showPartyMgmt;

    if (hasOpenModal) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [
    confirmOpen,
    fullscreenFrame,
    showEditModal,
    showAddModal,
    showPreviewModal,
    showProfileTypeMgmt,
    showProfMgmt,
    showPartyMgmt,
    searchTerm,
  ]);

  // Prevent background page scroll when any modal is open
  useEffect(() => {
    const isModalOpen = showAddModal || showEditModal || showPreviewModal;
    const body = document.body;
    const html = document.documentElement;

    if (!isModalOpen) return undefined;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const prevBodyStyle = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };
    const prevHtmlOverflow = html.style.overflow;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    html.style.overflow = "hidden";

    return () => {
      body.style.overflow = prevBodyStyle.overflow;
      body.style.position = prevBodyStyle.position;
      body.style.top = prevBodyStyle.top;
      body.style.left = prevBodyStyle.left;
      body.style.right = prevBodyStyle.right;
      body.style.width = prevBodyStyle.width;
      html.style.overflow = prevHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [showAddModal, showEditModal, showPreviewModal]);

  // File validation
  const validateFiles = (files) => {
    const errors = [];
    if (files.length > maxFiles) errors.push(`Maximum ${maxFiles} files allowed`);

    const oversized = files.filter(f => f.size > maxFileSize);
    if (oversized.length) errors.push(`${oversized.length} files exceed 2MB limit`);

    const nonImages = files.filter(f => !f.type.startsWith('image/'));
    if (nonImages.length) errors.push(`${nonImages.length} non-image files detected`);

    return errors;
  };

  const fetchFrames = async (pageNum = 1, append = false, searchTerm = '', currentSortBy = sortBy, currentSortOrder = sortOrder) => {
    const requestId = ++fetchRequestIdRef.current;
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        page: pageNum,
        limit: PAGE_SIZE,
        sortBy: currentSortBy,
        sortOrder: currentSortOrder,
        ...(searchTerm && { search: searchTerm })
      });

      const res = await adminApi.get(`/api/frames?${params}`);
      if (requestId !== fetchRequestIdRef.current) return;
      const newFrames = res.data;

      // Get total count once for quick dashboard summary.
      if (pageNum === 1 && !append && !searchTerm && !totalCountLoadedRef.current) {
        try {
          const countRes = await adminApi.get(`/api/frames/count`);
          if (requestId !== fetchRequestIdRef.current) return;
          setTotalFrames(countRes.data?.data?.count || countRes.data.count || 0);
          totalCountLoadedRef.current = true;
        } catch (countErr) {
          console.warn("Frame count failed:", countErr);
        }
      }

      if (append) {
        setFrames(prev => [...prev, ...newFrames]);
      } else {
        setFrames(newFrames);
      }

      setHasMore(newFrames.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      if (requestId !== fetchRequestIdRef.current) return;
      console.error("Error fetching frames:", err);
      showNotification('Failed to load frames', 'error');
    } finally {
      if (requestId !== fetchRequestIdRef.current) return;
      setLoading(false);
      setLoadingMore(false);
      setSearchLoading(false);
    }
  };

  const fetchByCategory = async (
    pageNum = 1,
    append = false,
    searchTerm = '',
    currentSortBy = sortBy,
    currentSortOrder = sortOrder,
    categoryOverride = category
  ) => {
    const selectedCategory = String(categoryOverride || '').trim();
    if (!selectedCategory) return fetchFrames(pageNum, append, searchTerm, currentSortBy, currentSortOrder);
    const requestId = ++fetchRequestIdRef.current;
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const params = new URLSearchParams({
        page: pageNum,
        limit: PAGE_SIZE,
        sortBy: currentSortBy,
        sortOrder: currentSortOrder,
        ...(searchTerm && { search: searchTerm })
      });

      const res = await adminApi.get(`/api/frames/category/${encodeURIComponent(selectedCategory)}?${params}`);
      if (requestId !== fetchRequestIdRef.current) return;
      const newFrames = res.data;

      if (append) {
        setFrames(prev => [...prev, ...newFrames]);
      } else {
        setFrames(newFrames);
      }

      setHasMore(newFrames.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      if (requestId !== fetchRequestIdRef.current) return;
      console.error("Error fetching category frames:", err);
      showNotification('Failed to load category frames', 'error');
    } finally {
      if (requestId !== fetchRequestIdRef.current) return;
      setLoading(false);
      setLoadingMore(false);
      setSearchLoading(false);
    }
  };

  const loadMoreFrames = () => {
    if (loadingMore || !hasMore) return;
    const currentFetch = category ? fetchByCategory : fetchFrames;
    currentFetch(page + 1, true, searchTerm);
  };

  // Fetch distinct categories from DB for the filter dropdown
  const fetchCategories = async () => {
    try {
      const res = await adminApi.get('/api/frames/categories');
      setAvailableCategories(res.data?.categories || []);
    } catch (err) {
      console.warn('Could not fetch categories:', err);
    }
  };

  // Initial load: fetch immediately so skeleton is visible on first open
  useEffect(() => {
    const currentFetch = category ? fetchByCategory : fetchFrames;
    currentFetch(1, false, searchTerm);
    fetchCategories();
    fetchDbParties();
    fetchDbProfessionalTypes();
    fetchDbBrandTypes();
  }, []);

  // Real-time sync: when admin updates a profile type, refresh frames + categories
  useEffect(() => {
    const handler = () => {
      fetchFrames(1, false, searchTerm);
      fetchCategories();
      fetchDbParties();
      fetchDbProfessionalTypes();
      fetchDbBrandTypes();
    };
    socket.on("profileTypeUpdated", handler);
    return () => socket.off("profileTypeUpdated", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (skipSearchEffectRef.current) {
      skipSearchEffectRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (searchTerm !== '') {
        setSearchLoading(true);
        setPage(1);
        const currentFetch = category ? fetchByCategory : fetchFrames;
        currentFetch(1, false, searchTerm);
      } else if (searchTerm === '') {
        setPage(1);
        const currentFetch = category ? fetchByCategory : fetchFrames;
        currentFetch(1, false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Notification system
  const showNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Bulk delete with loading state
  const requestDeleteSelected = () => {
    if (!selectedIds.length) return;
    setConfirmTitle('Delete Selected Frames');
    setConfirmMessage(`Delete ${selectedIds.length} selected frame(s)? This cannot be undone.`);
    setConfirmLoadingKey('bulk');
    setConfirmAction(() => async () => {
      const prevFrames = frames;
      const idsToDelete = selectedIds;
      // optimistic UI update for faster feedback
      setFrames((prev) => prev.filter((f) => !idsToDelete.includes(f._id)));
      setTotalFrames((prev) => Math.max(0, prev - idsToDelete.length));
      setSelectedIds([]);
      setSelectAll(false);
      try {
        setActionLoading(prev => ({ ...prev, bulkDelete: true }));
        await adminApi.delete(`/api/frames/bulk`, { data: { ids: idsToDelete } });
        showNotification(`${idsToDelete.length} frames deleted successfully`, 'success');
        fetchCategories();
      } catch (err) {
        console.error('Error deleting selected frames:', err);
        // rollback on failure
        setFrames(prevFrames);
        setTotalFrames(prevFrames.length);
        showNotification('Failed to delete frames', 'error');
      } finally {
        setActionLoading(prev => ({ ...prev, bulkDelete: false }));
        setConfirmOpen(false);
        setConfirmLoadingKey(null);
      }
    });
    setConfirmOpen(true);
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
          loadMoreFrames();
        }
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, page, category, searchTerm]);

  // Drag and drop upload
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const errors = validateFiles(files);

    if (errors.length) {
      showNotification(errors.join('. '), 'error');
      return;
    }

    if (files.length > 0) {
      setModalFiles(files);
      setModalPreviews(prev => {
        prev.forEach(u => { try { URL.revokeObjectURL(u); } catch (er) { } });
        return files.map(f => URL.createObjectURL(f));
      });
      setShowAddModal(true);
    }
  };

  const deleteFrame = (id) => {
    setConfirmTitle("Delete Frame");
    setConfirmMessage("Are you sure you want to delete this frame?");
    setConfirmLoadingKey(id);
    setConfirmAction(() => async () => {
      try {
        setActionLoading(prev => ({ ...prev, [id]: true }));
        await adminApi.delete(`/api/frames/${id}`);
        showNotification('Frame deleted successfully', 'success');
        fetchFrames(1, false, searchTerm);
        fetchCategories();
      } catch (err) {
        console.error("Error deleting frame:", err);
        showNotification('Failed to delete frame', 'error');
      } finally {
        setActionLoading(prev => ({ ...prev, [id]: false }));
        setConfirmOpen(false);
        setConfirmLoadingKey(null);
      }
    });
    setConfirmOpen(true);
  };

  const handleEditClick = (frame) => {
    setEditingFrame(frame._id);
    const baseLayout = frame.layout || buildLayout(getFieldsForCategory(frame.category));
    setLayout(migrateLegacyLayout(baseLayout));
    setFullscreenFrame(frame);
  };

  const handleSaveLayout = async (id) => {
    try {
      setActionLoading(prev => ({ ...prev, [`layout-${id}`]: true }));
      await adminApi.put(`/api/frames/update-layout/${id}`, { layout });
      showNotification('Layout updated successfully', 'success');
      setEditingFrame(null);
      fetchFrames(1, false, searchTerm);
    } catch (err) {
      console.error("Error saving layout:", err);
      showNotification('Failed to save layout', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`layout-${id}`]: false }));
    }
  };

  const deleteByCategory = async () => {
    if (!category) return alert("Select a category first");
    setConfirmTitle("Delete Category");
    setConfirmMessage(`Delete all frames in category '${category}'? This action cannot be undone.`);
    setConfirmLoadingKey(null);
    setConfirmAction(() => async () => {
      try {
        await adminApi.delete(`/api/frames/category/${category}`);
        fetchCategories();
        fetchFrames();
      } catch (err) {
        console.error("Error deleting category frames:", err);
      } finally {
        setConfirmOpen(false);
        setConfirmLoadingKey(null);
      }
    });
    setConfirmOpen(true);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (!selectAll) {
      setSelectedIds(frames.map((f) => f._id));
      setSelectAll(true);
    } else {
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  // parse numeric or '123px' values into numbers, otherwise leave string
  const parsePx = (val, fallback) => {
    if (val === undefined || val === null || val === "") return fallback;
    // strip px if present
    const s = String(val).trim().replace(/px$/i, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  };

  const handleLayoutChange = (field, key, value) => {
    // normalize common numeric fields to numbers (px values) when possible
    const numericKeys = ["top", "left", "width", "height", "fontSize"];
    let newValue = value;
    if (numericKeys.includes(key)) {
      // if value is a string like '100px' or '100', convert to number 100
      if (typeof value === 'string') {
        const stripped = value.trim().replace(/px$/i, '');
        if (/^-?\d+(?:\.\d+)?$/.test(stripped)) {
          newValue = Number(stripped);
        }
      } else if (typeof value === 'number') {
        newValue = value;
      }
    }

    setLayout((prev) => ({
      ...prev,
      [field]: { ...prev[field], [key]: newValue },
    }));
  };

  const toNumericIfPossible = (value) => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return value;
    const stripped = value.trim().replace(/px$/i, "");
    if (/^-?\d+(?:\.\d+)?$/.test(stripped)) return Number(stripped);
    return value;
  };

  const applyBulkStyleToFields = (fields) => {
    const targets = (fields || []).filter((f) => f?.key && f.key !== "photo");
    if (!targets.length) {
      showNotification("No text fields available for bulk apply", "info");
      return;
    }

    setLayout((prev) => {
      const next = { ...prev };
      targets.forEach((field) => {
        const key = field.key;
        const current = next[key] || {};
        const updated = { ...current };

        if (bulkStyle.fontSize !== "") updated.fontSize = toNumericIfPossible(bulkStyle.fontSize);
        if (bulkStyle.fontColour) updated.fontColour = bulkStyle.fontColour;
        if (bulkStyle.fontWeight) updated.fontWeight = bulkStyle.fontWeight;

        if (bulkStyle.applySizeBox) {
          if (bulkStyle.width !== "") updated.width = toNumericIfPossible(bulkStyle.width);
          if (bulkStyle.height !== "") updated.height = toNumericIfPossible(bulkStyle.height);
        }

        if (bulkStyle.applySampleText && bulkStyle.sampleText !== "") {
          updated.sampleText = bulkStyle.sampleText;
        }

        next[key] = updated;
      });
      return next;
    });

    showNotification(`Bulk style applied to ${targets.length} fields`, "success");
  };

  // Drag handlers for overlays
  const startDrag = (e, fieldKey, containerRef, fallbackLeft = 0, fallbackTop = 0) => {
    e.preventDefault();
    // left mouse only
    if (e.button && e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    // Use the currently rendered position as fallback to avoid first-drag jump
    // when layout values are still empty (preview uses visual defaults per field index).
    const origLeft = parsePx(layout[fieldKey]?.left, fallbackLeft);
    const origTop = parsePx(layout[fieldKey]?.top, fallbackTop);
    setDragging({ fieldKey, startX, startY, origLeft, origTop, containerRef });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (ev) => {
      ev.preventDefault();
      const { clientX, clientY } = ev;
      const dx = clientX - dragging.startX;
      const dy = clientY - dragging.startY;
      const newLeft = Math.round(dragging.origLeft + dx);
      const newTop = Math.round(dragging.origTop + dy);
      setLayout((prev) => ({
        ...prev,
        [dragging.fieldKey]: {
          ...prev[dragging.fieldKey],
          left: newLeft,
          top: newTop,
        },
      }));
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  const currentEditingFrame = useMemo(
    () => frames.find((f) => f._id === editingFrame),
    [frames, editingFrame]
  );

  const currentLayoutFields = useMemo(() => {
    const typeKey = (editingFrame
      ? currentEditingFrame?.category?.split("-")[0]
      : newCategory
    )?.toLowerCase();
    return layoutFieldsByCategory[typeKey] || [];
  }, [editingFrame, currentEditingFrame, newCategory]);

  // NOTE: refresh is available via reloading or fetchFrames();

  const filteredFrames = useMemo(() => frames.filter((f) => {
    // category filter (handle 'business' and political-party variants)
    if (category) {
      const sel = String(category || '').toLowerCase();
      const fc = String(f.category || '').toLowerCase();
      if (sel.includes('-')) {
        // exact match for selections like 'political-bjp'
        if (fc !== sel) return false;
      } else {
        // match base category: 'business' should match 'business' and also 'business-...'(if any)
        const base = fc.split('-')[0] || fc;
        if (base !== sel) return false;
      }
    }

    // search term filter
    if (!searchTerm) return true;
    const txt = `${f.category || ""} ${f.framePath || ""}`.toLowerCase();
    return txt.includes(searchTerm.toLowerCase());
  }), [frames, category, searchTerm]);

  return (
    <div className={styles.container}>
      {loading && frames.length === 0 ? (
        <SkeletonLoader />
      ) : (
        <>

          <div>
            {/* Header: match Manage Users look */}
            <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
              <div>
                <div className={adminStyles.activeTitle} style={{ fontSize: '1.75rem', fontWeight: 700 }}>Frame Management</div>
              </div>

              <div className={styles.headerActions} style={{ flexWrap: 'wrap', gap: 8 }}>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-');
                    setSortBy(field);
                    setSortOrder(order);
                    setPage(1);
                    setFrames([]);
                    const currentFetch = category ? fetchByCategory : fetchFrames;
                    currentFetch(1, false, searchTerm, field, order);
                  }}
                  className={styles.sortSelect}
                  style={{ minWidth: 130 }}
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="category-asc">Category A-Z</option>
                  <option value="category-desc">Category Z-A</option>
                </select>
                <div className={styles.searchContainer} style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <input
                    className={styles.searchInput}
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%', minWidth: 0 }}
                  />
                  {searchLoading && <div className={styles.searchSpinner} />}
                </div>
                <button 
                  className={`${adminStyles.uploadActionBtn} ${styles.addBtn}`} 
                  onClick={() => { 
                    fetchDbParties();
                    fetchDbProfessionalTypes();
                    fetchDbBrandTypes();
                    setShowAddModal(true); 
                  }} 
                  aria-label="Add Frames"
                >
                  <span className={styles.addBtnIcon} aria-hidden>+</span>
                  <span className={styles.addBtnText}>Add Frames</span>
                </button>
                <button className={`${adminStyles.uploadActionBtn} ${styles.addBtn}`} style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }} onClick={() => setShowProfileTypeMgmt(true)} aria-label="Manage Profile Types">
                  <span className={styles.addBtnIcon} aria-hidden>⚙️</span>
                  <span className={styles.addBtnText}>Manage Profile Types</span>
                </button>
              </div>
            </div>

            {/* toolbar / controls (matches ManageUsers controlsCard) */}
            <div className={styles.controlsCard}>
              <div className={styles.controlsCardInner} style={{ flexWrap: 'wrap', gap: 10 }}>
                <div className={styles.leftGroup} style={{ flexWrap: 'wrap', flex: '1 1 200px', minWidth: 0 }}>
                  <select
                    value={category}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      setCategory(nextCategory);
                      setPage(1);
                      setFrames([]);
                      setHasMore(true);
                      setSelectedIds([]);
                      setSelectAll(false);
                      const currentFetch = nextCategory ? fetchByCategory : fetchFrames;
                      currentFetch(1, false, searchTerm, sortBy, sortOrder, nextCategory);
                    }}
                    className={styles.categorySelect}
                    style={{ minWidth: 160, flex: '1 1 160px' }}
                  >
                    <option value="">-- Filter by Category --</option>
                    {(() => {
                      // Helper: format 'political-bjp' → 'Political - BJP', 'business' → 'Business'
                      const fmt = (cat) => {
                        const parts = cat.split('-');
                        const base = parts[0];
                        const sub = parts.slice(1).join(' ');
                        const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
                        if (!sub) return cap(base);
                        // short abbreviations stay uppercase (bjp, aap, cpi etc.)
                        return `${cap(base)} - ${sub.length <= 5 ? sub.toUpperCase() : sub.split(' ').map(cap).join(' ')}`;
                      };
                      // Group by base category
                      const groups = {};
                      availableCategories.forEach((cat) => {
                        const base = cat.split('-')[0] || cat;
                        if (!groups[base]) groups[base] = [];
                        groups[base].push(cat);
                      });
                      return Object.entries(groups).map(([base, cats]) => (
                        <optgroup key={base} label={base.charAt(0).toUpperCase() + base.slice(1)}>
                          {cats.map((cat) => (
                            <option key={cat} value={cat}>{fmt(cat)}</option>
                          ))}
                        </optgroup>
                      ));
                    })()}
                  </select>
                  {/* shaded select UI only; Search and Delete Category buttons removed (search exists in header) */}
                </div>

                <div className={styles.rightGroup} style={{ flexWrap: 'wrap' }}>
                  <div style={{ color: '#64748b', fontSize: 13, marginRight: 12 }}>{totalFrames} frame(s) total</div>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => {
                      if (!frames.length) {
                        showNotification('No frames to export', 'info');
                        return;
                      }
                      const csvData = frames.map(frame => ({
                        Category: frame.category,
                        'Frame Path': frame.framePath,
                        'Created Date': new Date(frame.createdAt).toLocaleDateString(),
                        'Updated Date': new Date(frame.updatedAt).toLocaleDateString()
                      }));

                      const csvContent = [
                        Object.keys(csvData[0]).join(','),
                        ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
                      ].join('\n');

                      const blob = new Blob([csvContent], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `frames-export-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    📥 Export
                  </button>
                  <button
                    className={styles.btnDanger}
                    onClick={requestDeleteSelected}
                    disabled={selectedIds.length === 0 || actionLoading.bulkDelete}
                  >
                    {actionLoading.bulkDelete ? '⏳' : '🗑️'} Delete Selected
                  </button>
                </div>
              </div>
            </div>

            {/* layout editor is now modal-based; inline hint removed */}

            {/* Unified Profile Type Management Modal */}
            {showProfileTypeMgmt && (
              <AdminProfileType
                onClose={closeProfileTypeMgmt}
                showNotification={showNotification}
              />
            )}

            {/* Party Management Modal (legacy - kept for internal use) */}
            {showPartyMgmt && (
              <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={() => { setShowPartyMgmt(false); setEditingPartyId(null); }}>
                <div className={styles.partyModal} onClick={(e) => e.stopPropagation()}>
                  {/* Modal Header */}
                  <div className={styles.partyModalHeader}>
                    <div className={styles.partyModalTitleRow}>
                      <span className={styles.partyModalIcon}>🏛️</span>
                      <div>
                        <div className={styles.partyModalTitle}>Manage Political Parties</div>
                        <div className={styles.partyModalSub}>{dbParties.length} part{dbParties.length !== 1 ? 'ies' : 'y'} registered</div>
                      </div>
                    </div>
                    <button className={styles.partyModalClose} onClick={() => { setShowPartyMgmt(false); setEditingPartyId(null); }}>✕</button>
                  </div>

                  {/* Add new party */}
                  <div className={styles.partyAddRow}>
                    <input
                      type="text"
                      placeholder="Enter party name (e.g. INC, BJP)..."
                      value={partyMgmtInput}
                      onChange={(e) => setPartyMgmtInput(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const name = partyMgmtInput.trim();
                          if (!name) return;
                          setPartyMgmtLoading(true);
                          try {
                            await adminApi.post('/api/profile-types', { type: 'political', name: name });
                            await fetchDbParties();
                            setPartyMgmtInput('');
                            showNotification(`Party "${name}" added`, 'success');
                          } catch (err) {
                            showNotification(err.response?.data?.message || 'Failed to add party', 'error');
                          } finally {
                            setPartyMgmtLoading(false);
                          }
                        }
                      }}
                      className={styles.partyAddInput}
                    />
                    <button
                      disabled={partyMgmtLoading || !partyMgmtInput.trim()}
                      className={styles.partyAddBtn}
                      onClick={async () => {
                        const name = partyMgmtInput.trim();
                        if (!name) return;
                        setPartyMgmtLoading(true);
                        try {
                          await adminApi.post('/api/profile-types', { type: 'political', name: name });
                          await fetchDbParties();
                          setPartyMgmtInput('');
                          showNotification(`Party "${name}" added`, 'success');
                        } catch (err) {
                          showNotification(err.response?.data?.message || 'Failed to add party', 'error');
                        } finally {
                          setPartyMgmtLoading(false);
                        }
                      }}
                    >
                      {partyMgmtLoading ? <span className={styles.spinner} /> : '+'} Add Party
                    </button>
                  </div>

                  {/* Party list */}
                  <div className={styles.partyList}>
                    {dbParties.length === 0 ? (
                      <div className={styles.partyEmpty}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🏛️</div>
                        <div>No parties added yet</div>
                        <div style={{ fontSize: 12, marginTop: 4, color: '#94a3b8' }}>Add your first party above</div>
                      </div>
                    ) : dbParties.map((party, idx) => (
                      <div key={party._id} className={styles.partyItem}>
                        <div className={styles.partyItemLeft}>
                          <span className={styles.partyIndex}>{idx + 1}</span>
                          {editingPartyId === party._id ? (
                            <input
                              autoFocus
                              type="text"
                              value={editingPartyName}
                              onChange={(e) => setEditingPartyName(e.target.value)}
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  const name = editingPartyName.trim();
                                  if (!name) return;
                                  setPartyMgmtLoading(true);
                                  try {
                                    await adminApi.put(`/api/profile-types/${party._id}`, { name });
                                    await fetchDbParties();
                                    showNotification(`Party updated to "${name}"`, 'success');
                                    setEditingPartyId(null);
                                  } catch (err) {
                                    showNotification(err.response?.data?.message || 'Failed to update', 'error');
                                  } finally { setPartyMgmtLoading(false); }
                                }
                                if (e.key === 'Escape') setEditingPartyId(null);
                              }}
                              className={styles.partyEditInput}
                            />
                          ) : (
                            <span className={styles.partyName}>{party.name}</span>
                          )}
                        </div>
                        <div className={styles.partyItemActions}>
                          {editingPartyId === party._id ? (
                            <>
                              <button
                                disabled={partyMgmtLoading}
                                className={styles.partySaveBtn}
                                onClick={async () => {
                                  const name = editingPartyName.trim();
                                  if (!name) return;
                                  setPartyMgmtLoading(true);
                                  try {
                                    await adminApi.put(`/api/profile-types/${party._id}`, { name });
                                    await fetchDbParties();
                                    showNotification(`Party updated to "${name}"`, 'success');
                                    setEditingPartyId(null);
                                  } catch (err) {
                                    showNotification(err.response?.data?.message || 'Failed to update', 'error');
                                  } finally { setPartyMgmtLoading(false); }
                                }}
                              >✓ Save</button>
                              <button className={styles.partyCancelBtn} onClick={() => setEditingPartyId(null)}>✕ Cancel</button>
                            </>
                          ) : (
                            <>
                              <button
                                className={styles.partyEditBtn}
                                onClick={() => { setEditingPartyId(party._id); setEditingPartyName(party.name); }}
                              >✏️ Edit</button>
                              <button
                                className={styles.partyDeleteBtn}
                                onClick={() => {
                                  setConfirmTitle("Delete Party");
                                  setConfirmMessage(`Are you sure you want to delete the party "${party.name}"?`);
                                  setConfirmLoadingKey(`party-${party._id}`);
                                  setConfirmAction(() => async () => {
                                    try {
                                      setActionLoading(prev => ({ ...prev, [`party-${party._id}`]: true }));
                                      await adminApi.delete(`/api/profile-types/${party._id}`);
                                      await fetchDbParties();
                                      showNotification(`Party "${party.name}" deleted`, 'success');
                                    } catch (err) {
                                      showNotification('Failed to delete party', 'error');
                                    } finally {
                                      setActionLoading(prev => ({ ...prev, [`party-${party._id}`]: false }));
                                      setConfirmOpen(false);
                                      setConfirmLoadingKey(null);
                                    }
                                  });
                                  setConfirmOpen(true);
                                }}
                              >🗑️ Delete</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className={styles.partyModalFooter}>
                    <button className={styles.btnCancel} onClick={() => { setShowPartyMgmt(false); setEditingPartyId(null); }}>Close</button>
                  </div>
                </div>
              </div>
            )}

          {/* Profession Management Modal - Moved to top level so it opens correctly */}
          {showProfMgmt && (
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={() => { setShowProfMgmt(false); setEditingProfId(null); }}>
              <div className={styles.partyModal} onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.partyModalHeader}>
                  <div className={styles.partyModalTitleRow}>
                    <span className={styles.partyModalIcon}>💼</span>
                    <div>
                      <div className={styles.partyModalTitle}>Manage Professions</div>
                      <div className={styles.partyModalSub}>
                        {dbProfessionalTypes.length} professions
                      </div>
                    </div>
                  </div>
                  <button className={styles.partyModalClose} onClick={() => { setShowProfMgmt(false); setEditingProfId(null); }}>✕</button>
                </div>

                {/* Add Profession */}
                <div className={styles.partyAddRow}>
                  <input
                    type="text"
                    placeholder="Enter profession (e.g. Doctor)"
                    value={profMgmtInput}
                    onChange={(e) => setProfMgmtInput(e.target.value)}
                    className={styles.partyAddInput}
                  />
                  <button
                    disabled={profMgmtLoading || !profMgmtInput.trim()}
                    className={styles.partyAddBtn}
                    onClick={handleAddProfession}
                  >
                    {profMgmtLoading ? "..." : "+ Add"}
                  </button>
                </div>

                {/* List */}
                <div className={styles.partyList}>
                  {dbProfessionalTypes.map((prof, i) => (
                    <div key={prof._id} className={styles.partyItem}>
                      <div className={styles.partyItemLeft}>
                        <span className={styles.partyIndex}>{i + 1}</span>
                        {editingProfId === prof._id ? (
                          <input
                            value={editingProfName}
                            onChange={(e) => setEditingProfName(e.target.value)}
                            className={styles.partyEditInput}
                          />
                        ) : (
                          <span className={styles.partyName}>{prof.name}</span>
                        )}
                      </div>
                      <div className={styles.partyItemActions}>
                        {editingProfId === prof._id ? (
                          <>
                            <button 
                              className={styles.partySaveBtn}
                              onClick={() => handleUpdateProfession(prof._id)}
                            >
                              Save
                            </button>
                            <button 
                              className={styles.partyCancelBtn}
                              onClick={() => setEditingProfId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className={styles.partyEditBtn}
                              onClick={() => { setEditingProfId(prof._id); setEditingProfName(prof.name); }}
                            >
                              Edit
                            </button>
                            <button 
                              className={styles.partyDeleteBtn}
                              onClick={() => handleDeleteProfession(prof)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.partyModalFooter}>
                  <button className={styles.btnCancel} onClick={() => { setShowProfMgmt(false); setEditingProfId(null); }}>Close</button>
                </div>
              </div>
            </div>
          )}

            {/* Add Frames Modal */}
            {showAddModal && (
              <div
                className={styles.modalOverlay}
                role="dialog"
                aria-modal="true"
                onWheel={(e) => e.stopPropagation()}
              >
                <div
                  className={styles.modalContent}
                  onClick={(e) => e.stopPropagation()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onWheel={(e) => e.stopPropagation()}
                >
                  <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>Add Frames</div>
                    <button className={styles.modalClose} aria-label="Close" onClick={() => setShowAddModal(false)}>✕</button>
                  </div>

                  <div className={styles.modalBody}>
                    {/* File Selection */}
                    <div className={styles.uploadSection}>
                      <div
                        className={styles.dragDropZone}
                        onClick={() => document.getElementById('modal-file-input').click()}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      >
                        <div className={styles.uploadIcon}>📁</div>
                        <h3>{modalFiles.length > 0 ? `${modalFiles.length} files selected` : 'Choose Images'}</h3>
                        <p>Max {maxFiles} files, 2MB each. Click or drag & drop</p>
                      </div>

                      <input
                        id="modal-file-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const errors = validateFiles(files);
                          if (errors.length) {
                            showNotification(errors.join('. '), 'error');
                            e.target.value = null;
                            return;
                          }
                          setModalFiles(files);
                          setModalPreviews(prev => {
                            prev.forEach(u => { try { URL.revokeObjectURL(u); } catch (er) { } });
                            return files.map(f => URL.createObjectURL(f));
                          });
                        }}
                        style={{ display: 'none' }}
                      />
                    </div>
                    {/* Upload card at top with preview + controls */}
                    <div className={styles.modalPreviewTop}>
                      <div className={styles.uploadCard} style={{ width: '100%', maxWidth: 820 }}>
                        <div className={styles.uploadControls}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <label className={styles.fileInputBtn} htmlFor="modal-file-input">Choose files</label>
                            <input
                              id="modal-file-input"
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setModalFiles(files);
                                setModalPreviews((prev) => {
                                  prev.forEach((u) => { try { URL.revokeObjectURL(u); } catch (er) { } });
                                  return files.map((f) => URL.createObjectURL(f));
                                });
                              }}
                              style={{ display: 'none' }}
                            />
                            <div className={styles.fileInfo}>{modalFiles && modalFiles.length ? `${modalFiles.length} file(s) selected` : 'No files'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category and Party Selection */}
                    <div className={styles.selectionRow} style={{ flexWrap: 'wrap' }}>
                      <div className={styles.selectGroup}>
                        <label>Profile Type *</label>
                        <select
                          value={modalCategory}
                          onChange={(e) => { setModalCategory(e.target.value); setModalParty(''); setModalProfessionalType(''); setModalCustomCategory(''); }}
                          className={styles.selectInput}
                        >
                          <option value="">Choose profile type</option>
                          {/* Dynamic from DB */}
                          {availableCategories.filter((c) => !c.includes('-')).map((cat) => (
                            <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                          ))}
                          {/* Core fallbacks not yet in DB */}
                          {['business', 'personal', 'political', 'professional', 'brand', 'social']
                            .filter((c) => !availableCategories.filter((x) => !x.includes('-')).includes(c))
                            .map((cat) => (
                              <option key={cat} value={cat}>{cat === 'brand' ? 'Brands' : cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                            ))}
                        </select>
                      </div>

                      {/* Political party dropdown */}
                      {modalCategory.toLowerCase() === 'political' && (
                        <div className={styles.selectGroup}>
                          <label>Political Party *</label>
                          <select
                            value={modalParty}
                            onChange={(e) => {
                              setModalParty(e.target.value);
                              setNewPartyInput('');
                            }}
                            className={styles.selectInput}
                          >
                            <option value="">Choose party</option>
                            {dynamicParties.map((p, i) => (
                              <option key={i} value={p.toLowerCase()}>{p}</option>
                            ))}
                            <option value="__add_party__">➕ Add New Party</option>
                          </select>

                          {/* Inline add-party input — only shown when "Add New Party" selected */}
                          {modalParty === '__add_party__' && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <input
                                autoFocus
                                type="text"
                                placeholder="New party name (e.g. INC)..."
                                value={newPartyInput}
                                onChange={(e) => setNewPartyInput(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && newPartyInput.trim()) {
                                    const name = newPartyInput.trim();
                                    try {
                                      await adminApi.post('/api/profile-types', { type: 'political', name });
                                      await fetchDbParties();
                                      showNotification(`Party "${name}" added`, 'success');
                                    } catch (err) {
                                      if (err.response?.status !== 409) showNotification(err.response?.data?.message || 'Failed to save party', 'error');
                                    }
                                    setModalParty(name.toLowerCase());
                                    setNewPartyInput('');
                                  }
                                  if (e.key === 'Escape') { setModalParty(''); setNewPartyInput(''); }
                                }}
                                className={styles.selectInput}
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  const name = newPartyInput.trim();
                                  if (!name) return;
                                  try {
                                    await adminApi.post('/api/profile-types', { type: 'political', name });
                                    await fetchDbParties();
                                    showNotification(`Party "${name}" added`, 'success');
                                  } catch (err) {
                                    if (err.response?.status !== 409) showNotification(err.response?.data?.message || 'Failed to save party', 'error');
                                  }
                                  setModalParty(name.toLowerCase());
                                  setNewPartyInput('');
                                }}
                                style={{ padding: '5px 12px', borderRadius: 7, background: '#22c55e', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}
                              >✓ Add</button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Brand type dropdown */}
                      {modalCategory.toLowerCase() === 'brand' && (
                        <div className={styles.selectGroup}>
                          <label>Brand Name *</label>
                          <select
                            value={modalBrandType}
                            onChange={(e) => {
                              setModalBrandType(e.target.value);
                              setNewBrandInput('');
                            }}
                            className={styles.selectInput}
                          >
                            <option value="">Choose brand</option>
                            {dbBrandTypes.map((b) => (
                              <option key={b._id} value={b.name.toLowerCase().replace(/\s+/g, '-')}>
                                {b.name}
                              </option>
                            ))}
                            <option value="__add_brand__">➕ Add New Brand</option>
                          </select>

                          {modalBrandType === '__add_brand__' && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <input
                                autoFocus
                                type="text"
                                placeholder="New brand name (e.g. Nike)..."
                                value={newBrandInput}
                                onChange={(e) => setNewBrandInput(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && newBrandInput.trim()) {
                                    const name = newBrandInput.trim();
                                    try {
                                      await adminApi.post('/api/profile-types', { type: 'brand', name });
                                      await fetchDbBrandTypes();
                                      showNotification(`Brand "${name}" added`, 'success');
                                    } catch (err) {
                                      if (err.response?.status !== 409) showNotification(err.response?.data?.message || 'Failed to save brand', 'error');
                                    }
                                    setModalBrandType(name.toLowerCase().replace(/\s+/g, '-'));
                                    setNewBrandInput('');
                                  }
                                  if (e.key === 'Escape') { setModalBrandType(''); setNewBrandInput(''); }
                                }}
                                className={styles.selectInput}
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  const name = newBrandInput.trim();
                                  if (!name) return;
                                  try {
                                    await adminApi.post('/api/profile-types', { type: 'brand', name });
                                    await fetchDbBrandTypes();
                                    showNotification(`Brand "${name}" added`, 'success');
                                  } catch (err) {
                                    if (err.response?.status !== 409) showNotification(err.response?.data?.message || 'Failed to save brand', 'error');
                                  }
                                  setModalBrandType(name.toLowerCase().replace(/\s+/g, '-'));
                                  setNewBrandInput('');
                                }}
                                style={{ padding: '5px 12px', borderRadius: 7, background: '#22c55e', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}
                              >✓ Add</button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Professional type dropdown - Added for professional category selection */}
                      {modalCategory.toLowerCase() === 'professional' && (
                        <div className={styles.selectGroup}>
                          <label>Professional Type *</label>
                          <select
                            value={modalProfessionalType}
                            onChange={(e) => {
                              setModalProfessionalType(e.target.value);
                              setProfMgmtInput('');
                            }}
                            className={styles.selectInput}
                          >
                            <option value="">Choose type</option>
                            {dbProfessionalTypes.map((type) => (
                              <option key={type._id} value={type.name.toLowerCase().replace(/\s+/g, '-')}>
                                {type.name}
                              </option>
                            ))}
                            <option value="__add_prof__">➕ Add New Profession</option>
                          </select>

                          {/* Inline add-profession input — only shown when "Add New Profession" selected */}
                          {modalProfessionalType === '__add_prof__' && (
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <input
                                autoFocus
                                type="text"
                                placeholder="New profession (e.g. Doctor)..."
                                value={profMgmtInput}
                                onChange={(e) => setProfMgmtInput(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === 'Enter' && profMgmtInput.trim()) {
                                    await handleAddProfession();
                                    const slug = profMgmtInput.trim().toLowerCase().replace(/\s+/g, '-');
                                    setModalProfessionalType(slug);
                                    setProfMgmtInput('');
                                  }
                                  if (e.key === 'Escape') { setModalProfessionalType(''); setProfMgmtInput(''); }
                                }}
                                className={styles.selectInput}
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                onClick={handleAddProfession}
                                style={{ padding: '5px 12px', borderRadius: 7, background: '#22c55e', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, whiteSpace: 'nowrap' }}
                              >✓ Add</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  <div className={styles.modalFooter}>
                    <button className={styles.btnCancel} onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button
                      className={styles.btnUpload}
                      disabled={
                        uploadingFrames ||
                        !modalFiles.length ||
                        !modalCategory ||
                        (modalCategory === 'political' && !modalParty) ||
                        (modalCategory === 'professional' && !modalProfessionalType) ||
                        (modalCategory === 'brand' && !modalBrandType) ||
                        (modalCategory === 'new' && !modalCustomCategory.trim())
                      }
                      aria-busy={uploadingFrames}
                      onClick={async () => {
                        if (!modalFiles.length || !modalCategory) {
                          showNotification('Please select files and category', 'error');
                          return;
                        }

                        if (modalCategory === 'new' && !modalCustomCategory.trim()) {
                          showNotification('Please enter a custom category name', 'error');
                          return;
                        }

                        if (modalCategory.toLowerCase() === 'political' && !modalParty) {
                          showNotification('Please select a political party', 'error');
                          return;
                        }

                        const finalCategory =
                          modalCategory === 'new'
                            ? modalCustomCategory.trim()
                            : modalCategory.toLowerCase() === 'political' && modalParty
                              ? `${modalCategory}-${modalParty}`
                              : modalCategory.toLowerCase() === 'professional' && modalProfessionalType
                                ? `${modalCategory}-${modalProfessionalType}`
                                : modalCategory.toLowerCase() === 'brand' && modalBrandType
                                  ? `${modalCategory}-${modalBrandType}`
                                  : modalCategory;
                        const fd = new FormData();
                        fd.append('category', finalCategory);
                        fd.append('layout', JSON.stringify(layout));
                        for (let f of modalFiles) fd.append('frames', f);

                        try {
                          setUploadProgressAdd(0);
                          setUploadingFrames(true);
                          await adminApi.post(`/api/frames/add`, fd, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                            onUploadProgress: (p) => {
                              const pct = p.total ? Math.round((p.loaded * 100) / p.total) : 0;
                              setUploadProgressAdd(pct);
                            },
                          }).then((res) => {
                            const uploadedCount = Array.isArray(res?.data?.frames) ? res.data.frames.length : 0;
                            const failedCount = Array.isArray(res?.data?.failed) ? res.data.failed.length : 0;
                            if (failedCount > 0) {
                              showNotification(
                                `${uploadedCount} uploaded, ${failedCount} failed. Please retry failed files.`,
                                'info'
                              );
                            } else {
                              showNotification(
                                res?.data?.message || `${uploadedCount || modalFiles.length} frames uploaded successfully`,
                                'success'
                              );
                            }
                          });
                          setShowAddModal(false);
                          setModalFiles([]);
                          setModalCategory('');
                          setModalParty('');
                          setModalProfessionalType('');
                          setModalBrandType('');
                          setModalCustomCategory('');
                          fetchFrames();
                          fetchCategories();
                        } catch (err) {
                          console.error('Upload failed:', err);
                          const status = Number(err?.response?.status || 0);
                          const failed = Array.isArray(err?.response?.data?.failed) ? err.response.data.failed : [];
                          const firstFailed = failed[0];
                          const retryAfterSeconds = Number(err?.response?.data?.retryAfterSeconds || 0);
                          const retryText = retryAfterSeconds > 0
                            ? ` Please wait ${retryAfterSeconds}s and retry.`
                            : '';
                          const apiMsg =
                            status === 429
                              ? `Too many upload requests.${retryText || ' Please try again shortly.'}`
                              : err.response?.data?.message || err.response?.data?.error || err.message;
                          const failedHint = firstFailed
                            ? ` Failed file: ${firstFailed.filename}${firstFailed.message ? ` (${firstFailed.message})` : ''}.`
                            : '';
                          showNotification(`Upload failed: ${apiMsg}${failedHint}`, 'error');
                        } finally {
                          setUploadingFrames(false);
                          setUploadProgressAdd(0);
                        }
                      }}
                    >
                      {uploadingFrames ? (
                        <>
                          <span className={styles.spinner} />
                          Uploading{uploadProgressAdd > 0 ? ` ${uploadProgressAdd}%` : ''}
                        </>
                      ) : (
                        <>🚀 Upload {modalFiles.length > 0 ? `${modalFiles.length} Frame${modalFiles.length > 1 ? 's' : ''}` : 'Frames'}</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Layout Modal (re-uses LayoutEditor) */}
            {showEditModal && (
              <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={() => setShowEditModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>Edit Frame Layout</div>
                    <button className={styles.modalClose} aria-label="Close" onClick={() => setShowEditModal(false)}>✕</button>
                  </div>

                  <div className={styles.modalBody}>
                    <div style={{ display: 'grid', gap: 12 }}>
                      {/* Unified single-column edit view: Preview -> Replace Image -> Layout */}
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div className={styles.editSection + ' ' + styles.editSectionPreview} style={{ display: 'none' }}>
                          <div style={{ width: 330, height: 415, borderRadius: 8, overflow: 'hidden', border: '1px solid #e6eef6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', background: 'transparent' }}>
                            {/* Preview container - image with live overlays positioned from `layout` (matches upload preview size/appearance) */}
                            <div ref={editPreviewRef} style={{ position: 'relative', width: 330, height: 415, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}>
                              {editPreview ? (
                                <img src={editPreview} alt="edit-preview" className={styles.fixedPreviewImage} style={{ position: 'absolute', left: 0, top: 0, width: 330, height: 415, objectFit: 'contain', display: 'block', pointerEvents: 'none' }} onError={() => setImgBroken(true)} />
                              ) : currentEditingFrame && currentEditingFrame.framePath ? (
                                <img
                                  src={currentEditingFrame.framePath?.startsWith('http') ? currentEditingFrame.framePath : `${BASE_URL}/${currentEditingFrame.framePath}`}
                                  alt="current-frame"
                                  className={styles.fixedPreviewImage}
                                  style={{ position: 'absolute', left: 0, top: 0, width: 330, height: 415, objectFit: 'contain', display: 'block', pointerEvents: 'none' }}
                                  onError={() => setImgBroken(true)}
                                />
                              ) : (
                                <div style={{ padding: 18, color: '#64748b' }}>No image</div>
                              )}

                              {/* Render overlay preview for each layout field */}
                              {currentLayoutFields && currentLayoutFields.length > 0 && currentLayoutFields.map((field, fi) => {
                                const fieldLayout = (layout && layout[field.key]) || {};
                                const left = parsePx(fieldLayout.left, 20 + fi * 10);
                                const top = parsePx(fieldLayout.top, 20 + fi * 28);
                                const fontSize = parsePx(fieldLayout.fontSize, 14);
                                const color = fieldLayout.fontColour || '#000';
                                const fontWeight = fieldLayout.fontWeight || 'normal';
                                const sample = fieldLayout.sampleText || field.label || field.key;
                                // ensure non-negative positions
                                const safeLeft = Number.isFinite(left) ? left : 0;
                                const safeTop = Number.isFinite(top) ? top : 0;

                                // render a visible box for the photo field (uses width/height)
                                if (field.key === 'photo') {
                                  const boxWidth = parsePx(fieldLayout.width, 80);
                                  const boxHeight = parsePx(fieldLayout.height, 80);
                                  return (
                                    <div
                                      key={field.key}
                                      onMouseDown={(ev) => startDrag(ev, field.key, editPreviewRef, safeLeft, safeTop)}
                                      style={{
                                        position: 'absolute',
                                        left: safeLeft,
                                        top: safeTop,
                                        width: typeof boxWidth === 'number' ? boxWidth : 80,
                                        height: typeof boxHeight === 'number' ? boxHeight : 80,
                                        border: '2px dashed rgba(0,0,0,0.6)',
                                        background: 'rgba(255,255,255,0.02)',
                                        boxSizing: 'border-box',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'move',
                                        userSelect: 'none'
                                      }}
                                    >
                                      <span style={{ fontSize: 12, color: '#0f172a', fontWeight: 600 }}>Photo</span>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={field.key}
                                    onMouseDown={(ev) => startDrag(ev, field.key, editPreviewRef, safeLeft, safeTop)}
                                    style={{
                                      position: 'absolute',
                                      left: safeLeft,
                                      top: safeTop,
                                      fontSize: typeof fontSize === 'number' ? fontSize : (Number(fontSize) || 14),
                                      color,
                                      fontWeight,
                                      cursor: 'move',
                                      userSelect: 'none',
                                      whiteSpace: 'nowrap',
                                      textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3
                                    }}
                                  >
                                    <FieldIcon fieldKey={field.key} size={14} />
                                    {sample}
                                  </div>
                                );
                              })}

                              {imgBroken && <div style={{ position: 'absolute', color: '#ef4444' }}>Failed to load image</div>}
                            </div>
                          </div>
                        </div>

                        <div className={styles.editSection + ' ' + styles.editSectionReplace}>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <label className={styles.fileInputBtn} htmlFor="edit-file-input">Choose replacement image</label>
                            <input id="edit-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                              const f = e.target.files?.[0];
                              setEditMessage('');
                              setEditSuccess('');
                              if (!f) return setEditFile(null);
                              // Validate
                              if (!f.type.startsWith('image/')) return setEditMessage('Selected file is not an image');
                              if (f.size > 2 * 1024 * 1024) return setEditMessage('File too large (max 2MB)');
                              setEditFile(f);
                              if (editPreview) { try { URL.revokeObjectURL(editPreview); } catch (er) { } }
                              setEditPreview(URL.createObjectURL(f));
                              setImgBroken(false);
                            }} />
                            <div style={{ color: '#475569', fontSize: 13, flex: 1 }}>{editFile ? editFile.name : 'No file selected'}</div>
                            <button className={styles.tableBtn} disabled={editUploading} onClick={async () => {
                              setEditMessage('');
                              setEditSuccess('');
                              if (!editFile || !editingFrame) return setEditMessage('Please select a file first');
                              const fd = new FormData();
                              fd.append('frame', editFile);
                              try {
                                setEditUploading(true);
                                setEditMessage('');
                                setUploadProgressEdit(0);
                                await adminApi.put(`/api/frames/update-image/${editingFrame}`, fd, {
                                  headers: { 'Content-Type': 'multipart/form-data' },
                                  onUploadProgress: (p) => {
                                    const pct = p.total ? Math.round((p.loaded * 100) / p.total) : 0;
                                    setUploadProgressEdit(pct);
                                  },
                                }).then((res) => {
                                  if (res?.data?.frame) setFrames((prev) => prev.map((fr) => (fr._id === res.data.frame._id ? res.data.frame : fr)));
                                  else fetchFrames();
                                  setEditSuccess('Image updated');
                                  if (editPreview) { try { URL.revokeObjectURL(editPreview); } catch (er) { } }
                                  setEditFile(null);
                                  setEditPreview('');
                                });
                              } catch (err) {
                                console.error('Failed to update image:', err);
                                setEditMessage('Image update failed');
                              } finally {
                                setEditUploading(false);
                                setUploadProgressEdit(0);
                              }
                            }}>{editUploading ? 'Uploading...' : 'Replace Image'}</button>
                          </div>
                          {typeof uploadProgressEdit === 'number' && uploadProgressEdit > 0 && (
                            <div className={styles.progressTrack}><div className={styles.progressBar} style={{ width: `${uploadProgressEdit}%` }} /></div>
                          )}
                          {editMessage && <div style={{ color: '#dc2626' }}>{editMessage}</div>}
                          {editSuccess && <div style={{ color: '#16a34a' }}>{editSuccess}</div>}
                        </div>

                        {/* Profile Type and Party Selection */}
                        <div className={styles.selectionRow} style={{ flexWrap: 'wrap' }}>
                          <div className={styles.selectGroup}>
                            <label>Profile Type</label>
                            <select
                              value={currentEditingFrame?.category?.split('-')[0] || ''}
                              onChange={async (e) => {
                                const newType = e.target.value;
                                const oldCategory = currentEditingFrame?.category || '';
                                const party = oldCategory.includes('-') ? oldCategory.split('-')[1] : '';
                                const newCategory = newType === 'political' && party ? `${newType}-${party}` : newType;

                                try {
                                  await adminApi.put(`/api/frames/${editingFrame}`, { category: newCategory });
                                  setFrames(prev => prev.map(f => f._id === editingFrame ? { ...f, category: newCategory } : f));
                                  showNotification('Profile type updated', 'success');
                                } catch (err) {
                                  showNotification('Failed to update profile type', 'error');
                                }
                              }}
                              className={styles.selectInput}
                            >
                              <option value="business">Business</option>
                              <option value="personal">Personal</option>
                              <option value="political">Political</option>
                              <option value="professional">Professional</option>
                              <option value="social">Social</option>
                            </select>
                          </div>

                          {currentEditingFrame?.category?.split('-')[0] === 'political' && (
                            <div className={styles.selectGroup}>
                              <label>Political Party <span style={{ color: '#c00' }}>*</span></label>
                              <select
                                value={currentEditingFrame?.category?.split('-')[1] || ''}
                                onChange={async (e) => {
                                  const party = e.target.value;
                                  const newCategory = `political-${party}`;

                                  try {
                                    await adminApi.put(`/api/frames/${editingFrame}`, { category: newCategory });
                                    setFrames(prev => prev.map(f => f._id === editingFrame ? { ...f, category: newCategory } : f));
                                    showNotification('Political party updated', 'success');
                                  } catch (err) {
                                    showNotification('Failed to update political party', 'error');
                                  }
                                }}
                                className={styles.selectInput}
                              >
                                <option value="">Select Party</option>
                                {dynamicParties.map((p, i) => (<option key={i} value={p.toLowerCase()}>{p}</option>))}
                              </select>
                            </div>
                          )}

                          {currentEditingFrame?.category?.split('-')[0] === 'professional' && (
                            <div className={styles.selectGroup}>
                              <label>Professional Type <span style={{ color: '#c00' }}>*</span></label>
                              <select
                                value={currentEditingFrame?.category?.split('-')[1] || ''}
                                onChange={async (e) => {
                                  const type = e.target.value;
                                  const newCategory = `professional-${type}`;

                                  try {
                                    await adminApi.put(`/api/frames/${editingFrame}`, { category: newCategory });
                                    setFrames(prev => prev.map(f => f._id === editingFrame ? { ...f, category: newCategory } : f));
                                    showNotification('Professional type updated', 'success');
                                  } catch (err) {
                                    showNotification('Failed to update professional type', 'error');
                                  }
                                }}
                                className={styles.selectInput}
                              >
                                <option value="">Select Type</option>
                                {dbProfessionalTypes.map((type, i) => (<option key={i} value={type.name.toLowerCase().replace(/\s+/g, '-')}>{type.name}</option>))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className={styles.editSection + ' ' + styles.editSectionLayout}>
                          <div style={{ padding: 8 }}>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: 14 }}>Layout Editor</span>
                              <button
                                type="button"
                                className={editEditorMode === 'canvas' ? styles.tabBtnActive : styles.tabBtn}
                                onClick={() => setEditEditorMode('canvas')}
                              >🎨 Visual (Canvas)</button>
                              <button
                                type="button"
                                className={editEditorMode === 'manual' ? styles.tabBtnActive : styles.tabBtn}
                                onClick={() => setEditEditorMode('manual')}
                              >⚙️ Manual (Pixel)</button>
                            </div>

                            {editEditorMode === 'canvas' ? (
                              <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <CanvasFrameEditor
                                  frameImageUrl={
                                    editPreview ||
                                    (currentEditingFrame?.framePath?.startsWith('http')
                                      ? currentEditingFrame.framePath
                                      : currentEditingFrame?.framePath
                                        ? `${BASE_URL}/${currentEditingFrame.framePath}`
                                        : null)
                                  }
                                  fields={currentLayoutFields}
                                  layout={layout}
                                  onChange={(newLayout) => setLayout(newLayout)}
                                />
                              </div>
                            ) : (
                              <div>
                                <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, border: '1px dashed #cbd5e1', background: '#f8fafc' }}>
                                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Bulk Change (All Text Fields)</div>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                                    <input type="text" placeholder="Font Size (px)" value={bulkStyle.fontSize} onChange={(e) => setBulkStyle((prev) => ({ ...prev, fontSize: e.target.value }))} />
                                    <input type="color" value={bulkStyle.fontColour} onChange={(e) => setBulkStyle((prev) => ({ ...prev, fontColour: e.target.value }))} style={{ width: 50, height: 34, borderRadius: 6 }} />
                                    <select value={bulkStyle.fontWeight} onChange={(e) => setBulkStyle((prev) => ({ ...prev, fontWeight: e.target.value }))}>
                                      <option value="normal">Normal</option>
                                      <option value="bold">Bold</option>
                                      <option value="bolder">Bolder</option>
                                      <option value="lighter">Lighter</option>
                                    </select>
                                    <button type="button" className={styles.smallBtn} onClick={() => applyBulkStyleToFields(currentLayoutFields)}>Apply To All</button>
                                  </div>
                                </div>
                                <LayoutEditor fields={currentLayoutFields} layout={layout} onChange={handleLayoutChange} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.modalFooter}>
                    <button className={styles.cancelBtn} onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button
                      className={styles.uploadBtn}
                      disabled={actionLoading[`layout-${editingFrame}`]}
                      aria-busy={actionLoading[`layout-${editingFrame}`]}
                      onClick={async () => {
                        if (!editingFrame) return;
                        await handleSaveLayout(editingFrame);
                        setShowEditModal(false);
                      }}
                    >
                      {actionLoading[`layout-${editingFrame}`] ? (
                        <>
                          <span className={styles.spinner} />
                          Saving...
                        </>
                      ) : (
                        'Save Layout'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* single controls card is used above; removed duplicate filterBar here */}

            {/* Table view for frames (match ManageUsers table style) */}
            <div className={styles.tableWrap} style={{ marginTop: 12, overflowX: 'auto' }}>
              <table className={styles.table} style={{ minWidth: 480 }}>
                <thead>
                  <tr>
                    <th style={{ width: 36 }}><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /></th>
                    <th>Preview</th>
                    <th>Category</th>
                    <th className={styles.hideOnMobile}>Path</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className={styles.emptyState}>
                        <span className={styles.spinner} />
                        <span style={{ marginLeft: 8 }}>Loading frames...</span>
                      </td>
                    </tr>
                  ) : filteredFrames.length === 0 ? (
                    <tr>
                      <td colSpan="5" className={styles.emptyState}>No frames found</td>
                    </tr>
                  ) : filteredFrames.map((frame, idx) => (
                    <tr key={frame._id || idx}>
                      <td><input type="checkbox" checked={selectedIds.includes(frame._id)} onChange={() => toggleSelect(frame._id)} /></td>
                      <td>
                        <img
                          src={frame.framePath?.startsWith('http') ? frame.framePath : `${BASE_URL}/${frame.framePath}`}
                          alt="Frame"
                          style={{ width: 80, height: 'auto', display: 'block', borderRadius: 6, cursor: 'pointer' }}
                          onClick={() => { setPreviewFrame(frame); setShowPreviewModal(true); }}
                        />
                      </td>
                      <td><div className={styles.emailCell}><span className={styles.categoryBadge}>{frame.category}</span></div></td>
                      <td className={styles.hideOnMobile} style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#64748b' }}>{frame.framePath}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className={styles.dangerBtnOutline}
                          onClick={() => deleteFrame(frame._id)}
                          disabled={actionLoading[frame._id]}
                        >
                          {actionLoading[frame._id] ? (
                            <>
                              <span className={styles.spinner} />
                              Deleting...
                            </>
                          ) : (
                            'Delete'
                          )}
                        </button>
                        <button
                          className={styles.primaryBtn}
                          style={{ marginLeft: 8 }}
                          onClick={() => handleEditClick(frame)}
                          disabled={actionLoading[`layout-${frame._id}`]}
                        >
                          {actionLoading[`layout-${frame._id}`] ? '⏳' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {loadingMore && (
                    <>
                      {[1, 2, 3].map((i) => (
                        <tr key={`loading-row-${i}`}>
                          <td colSpan="5" style={{ padding: '10px 12px' }}>
                            <div
                              style={{
                                height: 16,
                                width: `${80 + i * 5}%`,
                                borderRadius: 8,
                                background: 'linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 37%, #e5e7eb 63%)',
                                backgroundSize: '400% 100%'
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="5" className={styles.emptyState}>
                          <span className={styles.spinner} />
                          <span style={{ marginLeft: 8 }}>Loading next {PAGE_SIZE} frames...</span>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            {hasMore && <div ref={loadMoreTriggerRef} style={{ height: 1 }} />}
          </div>
          {/* Preview Modal */}
          {showPreviewModal && previewFrame && (
            <div className={styles.modalOverlay} onClick={() => setShowPreviewModal(false)}>
              <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={() => setShowPreviewModal(false)}>✕</button>
                <img
                  src={previewFrame.framePath?.startsWith('http') ? previewFrame.framePath : `${BASE_URL}/${previewFrame.framePath}`}
                  alt="Frame Preview"
                  style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
                />
                <div className={styles.previewInfo}>
                  <p><strong>Category:</strong> {previewFrame.category}</p>
                  <p><strong>Created:</strong> {new Date(previewFrame.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          <div className={styles.notifications}>
            {notifications.map(notification => (
              <div key={notification.id} className={`${styles.notification} ${styles[notification.type]}`}>
                {notification.message}
              </div>
            ))}
          </div>

          {/* Fullscreen Frame Editor */}
          {fullscreenFrame && (
            <FullscreenFrameEditor
              frame={fullscreenFrame}
              fields={getFieldsForCategory(fullscreenFrame.category)}
              layout={layout}
              onSave={async (newLayout) => {
                await adminApi.put(`/api/frames/update-layout/${fullscreenFrame._id}`, { layout: newLayout });
                setFrames((prev) => prev.map((f) => f._id === fullscreenFrame._id ? { ...f, layout: newLayout } : f));
                showNotification('Layout saved successfully', 'success');
                setFullscreenFrame(null);
              }}
              onClose={() => setFullscreenFrame(null)}
            />
          )}

          {/* Confirm modal for destructive actions */}
          <ConfirmModal
            open={confirmOpen}
            title={confirmTitle || 'Confirm'}
            message={confirmMessage || ''}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onCancel={() => { setConfirmOpen(false); setConfirmLoadingKey(null); }}
            onConfirm={() => { if (confirmAction) confirmAction(); }}
            loading={
              confirmLoadingKey === 'bulk'
                ? !!actionLoading.bulkDelete
                : (confirmLoadingKey ? !!actionLoading[confirmLoadingKey] : false)
            }
          />
        </>
      )}
    </div>
  );
}

export default ManageFrames;

