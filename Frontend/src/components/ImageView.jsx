// ImageView.jsx
import React, { useEffect, useState, useRef } from "react";
import { Download } from "lucide-react";
import AiFooterBox from "./AiFooterBox";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import styles from "./ImageView.module.css";
import { BASE_URL } from "../url";
import { clearAuthToken } from "../utils/auth";
import SkeletonLoader from "./SkeletonLoader";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import socket from "../socket";
import SubscriptionExpiredModal from "./SubscriptionExpiredModal";
import useSubscriptionGate from "../utils/useSubscriptionGate";
import { downloadPreviewAsCanvas, triggerDownload } from "../utils/downloadHelper";
import { stripCountryCodeForDisplay } from "../utils/phoneDisplay";
import AiFooterBox from "./AiFooterBox";

/* ---------- Helpers ---------- */
const parseNumber = (v, fallback = undefined) => {
  if (v === undefined || v === null || v === "") return fallback;
  if (typeof v === "number") return v;
  const s = String(v).trim().replace(/px$/i, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
};

const parsePercent = (v, size) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "string" && v.trim().endsWith("%")) {
    const pct = Number(v.trim().replace("%", ""));
    return Number.isFinite(pct) ? (pct / 100) * size : undefined;
  }
  return undefined;
};

const clampNumber = (value, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
};

let measureCanvas = null;
let measureCtx = null;
const getMeasureCtx = () => {
  if (typeof document === "undefined") return null;
  if (!measureCanvas) {
    measureCanvas = document.createElement("canvas");
    measureCtx = measureCanvas.getContext("2d");
  }
  return measureCtx;
};

const fitSingleLineFontSize = ({
  text = "",
  fontFamily = "Poppins, sans-serif",
  fontWeight = "normal",
  baseFontSize = 14,
  minFontSize = 8,
  maxWidth,
  maxHeight,
  extraWidth = 0,
}) => {
  const safeBase = Number.isFinite(baseFontSize) ? baseFontSize : 14;
  const minSize = Number.isFinite(minFontSize) ? minFontSize : 8;
  const widthLimit = Number.isFinite(maxWidth) ? Math.max(2, maxWidth - extraWidth) : null;
  const heightLimit = Number.isFinite(maxHeight) ? Math.max(2, maxHeight) : null;

  if (!widthLimit && !heightLimit) return safeBase;

  const ctx = getMeasureCtx();
  if (!ctx) return safeBase;
  const content = String(text || "").trim();
  if (!content) return safeBase;

  const fits = (size) => {
    ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
    const textWidth = ctx.measureText(content).width;
    if (widthLimit && textWidth > widthLimit) return false;

    // Height check: assuming typical line-height factor of ~1.3
    if (heightLimit && (size * 1.3) > heightLimit) return false;

    return true;
  };

  // Allow font to grow to fill the box — start from baseFontSize and find max that fits
  const upper = Math.max(safeBase * 4, heightLimit ? heightLimit : 120);
  let low = minSize;
  let high = upper;
  let best = minSize;

  while (high - low > 0.25) {
    const mid = (low + high) / 2;
    if (fits(mid)) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  return Math.max(minSize, Math.round(best * 10) / 10);
};

const normalizeLayoutKey = (key) => {
  const rawKey = String(key || "");
  const baseKey = rawKey.split("__")[0];
  // Map frontend field keys to admin layout keys variants
  if (baseKey.startsWith("social_")) return baseKey.split("_")[1]; // social_instagram -> instagram
  if (baseKey === "positionname") return "position"; // older naming in admin can be 'position'
  // Treat mobile and contact as same field
  if (baseKey === "mobile" || baseKey === "contact") return "mobile";
  return baseKey;
};

const resolveLayoutObject = (layout, key) => {
  if (!layout || typeof layout !== "object") return {};
  const k = String(key || "");
  const nk = normalizeLayoutKey(k);

  const lowKey = k.toLowerCase();
  const lowNorm = String(nk).toLowerCase();
  const candidates = new Set([k, nk, lowKey, lowNorm]);

  // Support both social key styles:
  // admin/user can store either "instagram" OR "social_instagram".
  const socialAliases = ["instagram", "facebook", "linkedin", "twitter", "snapchat", "youtube", "telegram", "discord"];
  socialAliases.forEach((name) => {
    const socialKey = `social_${name}`;
    if (lowKey === name || lowNorm === name || lowKey === socialKey || lowNorm === socialKey) {
      candidates.add(name);
      candidates.add(socialKey);
    }
  });

  // Support both position key styles.
  if (lowKey === "position" || lowKey === "positionname" || lowNorm === "position" || lowNorm === "positionname") {
    candidates.add("position");
    candidates.add("positionname");
  }

  // Support both mobile/contact key styles (they are the same field).
  if (lowKey === "mobile" || lowKey === "contact" || lowNorm === "mobile" || lowNorm === "contact") {
    candidates.add("mobile");
    candidates.add("contact");
  }

  if (String(k).toLowerCase() === "photo") {
    ["photo", "profileimage", "profile_image", "image", "userimage", "user_image"].forEach((x) =>
      candidates.add(x)
    );
  }

  for (const candidate of candidates) {
    if (candidate && layout[candidate]) return layout[candidate];
  }

  const entries = Object.entries(layout);
  for (const [lk, lv] of entries) {
    const low = String(lk || "").toLowerCase();
    if (candidates.has(low)) return lv || {};
  }
  return {};
};

/* global/default layout used only as last fallback */
const defaultLayout = {
  profiletype: { left: 30, top: 20, fontSize: "14px", fontColour: "#fff", fontStyle: "Poppins, sans-serif", fontWeight: "600" },
  name: { left: 30, top: 40, fontSize: "20px", fontColour: "#fff", fontStyle: "Poppins, sans-serif", fontWeight: "700" },
  designation: { left: 30, top: 75, fontSize: "16px", fontColour: "#fff", fontStyle: "Poppins, sans-serif", fontWeight: "500" },
  positionname: { left: 30, top: 75, fontSize: "16px", fontColour: "#fff", fontStyle: "Poppins, sans-serif", fontWeight: "500" },
  businessName: { left: 30, top: 40, fontSize: "18px", fontColour: "#fff", fontStyle: "Poppins, sans-serif", fontWeight: "700" },
  businessTagline: { left: 30, top: 72, fontSize: "14px", fontColour: "#fff" },
  mobile: { left: 30, top: 220, fontSize: "14px", fontColour: "" },
  address: { left: 30, top: 250, fontSize: "14px", fontColour: "#fff" },
  social_instagram: { left: 30, top: 285, fontSize: "14px", fontColour: "#fff" },
  social_facebook: { left: 30, top: 315, fontSize: "14px", fontColour: "#fff" },
  social_linkedin: { left: 30, top: 345, fontSize: "14px", fontColour: "#fff" },
  social_twitter: { left: 30, top: 345, fontSize: "12px", fontColour: "#fff" },
  categories: { left: 30, top: 280, fontSize: "14px", fontColour: "#fff" },
};

/* icon map */
const iconBase = (import.meta && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : "/";
const normalizeBase = (b) => (b && b.endsWith("/")) ? b : `${b || "/"}/`;
const iconAssetMap = {
  social_instagram: `${normalizeBase(iconBase)}icons/instagram.png`,
  social_facebook: `${normalizeBase(iconBase)}icons/facebook.png`,
  social_linkedin: `${normalizeBase(iconBase)}icons/linkedin.png`,
  social_twitter: `${normalizeBase(iconBase)}icons/twitter.png`,
  social_snapchat: `${normalizeBase(iconBase)}icons/snapchat.png`,
  social_youtube: `${normalizeBase(iconBase)}icons/youtube.png`,
  social_telegram: `${normalizeBase(iconBase)}icons/telegram.png`,
  social_discord: `${normalizeBase(iconBase)}icons/discord.png`,
  instagram: `${normalizeBase(iconBase)}icons/instagram.png`,
  facebook: `${normalizeBase(iconBase)}icons/facebook.png`,
  linkedin: `${normalizeBase(iconBase)}icons/linkedin.png`,
  twitter: `${normalizeBase(iconBase)}icons/twitter.png`,
  snapchat: `${normalizeBase(iconBase)}icons/snapchat.png`,
  youtube: `${normalizeBase(iconBase)}icons/youtube.png`,
  telegram: `${normalizeBase(iconBase)}icons/telegram.png`,
  discord: `${normalizeBase(iconBase)}icons/discord.png`,
  website: `${normalizeBase(iconBase)}icons/website.png`,
  designation: `${normalizeBase(iconBase)}icons/designation.png`,
  position: `${normalizeBase(iconBase)}icons/designation.png`,
  positionname: `${normalizeBase(iconBase)}icons/designation.png`,
  businessname: `${normalizeBase(iconBase)}icons/business.png`,
  organization: `${normalizeBase(iconBase)}icons/business.png`,
  partyname: `${normalizeBase(iconBase)}icons/business.png`,
  bio: `${normalizeBase(iconBase)}icons/bio.png`,
  address: `${normalizeBase(iconBase)}icons/address.png`,
  mobile: `${normalizeBase(iconBase)}icons/contact.png`,
  contact: `${normalizeBase(iconBase)}icons/contact.png`,
  email: `${normalizeBase(iconBase)}icons/email.png`,
  categories: `${normalizeBase(iconBase)}icons/categories.png`,
};

const resolveSocialKey = (key) => {
  if (!key) return null;
  const k = String(key).toLowerCase();
  if (k.includes("insta") && !k.includes("instagram")) return "instagram";
  if (k.includes("instagram")) return "instagram";
  if (k.includes("facebook")) return "facebook";
  if (k.includes("linkedin")) return "linkedin";
  if (k.includes("twitter")) return "twitter";
  if (k.includes("snapchat")) return "snapchat";
  if (k.includes("youtube")) return "youtube";
  if (k.includes("telegram")) return "telegram";
  if (k.includes("discord")) return "discord";
  return null;
};

const getIconSrc = (key) => {
  const resolved = resolveSocialKey(key);
  const normalizedKey = String(normalizeLayoutKey(key) || "").toLowerCase();
  return (
    iconAssetMap[key] ||
    iconAssetMap[normalizedKey] ||
    (resolved ? iconAssetMap[resolved] : null)
  );
};

const getFieldGlyph = (rawKey) => {
  const key = String(normalizeLayoutKey(rawKey) || "").toLowerCase();
  if (!key || key === "name") return "";
  if (key === "instagram" || key === "social_instagram") return "📷";
  if (key === "facebook" || key === "social_facebook") return "f";
  if (key === "linkedin" || key === "social_linkedin") return "in";
  if (key === "twitter" || key === "social_twitter") return "𝕏";
  if (key === "snapchat" || key === "social_snapchat") return "👻";
  if (key === "youtube" || key === "social_youtube") return "📺";
  if (key === "telegram" || key === "social_telegram") return "✈";
  if (key === "discord" || key === "social_discord") return "🎮";
  if (key === "businessname" || key === "organization" || key === "partyname") return "🏢";
  if (key === "designation" || key === "position" || key === "positionname") return "💼";
  if (key === "website") return "🌐";
  if (key === "bio") return "✍";
  if (key === "address") return "🏠";
  if (key === "mobile" || key === "contact") return "☎";
  if (key === "email") return "✉";
  if (key === "categories") return "🏷";
  return "";
};

const ADMIN_PREVIEW_WIDTH = 330;
const ADMIN_PREVIEW_HEIGHT = 415;

// 🔥 Helper function to check if frame is relevant to selected display fields
const isFrameRelevantToFields = (frame, selectedFields) => {
  if (!selectedFields || selectedFields.length === 0) return true; // All frames shown if no fields selected
  if (!frame?.layout) return false;

  // Get all layout keys from the frame (excluding 'photo')
  const frameLayoutKeys = Object.keys(frame.layout || {})
    .map(k => normalizeLayoutKey(k).toLowerCase())
    .filter(k => k !== 'photo');

  // Check if any of the user's selected fields match the frame's layout keys
  return selectedFields.some(field => {
    const normalizedField = normalizeLayoutKey(field).toLowerCase();
    return frameLayoutKeys.includes(normalizedField);
  });
};

const ImageView = () => {
  const { category } = useParams();
  const isLogoTemplates = String(category || "").toLowerCase() === "logo_templates";
  const navigate = useNavigate();
  const location = useLocation();
  const selectedImageFromState = location.state?.selectedImage;
  const storedSelectedForCategory = sessionStorage.getItem(`imageViewSelected:${category}`) || null;
  const [images, setImages] = useState([]);
  const [frames, setFrames] = useState([]);
  const [baseImage, setBaseImage] = useState(null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [profile, setProfile] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [resumeHint, setResumeHint] = useState(false);
  const downloadContainerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const { showExpiredModal, setShowExpiredModal, ensureSubscriptionAccess } = useSubscriptionGate();

  const previewRef = useRef(null);
  const textRefs = useRef({});
  const imageRef = useRef(null);
  const [imagePos, setImagePos] = useState({ left: 100, top: 100 });
  const [textPositions, setTextPositions] = useState({});
  const draggingRef = useRef(null);
  const [selectedDisplayFields, setSelectedDisplayFields] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [subscription, setSubscription] = useState(null);

  // ✅ Ensure the page always scrolls to the very top when opened, slightly delayed to avoid fighting with home page's scroll saver
  useEffect(() => {
    const timer = setTimeout(() => window.scrollTo(0, 0), 100);
    return () => clearTimeout(timer);
  }, [category]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadContainerRef.current && !downloadContainerRef.current.contains(event.target)) {
        setShowFormatOptions(false);
      }
    };

    if (showFormatOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFormatOptions]);

  // ✅ Close format options and expired modal on ESC key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowFormatOptions(false);
        setShowExpiredModal(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [setShowExpiredModal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (isLogoTemplates) {
          const imageRes = await axios.get(`${BASE_URL}/api/images/category/${category}`, { withCredentials: true });
          const fetchedImages = imageRes.data || [];
          setImages(fetchedImages);
          setFrames([]);
          setSelectedFrame(null);
          setUploadedImage(null);

          if (selectedImageFromState) {
            setBaseImage(selectedImageFromState);
          } else if (storedSelectedForCategory) {
            setBaseImage(storedSelectedForCategory);
            setResumeHint(true);
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = setTimeout(() => setResumeHint(false), 2500);
          } else {
            setBaseImage(null);
          }
          return;
        }

        // fetch profile — include credentials so cookie/session auth works too
        let profileRes = null;
        try {
          profileRes = await axios.get(`${BASE_URL}/api/profiles/me?t=${Date.now()}`, { withCredentials: true });
        } catch (err) {
          if (err?.response?.status === 401) {
            // unauthorized — clear any stored token and continue without profile
            clearAuthToken();
            setProfile(null);
          } else {
            throw err;
          }
        }

        const userProfile = profileRes?.data?.profile || profileRes?.data || {};
        // normalize boolean flags (same as your original)
        const booleanFields = [
          "visibleName",
          "showDesignation",
          "showMobile",
          "showCategories",
          "showAddress",
          "showInstagram",
          "showTwitter",
          "showFacebook",
          "showLinkedIn",
          "showPosition",
          "showBusinessName",
          "showBusinessTagline",
          "showProfileImage",
        ];
        booleanFields.forEach((f) => {
          if (typeof userProfile[f] !== "undefined") {
            const v = userProfile[f];
            userProfile[f] = v === true || v === "true" || v === "1" || v === 1;
          } else {
            userProfile[f] = false;
          }
        });

        const actualProfileType = String(userProfile.profiletype || userProfile.profileType || "personal").toLowerCase();
        userProfile.profiletype = actualProfileType;

        if (!Array.isArray(userProfile.categories)) {
          if (typeof userProfile.categories === "string") {
            try {
              userProfile.categories = JSON.parse(userProfile.categories);
              if (!Array.isArray(userProfile.categories)) {
                userProfile.categories = String(userProfile.categories).split(",").map(s => s.trim()).filter(Boolean);
              }
            } catch (e) {
              userProfile.categories = String(userProfile.categories).split(",").map(s => s.trim()).filter(Boolean);
            }
          } else {
            userProfile.categories = userProfile.categories || [];
          }
        }

        const userData = profileRes?.data?.user || {};
        // Merge email and phone from user account if missing in profile
        if (!userProfile.email && userData.email) userProfile.email = userData.email;
        if (!userProfile.mobile && userData.phone) userProfile.mobile = userData.phone;
        if (!userProfile.contact && userData.phone) userProfile.contact = userData.phone;

        // Get subscription for real-time expiry check
        const sub = profileRes?.data?.subscription;
        if (sub) {
          setSubscription(sub);
        }

        setProfile(userProfile);

        // Store selectedDisplayFields from profile
        if (userProfile.selectedDisplayFields && Array.isArray(userProfile.selectedDisplayFields) && userProfile.selectedDisplayFields.length > 0) {
          // Normalize: treat mobile and contact as same field (mobile)
          const normalized = userProfile.selectedDisplayFields.map(f => {
            const lowered = String(f || '').toLowerCase();
            if (lowered === 'contact' || lowered === 'mobile') return 'mobile';
            return f;
          });
          setSelectedDisplayFields([...new Set(normalized)]);
        } else {
          setSelectedDisplayFields([]);
        }

        // build frames URL
        let frameUrl = `${BASE_URL}/api/frames/category/${userProfile.profiletype}`;
        if (userProfile.profiletype?.toLowerCase() === "political" && userProfile.partyname) {
          const formattedParty = encodeURIComponent(userProfile.partyname.toLowerCase());
          frameUrl = `${BASE_URL}/api/frames/category/${userProfile.profiletype}-${formattedParty}`;
        }
        // If profile type is professional and categories are available, filter frames by category
        else if (userProfile.profiletype?.toLowerCase() === "professional" && userProfile.categories) {
          const categoryName = String(userProfile.categories).toLowerCase();
          const formattedCategory = encodeURIComponent(categoryName);
          frameUrl = `${BASE_URL}/api/frames/category/${userProfile.profiletype}-${formattedCategory}`;
        }
        else if (userProfile.profiletype?.toLowerCase() === "brand" && userProfile.brandName) {
          const formattedBrand = encodeURIComponent(String(userProfile.brandName).toLowerCase().replace(/\s+/g, '-'));
          frameUrl = `${BASE_URL}/api/frames/category/${userProfile.profiletype}-${formattedBrand}`;
        }

        const [imageRes, frameRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/images/category/${category}`, { withCredentials: true }),
          axios.get(frameUrl, { withCredentials: true }),
        ]);

        const fetchedImages = imageRes.data || [];
        const fetchedFrames = frameRes.data?.frames || frameRes.data || [];

        setImages(fetchedImages);
        setFrames(fetchedFrames);

        if (fetchedFrames.length > 0) {
          setSelectedFrame((prev) => prev || fetchedFrames[0]);
        }

        if (selectedImageFromState) {
          setBaseImage(selectedImageFromState);
        } else if (storedSelectedForCategory) {
          setBaseImage(storedSelectedForCategory);
          setResumeHint(true);
          if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
          resumeTimerRef.current = setTimeout(() => setResumeHint(false), 2500);
        } else {
          setBaseImage(null);
        }

        if (userProfile.file) {
          const filePath = userProfile.file.startsWith("http") ? userProfile.file : `${BASE_URL}${userProfile.file}`;
          setUploadedImage(filePath);
        } else {
          setUploadedImage(null);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, isLogoTemplates, reloadKey]);

  useEffect(() => {
    if (selectedImageFromState) {
      setBaseImage(selectedImageFromState);
    }
  }, [selectedImageFromState]);

  // Real-time: when admin updates profile types/frames/images, reload data
  useEffect(() => {
    const handler = () => setReloadKey(k => k + 1);
    socket.on('profileTypeUpdated', handler);
    socket.on('frameUpdated', handler);
    socket.on('imageUpdated', handler);
    socket.on('categoryUpdated', handler);
    socket.on('subscriptionUpdated', handler);
    return () => {
      socket.off('profileTypeUpdated', handler);
      socket.off('frameUpdated', handler);
      socket.off('imageUpdated', handler);
      socket.off('categoryUpdated', handler);
      socket.off('subscriptionUpdated', handler);
    };
  }, []);

  useEffect(() => {
    if (!category || !baseImage) return;
    sessionStorage.setItem(`imageViewSelected:${category}`, baseImage);
  }, [category, baseImage]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // Sync imagePos from selectedFrame layout when frame changes
  useEffect(() => {
    const previewW = previewRef.current?.offsetWidth || ADMIN_PREVIEW_WIDTH;
    const previewH = previewRef.current?.offsetHeight || ADMIN_PREVIEW_HEIGHT;
    const scaleX = previewW / ADMIN_PREVIEW_WIDTH;
    const scaleY = previewH / ADMIN_PREVIEW_HEIGHT;

    const photoLayout = resolveLayoutObject(selectedFrame?.layout, "photo");
    // Keep defaults aligned with ManageFrames preview defaults
    const rawLeft = parseNumber(photoLayout?.left, parseNumber(photoLayout?.x, 20));
    const rawTop = parseNumber(photoLayout?.top, parseNumber(photoLayout?.y, 20));
    const left = Number.isFinite(rawLeft) ? rawLeft * scaleX : 20;
    const top = Number.isFinite(rawTop) ? rawTop * scaleY : 20;
    setImagePos({ left: Number.isFinite(left) ? left : 20, top: Number.isFinite(top) ? top : 20 });
  }, [selectedFrame, uploadedImage]);

  // Reset text drag overrides when frame changes so saved layout is applied
  useEffect(() => {
    setTextPositions({});
  }, [selectedFrame?._id]);

  const getEventPoint = (e) => {
    if (e?.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e?.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    if (typeof e?.clientX === "number" && typeof e?.clientY === "number") {
      return { x: e.clientX, y: e.clientY };
    }
    return null;
  };

  // Drag handlers for preview image (mouse + touch) with left/top coordinates
  const handleImageDragStart = (e) => {
    if (typeof e.button === "number" && e.button !== 0) return; // left click only for mouse
    const point = getEventPoint(e);
    if (!point) return;
    e.preventDefault();
    const startX = point.x;
    const startY = point.y;
    const origLeft = Number(imagePos.left || 0);
    const origTop = Number(imagePos.top || 0);
    draggingRef.current = { startX, startY, origLeft, origTop };

    const onMove = (ev) => {
      const movePoint = getEventPoint(ev);
      if (!movePoint) return;
      ev.preventDefault();
      if (!draggingRef.current) return;
      const dx = movePoint.x - draggingRef.current.startX;
      const dy = movePoint.y - draggingRef.current.startY;
      setImagePos({ left: Math.round(draggingRef.current.origLeft + dx), top: Math.round(draggingRef.current.origTop + dy) });
    };

    const onUp = () => {
      draggingRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  // Drag for text overlays (mouse + touch)
  const handleTextDragStart = (e, key, startLeft, startTop) => {
    if (typeof e.button === "number" && e.button !== 0) return; // left click only for mouse
    const point = getEventPoint(e);
    if (!point) return;
    e.preventDefault();
    const startX = point.x;
    const startY = point.y;
    const origLeft = Number(startLeft || 0);
    const origTop = Number(startTop || 0);

    const onMove = (ev) => {
      const movePoint = getEventPoint(ev);
      if (!movePoint) return;
      ev.preventDefault();
      const dx = movePoint.x - startX;
      const dy = movePoint.y - startY;
      setTextPositions((prev) => ({
        ...prev,
        [key]: { left: Math.round(origLeft + dx), top: Math.round(origTop + dy) },
      }));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  };

  const handleDownload = async (format = 'png') => {
    await ensureSubscriptionAccess(async () => {
      const preview = previewRef.current;
      if (!preview) return;
      try {
        if (typeof document !== 'undefined' && document.fonts?.ready) {
          await document.fonts.ready;
        }
        if (format === 'pdf') {
          const canvas = await downloadPreviewAsCanvas(preview);
          if (!canvas) return;
          const exportScale = 3;
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = canvas.width / exportScale;
          const imgHeight = canvas.height / exportScale;
          const pdf = new jsPDF({
            orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [imgWidth, imgHeight],
            compress: false,
          });
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
          pdf.save(`${category}_preview.pdf`);
        } else {
          const canvas = await downloadPreviewAsCanvas(preview);
          triggerDownload(canvas, format, category);
        }
      } catch (err) {
        console.error('Download failed:', err);
      } finally {
        setShowFormatOptions(false);
      }
    });
  };

  if (loading) return <SkeletonLoader />;
  if (isLogoTemplates) {
    return (
      <div className={styles.pageContainer}>
        <SubscriptionExpiredModal
          open={showExpiredModal}
          onClose={() => setShowExpiredModal(false)}
          onUpgrade={() => navigate("/pricing")}
          message="Your free trial or premium plan has ended. Please upgrade your plan to download templates."
        />
        <div className={styles.headerBar}>
          <button
            className={styles.backBtn}
            onClick={() => {
              if (category) sessionStorage.removeItem(`imageViewSelected:${category}`);
              navigate(-1);
            }}
          >
            ← Back
          </button>
          <h1 className={styles.pageTitle}>Logo Templates Gallery</h1>
          {resumeHint && <span className={styles.resumeBadge}>Resuming last image</span>}
        </div>

        <div className={styles.mainGrid}>
          <div className={styles.previewSection}>
            <h2 className={styles.sectionTitleDesktop}>Template Preview</h2>
            {baseImage ? (
              <div className={styles.previewContainer}>
                <div className={styles.previewWrapperOuter}>
                  <div ref={previewRef} className={styles.previewWrapper}>
                    <img src={baseImage} alt="Logo Template" className={styles.basePreviewImage} />
                  </div>
                  {/* Mobile-only floating download icon */}
                  <button
                    className={styles.mobileDownloadIcon}
                    onClick={() => ensureSubscriptionAccess(() => setShowFormatOptions(!showFormatOptions))}
                    aria-label="Download"
                  >
                    <Download size={19} />
                  </button>
                  {showFormatOptions && (
                    <div className={styles.formatOptionsMobile}>
                      <button onClick={() => handleDownload("png")} className={styles.formatBtn}>PNG</button>
                      <button onClick={() => handleDownload("jpg")} className={styles.formatBtn}>JPG</button>
                      <button onClick={() => handleDownload("pdf")} className={styles.formatBtn}>PDF</button>
                    </div>
                  )}
                </div>

                <div ref={downloadContainerRef} className={`${styles.downloadContainer} ${styles.downloadContainerDesktop}`}>
                  <button
                    onClick={() => ensureSubscriptionAccess(() => setShowFormatOptions(!showFormatOptions))}
                    className={styles.downloadBtn}
                  >
                    Download Image
                  </button>
                  {showFormatOptions && (
                    <div className={styles.formatOptions}>
                      <button onClick={() => handleDownload("png")} className={styles.formatBtn}>PNG</button>
                      <button onClick={() => handleDownload("jpg")} className={styles.formatBtn}>JPG</button>
                      <button onClick={() => handleDownload("pdf")} className={styles.formatBtn}>PDF</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className={styles.emptyText}>No logo template available.</p>
            )}
          </div>

          <div className={styles.controlsSection}>
            <div className={styles.imagesPanel}>
              <h2 className={styles.sectionTitle}>Template Images</h2>
              <div className={styles.gridContainer}>
                {images.length > 0 ? (
                  images.map((img, index) => (
                    <div
                      key={index}
                      className={`${styles.imageItem} ${baseImage === img.url ? styles.activeImage : ""}`}
                      onClick={() => setBaseImage(img.url)}
                    >
                      <img src={img.url} alt={`Logo Template ${index + 1}`} />
                    </div>
                  ))
                ) : (
                  <p className={styles.noImagesMessage}>No logo templates available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!profile) return <p>No profile found.</p>;

  const profileType = profile.profiletype?.toLowerCase();
  const currentSection = profileType && profile[profileType] ? profile[profileType] : {};

  const coerceBool = (v, defaultValue = true) => {
    if (v === undefined || v === null) return defaultValue;
    if (typeof v === "string") return v === "true" || v === "1";
    return Boolean(v);
  };

  const getField = (key) => {
    const topVal = profile?.[key];
    if (topVal !== undefined && topVal !== null && topVal !== "") return topVal;
    const secVal = currentSection?.[key];
    if (secVal !== undefined && secVal !== null && secVal !== "") return secVal;
    return undefined;
  };

  const canShow = (flagKey) => {
    if (profile && profile[flagKey] !== undefined && profile[flagKey] !== null) {
      return coerceBool(profile[flagKey], true);
    }
    if (currentSection && currentSection[flagKey] !== undefined && currentSection[flagKey] !== null) {
      return coerceBool(currentSection[flagKey], true);
    }
    return true;
  };

  let fieldsToShow = [];

  const profileTypeLabel = profileType ? profileType.charAt(0).toUpperCase() + profileType.slice(1) : "";

  const resolveValueForLayoutKey = (k) => {
    const key = String(k || "").toLowerCase();
    if (key === "photo") return undefined;
    if (key === "name") return getField("name");
    if (key === "positionname" || key === "position") return getField("positionname") || getField("designation") || profileTypeLabel || "";
    if (key === "designation") return getField("designation") || getField("positionname");
    if (key === "businessname") return getField("businessName");
    if (key === "businesstagline") return getField("businessTagline");
    if (key === "partyname") return getField("partyname") || getField("organization");
    if (key === "organization") return getField("organization") || getField("partyname");
    if (key === "categories") {
      const cats = getField("categories");
      return Array.isArray(cats) ? cats.join(", ") : cats;
    }
    if (key === "email") return getField("email");
    if (key === "brandname" || key === "brandName") return getField("brandName") || getField("brandname");
    if (key === "bio") return getField("bio");
    if (key === "website") return getField("website");
    if (key === "address") return getField("address");
    if (key === "mobile") return stripCountryCodeForDisplay(getField("mobile") || getField("contact"));
    if (key === "contact") return stripCountryCodeForDisplay(getField("mobile") || getField("contact"));
    if (key === "instagram") return getField("social_instagram");
    if (key === "facebook") return getField("social_facebook");
    if (key === "linkedin") return getField("social_linkedin");
    if (key === "twitter") return getField("social_twitter");
    if (key === "snapchat") return getField("social_snapchat");
    if (key === "youtube") return getField("social_youtube");
    if (key === "telegram") return getField("social_telegram");
    if (key === "discord") return getField("social_discord");
    if (key === "personal") return undefined;
    if (key === "personalprimary") return undefined;
    if (key === "personaldetails") return undefined;
    if (key === "social") return undefined;
    if (key === "profiletype") return profileTypeLabel || "";
    return getField(k);
  };
  const toRenderableLabel = (value) => {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
  };

  const layoutKeys = selectedFrame?.layout ? Object.keys(selectedFrame.layout).filter((k) => k && k !== "photo") : [];
  if (layoutKeys.length) {
    let keysToRender = [];
    const fixedFields = ["address"];

    if (selectedDisplayFields?.length) {
      const getRawSlotKey = (rawKey) => String(rawKey || "").split("__")[0].toLowerCase();
      const getFieldGroupKey = (rawKey) => {
        const rawSlot = getRawSlotKey(rawKey);
        if (rawSlot === "personal" || rawSlot === "personalprimary" || rawSlot === "personaldetails") return "personal";
        if (rawSlot === "contact" || rawSlot === "social") return rawSlot;

        const k = String(normalizeLayoutKey(rawKey) || "").toLowerCase();
        if (!k) return "other";
        if (
          k === "name" || k === "bio" || k === "designation" || k === "businessname" ||
          k === "website" || k === "categories" || k === "organization" || k === "partyname" ||
          k === "position" || k === "positionname"
        ) return "personal";
        if (k === "email" || k === "mobile" || k === "contact" || k === "fax") return "contact";
        if (
          k === "instagram" || k === "facebook" || k === "linkedin" || k === "twitter" ||
          k === "snapchat" || k === "youtube" || k === "telegram" || k === "discord"
        ) return "social";
        return "other";
      };
      const normalizeFieldName = (rawKey) => String(normalizeLayoutKey(rawKey) || "").toLowerCase();
      const isPrimaryPersonalField = (rawKey) => {
        const key = normalizeFieldName(rawKey);
        return key === "name" || key === "businessname" || key === "organization" || key === "partyname" || key === "brandname";
      };

      const genericSlotKeys = new Set(["personal", "personalprimary", "personaldetails", "contact", "social"]);
      const hasGenericSlots = layoutKeys.some((k) => genericSlotKeys.has(getRawSlotKey(k)));
      const dynamicLayoutSlots = layoutKeys.filter((k) => {
        const rawSlot = getRawSlotKey(k);
        const normalized = String(normalizeLayoutKey(k) || "").toLowerCase();
        if (fixedFields.includes(normalized)) return false;
        if (hasGenericSlots) return genericSlotKeys.has(rawSlot);
        return true;
      });

      const selectedByGroup = { personal: [], contact: [], social: [], other: [] };
      selectedDisplayFields.forEach((selectedKey) => {
        const group = getFieldGroupKey(selectedKey);
        selectedByGroup[group].push(selectedKey);
      });
      const pickFromGroup = (groupName, predicate = null) => {
        const group = selectedByGroup[groupName];
        if (!Array.isArray(group) || !group.length) return null;
        if (!predicate) return group.shift();
        const idx = group.findIndex(predicate);
        if (idx === -1) return null;
        const [picked] = group.splice(idx, 1);
        return picked;
      };
      const remaining = () => {
        if (selectedByGroup.other.length) return selectedByGroup.other.shift();
        if (selectedByGroup.personal.length) return selectedByGroup.personal.shift();
        if (selectedByGroup.contact.length) return selectedByGroup.contact.shift();
        if (selectedByGroup.social.length) return selectedByGroup.social.shift();
        return null;
      };

      keysToRender = dynamicLayoutSlots
        .map((layoutKey) => {
          const slotGroup = getFieldGroupKey(layoutKey);
          const rawSlot = getRawSlotKey(layoutKey);
          let sourceKey = null;
          if (slotGroup === "personal") {
            if (rawSlot === "personalprimary") {
              sourceKey = pickFromGroup("personal", isPrimaryPersonalField) || pickFromGroup("personal");
            } else if (rawSlot === "personaldetails") {
              sourceKey = pickFromGroup("personal", (k) => !isPrimaryPersonalField(k)) || pickFromGroup("personal");
            } else {
              sourceKey = pickFromGroup("personal");
            }
          } else if (slotGroup === "contact" || slotGroup === "social") {
            sourceKey = pickFromGroup(slotGroup);
          } else {
            sourceKey = remaining();
          }
          if (!sourceKey) return null;
          return { layoutKey, sourceKey };
        })
        .filter(Boolean);
    } else {
      const getRawSlotKey = (rawKey) => String(rawKey || "").split("__")[0].toLowerCase();
      const genericSlotKeys = new Set(["personal", "personalprimary", "personaldetails", "contact", "social"]);
      const hasGenericSlots = layoutKeys.some((k) => genericSlotKeys.has(getRawSlotKey(k)));

      const profileTypeDefaults = {
        professional: ["name", "designation", "mobile", "social_instagram", "social_linkedin"],
        business: ["name", "designation", "mobile", "social_instagram", "social_linkedin"],
        personal: ["name", "bio", "mobile", "social_instagram", "social_linkedin"],
        social: ["name", "designation", "mobile", "social_instagram", "social_linkedin"],
        political: ["name", "positionname", "mobile", "social_instagram", "social_twitter"],
        brand: ["name", "designation", "mobile", "social_instagram", "social_linkedin"],
      };

      const autoFields = profileTypeDefaults[profileType] || ["name", "designation", "mobile", "social_instagram", "social_linkedin"];

      const filledAutoFields = autoFields.filter((fieldKey) => {
        const val = resolveValueForLayoutKey(fieldKey);
        return val !== undefined && val !== null && String(val).trim() !== "";
      });

      const getFieldGroupKeyAuto = (rawKey) => {
        const k = String(normalizeLayoutKey(rawKey) || "").toLowerCase();
        if (["name", "bio", "designation", "businessname", "website", "categories", "organization", "partyname", "position", "positionname", "brandname"].includes(k)) return "personal";
        if (["email", "mobile", "contact", "fax"].includes(k)) return "contact";
        if (["instagram", "facebook", "linkedin", "twitter", "snapchat", "youtube", "telegram", "discord"].includes(k)) return "social";
        return "other";
      };
      const normalizeAutoKey = (rawKey) => String(normalizeLayoutKey(rawKey) || "").toLowerCase();
      const isPrimaryAutoField = (rawKey) => {
        const key = normalizeAutoKey(rawKey);
        return key === "name" || key === "businessname" || key === "organization" || key === "partyname" || key === "brandname";
      };

      if (hasGenericSlots && filledAutoFields.length > 0) {
        const autoByGroup = { personal: [], contact: [], social: [], other: [] };
        filledAutoFields.forEach((fk) => { const g = getFieldGroupKeyAuto(fk); autoByGroup[g].push(fk); });
        const pickAuto = (groupName, predicate = null) => {
          const group = autoByGroup[groupName];
          if (!Array.isArray(group) || !group.length) return null;
          if (!predicate) return group.shift();
          const idx = group.findIndex(predicate);
          if (idx === -1) return null;
          const [picked] = group.splice(idx, 1);
          return picked;
        };

        const dynamicSlots = layoutKeys.filter((k) => {
          const rawSlot = getRawSlotKey(k);
          const normalized = String(normalizeLayoutKey(k) || "").toLowerCase();
          return !fixedFields.includes(normalized) && genericSlotKeys.has(rawSlot);
        });

        keysToRender = dynamicSlots.map((layoutKey) => {
          const rawSlot = getRawSlotKey(layoutKey);
          let sourceKey = null;
          if (rawSlot === "personalprimary") {
            sourceKey = pickAuto("personal", isPrimaryAutoField) || pickAuto("personal");
          } else if (rawSlot === "personaldetails") {
            sourceKey = pickAuto("personal", (k) => !isPrimaryAutoField(k)) || pickAuto("personal");
          } else if (rawSlot === "personal") {
            sourceKey = pickAuto("personal");
          } else if (rawSlot === "contact") {
            sourceKey = pickAuto("contact");
          } else if (rawSlot === "social") {
            sourceKey = pickAuto("social");
          }
          else sourceKey = autoByGroup.other.shift() || autoByGroup.personal.shift();
          return sourceKey ? { layoutKey, sourceKey } : null;
        }).filter(Boolean);
      } else {
        keysToRender = layoutKeys
          .filter((k) => !fixedFields.includes(String(normalizeLayoutKey(k) || "").toLowerCase()))
          .map((k) => ({ layoutKey: k, sourceKey: k }));
      }
    }

    fieldsToShow = keysToRender
      .map((entry) => {
        const layoutKey = entry.layoutKey;
        const sourceKey = entry.sourceKey || layoutKey;
        const normalizedLayoutKey = normalizeLayoutKey(layoutKey);
        const normalizedSourceKey = normalizeLayoutKey(sourceKey);
        const value =
          resolveValueForLayoutKey(sourceKey) ??
          resolveValueForLayoutKey(normalizedSourceKey) ??
          resolveValueForLayoutKey(layoutKey) ??
          resolveValueForLayoutKey(normalizedLayoutKey);

        const safeLabel = toRenderableLabel(value);
        if (safeLabel) return { key: layoutKey, sourceKey, label: safeLabel };

        if (entry.isFixed) {
          const sampleText =
            selectedFrame?.layout?.[layoutKey]?.sampleText ??
            selectedFrame?.layout?.[normalizedLayoutKey]?.sampleText;
          return { key: layoutKey, sourceKey, label: sampleText };
        }
        return null;
      })
      .filter((f) => f && f.label);

    // Always add address as a fixed field if it exists in layout AND user has address data
    const addressLayoutKey = layoutKeys.find(k => normalizeLayoutKey(k) === "address");
    if (addressLayoutKey) {
      const addressValue = toRenderableLabel(resolveValueForLayoutKey("address"));
      if (addressValue && !fieldsToShow.some(f => normalizeLayoutKey(f.key) === "address")) {
        fieldsToShow.push({ key: addressLayoutKey, sourceKey: addressLayoutKey, label: addressValue });
      }
    }
  }
  // ✅ IMPORTANT: USER SELECTION PRIORITY
  // If user selected specific fields, don't apply auto-filters - show exactly what they selected
  if (!selectedDisplayFields?.length) {

    // Business filter
    if (profileType === "business") {
      fieldsToShow = fieldsToShow.filter((f) => {
        const k = String(f.key || "").toLowerCase();
        return k !== "designation" && k !== "facebook" && k !== "social_facebook";
      });
    }

    // Personal filter
    if (profileType === "personal") {
      fieldsToShow = fieldsToShow.filter((f) => {
        const k = String(f.key || "").toLowerCase();
        return k !== "facebook" && k !== "social_facebook" &&
          k !== "twitter" && k !== "social_twitter" &&
          k !== "contact" && k !== "mobile";
      });
    }

    // Professional filter
    if (profileType === "professional") {
      fieldsToShow = fieldsToShow.filter((f) => {
        const k = String(f.key || "").toLowerCase();
        return k !== "facebook" && k !== "social_facebook" &&
          k !== "categories";
      });
    }

    // Social filter
    if (profileType === "social") {
      fieldsToShow = fieldsToShow.filter((f) => {
        const k = String(f.key || "").toLowerCase();
        return k !== "facebook" && k !== "social_facebook";
      });
    }
  }


  const seenLabels = new Set();

  fieldsToShow = fieldsToShow.filter((f) => {
    const label = `${f.key}-${String(f.label ?? "").trim().toLowerCase()}`;

    if (!f.label) return false;

    if (seenLabels.has(label)) return false;

    seenLabels.add(label);
    return true;
  });

  // Political profiles: show only these 4 fields on user side.
  // Image is rendered separately via uploaded photo block; here we keep 4 text fields (excluding address).
  if (profileType === "political") {
    const toCanonicalFieldKey = (rawKey) => {
      const key = String(rawKey || "").toLowerCase();
      if (key === "name") return "name";
      if (key === "position" || key === "positionname") return "position";
      if (key === "instagram" || key === "social_instagram") return "instagram";
      if (key === "twitter" || key === "social_twitter") return "twitter";
      return "";
    };
    const allowed = new Set(["name", "position", "instagram", "twitter"]);
    fieldsToShow = fieldsToShow.filter((f) => allowed.has(toCanonicalFieldKey(f.key)));
  }

  return (
    <div className={styles.pageContainer}>
      <SubscriptionExpiredModal
        open={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        onUpgrade={() => navigate("/pricing")}
        message="Your free trial or premium plan has ended. Please upgrade your plan to download images."
      />
      <div className={styles.headerBar}>
        <button
          className={styles.backBtn}
          onClick={() => {
            if (category) sessionStorage.removeItem(`imageViewSelected:${category}`);
            navigate(-1);
          }}
        >
          ← Back
        </button>
        <h1 className={styles.pageTitle}>{category} Gallery</h1>
        {resumeHint && <span className={styles.resumeBadge}>Resuming last image</span>}
      </div>

      <div className={styles.mainGrid}>
        {/* LEFT: Preview Section */}
        <div className={styles.previewSection}>
          <h2 className={styles.sectionTitleDesktop}>Preview & Customize</h2>

          {baseImage ? (
            <div className={styles.previewContainer}>
              <div className={styles.previewWrapperOuter}>
                <div ref={previewRef} className={styles.previewWrapper}>
                  <img
                    src={baseImage}
                    alt="Base"
                    className={styles.basePreviewImage}
                    crossOrigin="anonymous"
                    data-preview-role="base-image"
                  />

                  {/* Frame overlay */}
                  {selectedFrame && (
                    <img
                      src={selectedFrame.framePath || selectedFrame}
                      alt="Frame"
                      className={styles.frameOverlay}
                      crossOrigin="anonymous"
                      data-preview-role="frame-image"
                    />
                  )}

                  {/* Profile image (position comes from frame layout.photo.* when available) */}
                  {uploadedImage && profile?.showProfileImage && (() => {
                    // Render the profile image as an absolutely positioned element
                    // using the frame's layout.photo values so it matches ManageFrames preview.
                    // use current interactive position (imagePos) so dragging updates are visible
                    const left = imagePos.left;
                    const top = imagePos.top;
                    const photoLayout = resolveLayoutObject(selectedFrame?.layout, "photo");
                    const wRaw = photoLayout?.width ?? photoLayout?.w ?? 80;
                    const hRaw = photoLayout?.height ?? photoLayout?.h ?? 80;
                    const previewW = previewRef.current?.offsetWidth || ADMIN_PREVIEW_WIDTH;
                    const previewH = previewRef.current?.offsetHeight || ADMIN_PREVIEW_HEIGHT;
                    const scaleX = previewW / ADMIN_PREVIEW_WIDTH;
                    const scaleY = previewH / ADMIN_PREVIEW_HEIGHT;
                    const wNum = parseNumber(wRaw, 80);
                    const hNum = parseNumber(hRaw, 80);
                    const width = Number.isFinite(wNum) ? `${Math.max(16, Math.round(wNum * scaleX))}px` : String(wRaw);
                    const height = Number.isFinite(hNum) ? `${Math.max(16, Math.round(hNum * scaleY))}px` : String(hRaw);

                    return (
                      <img
                        ref={imageRef}
                        src={uploadedImage}
                        crossOrigin="anonymous"
                        alt="User"
                        className={styles.uploadedDraggable}
                        data-preview-role="uploaded-profile-image"
                        onMouseDown={handleImageDragStart}
                        onTouchStart={handleImageDragStart}
                        style={{
                          left: Number.isFinite(left) ? left : 0,
                          top: Number.isFinite(top) ? top : 0,
                          width,
                          height,
                          objectFit: 'cover',
                          border: selectedFrame?.layout?.photo?.border || 'none',
                          position: 'absolute',
                          zIndex: 9999,
                          pointerEvents: 'auto',
                          cursor: 'move',
                          userSelect: 'none',
                          touchAction: 'none'
                        }}
                      />
                    );
                  })()}


                  {/* Text fields driven by admin layout when available */}
                  {fieldsToShow.map((item, index) => {
                    if (!item.label) return null;
                    const layoutObj = resolveLayoutObject(selectedFrame?.layout, item.key);
                    const normalizedRenderKey = String(normalizeLayoutKey(item.key) || "").toLowerCase();
                    const isPrimaryNameField =
                      normalizedRenderKey === "name" ||
                      normalizedRenderKey === "businessname" ||
                      normalizedRenderKey === "organization" ||
                      normalizedRenderKey === "partyname" ||
                      normalizedRenderKey === "brandname" ||
                      String(item.key || "").toLowerCase().startsWith("personalprimary");
                    const isSocialField = [
                      "instagram",
                      "facebook",
                      "linkedin",
                      "twitter",
                      "snapchat",
                      "youtube",
                      "telegram",
                      "discord",
                      "social",
                    ].includes(normalizedRenderKey);

                    const leftRaw = layoutObj.left ?? layoutObj.x ?? layoutObj.leftValue;
                    const topRaw = layoutObj.top ?? layoutObj.y ?? layoutObj.topValue;

                    const previewEl = previewRef.current;
                    const previewW = previewEl?.offsetWidth || ADMIN_PREVIEW_WIDTH;
                    const previewH = previewEl?.offsetHeight || ADMIN_PREVIEW_HEIGHT;
                    const scaleX = previewW / ADMIN_PREVIEW_WIDTH;
                    const scaleY = previewH / ADMIN_PREVIEW_HEIGHT;

                    let left = parsePercent(leftRaw, previewW) ?? (Number.isFinite(parseNumber(leftRaw)) ? parseNumber(leftRaw) * scaleX : undefined);
                    let top = parsePercent(topRaw, previewH) ?? (Number.isFinite(parseNumber(topRaw)) ? parseNumber(topRaw) * scaleY : undefined);

                    if (typeof left !== "number" || typeof top !== "number") {
                      let defaultPos = { x: 50 + index * 10, y: 50 + index * 30 };

                      if (item.key?.startsWith("social_")) {
                        const previewEl = previewRef.current;
                        if (previewEl) {
                          const imgEl = previewEl.querySelector(".basePreviewImage");
                          const previewRect = previewEl.getBoundingClientRect();
                          if (imgEl) {
                            const imgRect = imgEl.getBoundingClientRect();
                            const paddingRight = 20;
                            const x = Math.max((imgRect.right - previewRect.left) - paddingRight - 120, 120);
                            const socialOrder = fieldsToShow.slice(0, index).filter((f) => f.key?.startsWith("social_")).length;
                            const paddingTop = 12;
                            const y = Math.max(imgRect.top - previewRect.top + paddingTop + socialOrder * 28, 12);
                            defaultPos = { x: Math.round(x), y: Math.round(y) };
                          } else {
                            const previewWidth = previewEl.offsetWidth || 600;
                            defaultPos = { x: Math.max(previewWidth - 220, 160), y: 40 + index * 28 };
                          }
                        }
                      }

                      left = typeof left === "number" ? left : defaultPos.x;
                      top = typeof top === "number" ? top : defaultPos.y;
                    }

                    const initialLeft = Number.isFinite(left) ? Math.max(0, Math.round(left)) : 0;
                    const initialTop = Number.isFinite(top) ? Math.max(0, Math.round(top)) : 0;
                    const overridePos = textPositions[item.key];
                    const dragLeft = Number.isFinite(overridePos?.left) ? overridePos.left : initialLeft;
                    const dragTop = Number.isFinite(overridePos?.top) ? overridePos.top : initialTop;
                    const fontColour = selectedFrame
                      ? (layoutObj?.fontColour || defaultLayout[item.key]?.fontColour || '#000')
                      : '#fff';
                    const fsRaw = layoutObj?.fontSize || defaultLayout[item.key]?.fontSize;
                    const fsNum = parseNumber(fsRaw);
                    const fontWeight = layoutObj?.fontWeight || defaultLayout[item.key]?.fontWeight || 'normal';
                    const widthNum = parseNumber(layoutObj?.width);
                    const explicitWidthPx = Number.isFinite(widthNum) ? Math.max(12, Math.round(widthNum * scaleX)) : undefined;
                    const widthPx = Number.isFinite(explicitWidthPx)
                      ? explicitWidthPx
                      : Math.max(24, Math.round(previewW - Math.max(0, Math.round(dragLeft)) - 2));

                    const heightNum = parseNumber(layoutObj?.height);
                    const explicitHeightPx = Number.isFinite(heightNum) ? Math.max(10, Math.round(heightNum * scaleY)) : undefined;
                    const fontFamily =
                      layoutObj?.fontFamily ||
                      layoutObj?.fontStyle ||
                      defaultLayout[item.key]?.fontStyle ||
                      'Poppins, sans-serif';
                    const textAlign = layoutObj?.textAlign || "left";
                    const effectiveTextAlign = textAlign === "justify" ? "left" : textAlign;
                    const showBorder = Boolean(layoutObj?.showBorder);
                    const borderPaddingRaw = parseNumber(layoutObj?.borderPadding, 4);
                    const borderPadding = Number.isFinite(borderPaddingRaw) ? Math.max(0, Math.round(borderPaddingRaw * Math.min(scaleX, scaleY))) : 0;
                    const contentPadding = 0;
                    const borderColor = layoutObj?.borderColour || fontColour || "#7c3aed";
                    const rawBorderWidth = parseNumber(layoutObj?.borderWidth, 0.6);
                    const borderWidthPx = Number.isFinite(rawBorderWidth)
                      ? Math.max(1, Math.round(rawBorderWidth * Math.min(scaleX, scaleY)))
                      : 1;
                    const borderStyle = "none";
                    const outerPad = 0;
                    const hasExplicitBox = Number.isFinite(explicitWidthPx) || Number.isFinite(explicitHeightPx);
                    const boxWidthPx = Number.isFinite(explicitWidthPx)
                      ? explicitWidthPx + outerPad * 2
                      : widthPx;
                    const boxHeightPx = Number.isFinite(explicitHeightPx)
                      ? explicitHeightPx + outerPad * 2
                      : undefined;
                    const widthStyle = `${Math.max(12, Math.round(boxWidthPx))}px`;
                    const fixedHeightStyle = Number.isFinite(boxHeightPx)
                      ? `${Math.max(10, Math.round(boxHeightPx))}px`
                      : undefined;
                    const clampedTextLeft = clampNumber(
                      Math.round(dragLeft),
                      outerPad,
                      Math.max(outerPad, previewW - Math.max(1, Math.round(boxWidthPx)) + outerPad)
                    );
                    const iconKey = item.sourceKey || item.key;
                    const iconSrc = getIconSrc(iconKey);
                    const hasIcon = Boolean(iconSrc);
                    const baseFontPx = Number.isFinite(fsNum)
                      ? Math.max(9, Math.round(fsNum * Math.min(scaleX, scaleY)))
                      : parseNumber(fsRaw, 14) || 14;
                    const iconSpace = hasIcon ? Math.round(baseFontPx * 0.9) + 4 : 0;
                    const minimumReadableFontPx = 7;
                    // If admin set explicit box size, fit font to fill that box
                    const fitMaxWidth = Number.isFinite(explicitWidthPx)
                      ? Math.max(6, explicitWidthPx - iconSpace)
                      : Math.max(6, widthPx - contentPadding * 2);
                    const fitMaxHeight = Number.isFinite(explicitHeightPx)
                      ? (isPrimaryNameField ? undefined : Math.max(10, explicitHeightPx))
                      : undefined;
                    const finalFontPx = fitSingleLineFontSize({
                      text: item.label,
                      fontFamily,
                      fontWeight,
                      baseFontSize: baseFontPx,
                      minFontSize: minimumReadableFontPx,
                      maxWidth: fitMaxWidth,
                      maxHeight: fitMaxHeight,
                      extraWidth: 0,
                    });
                    let fittedFontPx = finalFontPx;
                    const measureCtx = getMeasureCtx();
                    if (measureCtx && Number.isFinite(fitMaxWidth) && fitMaxWidth > 2) {
                      const content = String(item.label || "").trim();
                      while (fittedFontPx > 4) {
                        measureCtx.font = `${fontWeight} ${fittedFontPx}px ${fontFamily}`;
                        const measured = measureCtx.measureText(content).width;
                        if (measured <= fitMaxWidth) break;
                        fittedFontPx = Math.max(4, Math.round((fittedFontPx - 0.5) * 10) / 10);
                      }
                    }
                    const lineHeightValue = 1.15;
                    if (Number.isFinite(explicitHeightPx)) {
                      const maxContentHeight = Math.max(6, explicitHeightPx - contentPadding * 2);
                      while ((fittedFontPx * lineHeightValue) > maxContentHeight && fittedFontPx > 4) {
                        fittedFontPx = Math.max(4, Math.round((fittedFontPx - 0.5) * 10) / 10);
                      }
                    }
                    fittedFontPx = Math.max(6, Math.floor(fittedFontPx));
                    const fontSize = `${fittedFontPx}px`;
                    const maxIconFromHeight = Number.isFinite(explicitHeightPx)
                      ? Math.max(6, Math.floor((explicitHeightPx - contentPadding * 2) * 0.8))
                      : 24;
                    const renderedIconPx = hasIcon
                      ? clampNumber(Math.round(fittedFontPx * 0.9), 6, 24)
                      : 0;
                    const justifyContent =
                      effectiveTextAlign === "center"
                        ? "center"
                        : effectiveTextAlign === "right"
                          ? "flex-end"
                          : "flex-start";
                    const minReadableHeightPx = Math.max(16, Math.ceil(fittedFontPx * lineHeightValue + contentPadding * 2));
                    const runtimeHeightForClamp = Number.isFinite(boxHeightPx)
                      ? boxHeightPx
                      : minReadableHeightPx;
                    const clampedTextTop = clampNumber(
                      Math.round(dragTop),
                      outerPad,
                      Math.max(outerPad, previewH - runtimeHeightForClamp + outerPad)
                    );

                    return (
                      <div
                        key={`${item.key}-${selectedFrame?._id || 'noframe'}`}
                        ref={(el) => (textRefs.current[item.key] = el)}
                        data-label={item.label}
                        data-icon-key={item.sourceKey || item.key}
                        className={styles.draggableText}
                        onMouseDown={(e) => handleTextDragStart(e, item.key, dragLeft, dragTop)}
                        onTouchStart={(e) => handleTextDragStart(e, item.key, dragLeft, dragTop)}
                        style={{
                          position: 'absolute',
                          zIndex: 50,
                          left: Math.max(0, clampedTextLeft - outerPad),
                          top: Math.max(0, clampedTextTop - outerPad),
                          color: fontColour,
                          fontSize: fontSize,
                          fontWeight: fontWeight,
                          fontFamily,
                          textAlign: effectiveTextAlign,
                          textShadow: 'none',
                          width: widthStyle,
                          maxWidth: widthStyle,
                          height: 'auto',
                          border: 'none',
                          padding: 0,
                          boxSizing: 'content-box',

                          display: 'block',
                          whiteSpace: 'nowrap',
                          overflow: 'visible',
                          lineHeight: 1,

                          pointerEvents: 'auto',
                          touchAction: 'none'
                        }}
                      >
                        {hasIcon && iconSrc && (
                          <img
                            src={iconSrc}
                            crossOrigin="anonymous"
                            alt=""
                            style={{
                              width: renderedIconPx,
                              height: renderedIconPx,
                              objectFit: 'contain',
                              display: 'inline-block',
                              verticalAlign: 'middle',
                              flexShrink: 0,
                              marginRight: 3,
                            }}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src.includes('email.png')) {
                                // Fallback to mail.png if email.png is missing
                                target.src = `${normalizeBase(iconBase)}icons/mail.png`;
                              } else if (target.src.includes('contact.png')) {
                                target.src = `${normalizeBase(iconBase)}icons/call.png`;
                              } else {
                                target.style.display = 'none';
                              }
                            }}
                          />
                        )}

                        <span
                          style={{
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            whiteSpace: 'nowrap',
                            overflow: 'visible',
                            lineHeight: 1,
                          }}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}

                </div>
              </div>{/* end previewWrapperOuter */}

              {/* Mobile floating download icon — sits below the preview */}
              <button
                className={styles.mobileDownloadIcon}
                onClick={() => ensureSubscriptionAccess(() => setShowFormatOptions(!showFormatOptions))}
                aria-label="Download"
              >
                <Download size={19} />
              </button>
              {showFormatOptions && (
                <div className={styles.formatOptionsMobile}>
                  <button onClick={() => handleDownload('png')} className={styles.formatBtn}>PNG</button>
                  <button onClick={() => handleDownload('jpg')} className={styles.formatBtn}>JPG</button>
                  <button onClick={() => handleDownload('pdf')} className={styles.formatBtn}>PDF</button>
                </div>
              )}

              <div ref={downloadContainerRef} className={`${styles.downloadContainer} ${styles.downloadContainerDesktop}`}>
                <button
                  onClick={() => ensureSubscriptionAccess(() => setShowFormatOptions(!showFormatOptions))}
                  className={styles.downloadBtn}
                >
                  Download Image
                </button>
                {showFormatOptions && (
                  <div className={styles.formatOptions}>
                    <button onClick={() => handleDownload('png')} className={styles.formatBtn}>
                      PNG
                    </button>
                    <button onClick={() => handleDownload('jpg')} className={styles.formatBtn}>
                      JPG
                    </button>
                    <button onClick={() => handleDownload('pdf')} className={styles.formatBtn}>
                      PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className={styles.emptyText}>No base image available.</p>
          )}
        </div>

        {/* RIGHT: Controls Section */}
        <div className={styles.controlsSection}>
          <AiFooterBox profile={profile} onSelect={setSelectedFrame} />

          <div className={styles.framesPanel}>
            <h2 className={styles.sectionTitle}>Select Frame</h2>
            <div className={styles.gridContainer}>
              {frames.length > 0 ? (
                frames.map((frame, index) => {
                  const isRelevant = isFrameRelevantToFields(frame, selectedDisplayFields);
                  return (
                    <div
                      key={index}
                      className={`${styles.frameItem} ${selectedFrame?._id === frame._id ? styles.selectedFrame : ""} ${isRelevant && selectedDisplayFields.length > 0 ? "ring-2 ring-violet-500 ring-offset-1" : ""
                        }`}
                      title={isRelevant && selectedDisplayFields.length > 0 ? "Matches your selected fields!" : ""}
                      onClick={async () => {
                        try {
                          const res = await axios.get(`${BASE_URL}/api/frames/${frame._id}`);
                          if (res?.data) setSelectedFrame(res.data);
                          else setSelectedFrame(frame);
                        } catch (err) {
                          console.error('Failed to fetch frame by id:', err);
                          setSelectedFrame(frame);
                        }
                      }}
                    >
                      <img src={frame.framePath} alt={`Frame ${index + 1}`} />
                    </div>
                  );
                })
              ) : (
                <p className={styles.noImagesMessage}>No frames available</p>
              )}
            </div>
          </div>

          <div className={styles.imagesPanel}>
            <h2 className={styles.sectionTitle}>Select Images</h2>
            <div className={styles.gridContainer}>
              {images.length > 0 ? (
                images.flatMap((img, itemIndex) => {
                  // Handle multiple images in single item (festival categories)
                  if (Array.isArray(img.images) && img.images.length > 0) {
                    return img.images.map((nestedImg, nestedIndex) => {
                      const imageUrl = typeof nestedImg === "string" ? nestedImg : nestedImg.url;
                      const uniqueKey = `${itemIndex}-${nestedIndex}`;
                      return (
                        <div
                          key={uniqueKey}
                          className={`${styles.imageItem} ${baseImage === imageUrl ? styles.activeImage : ""}`}
                          onClick={() => setBaseImage(imageUrl)}
                        >
                          <img
                            src={imageUrl}
                            alt={`Image ${uniqueKey}`}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/200x200?text=Error";
                            }}
                          />
                        </div>
                      );
                    });
                  }
                  // Handle single image URL
                  else if (img.url) {
                    return (
                      <div
                        key={itemIndex}
                        className={`${styles.imageItem} ${baseImage === img.url ? styles.activeImage : ""}`}
                        onClick={() => setBaseImage(img.url)}
                      >
                        <img
                          src={img.url}
                          alt={`Image ${itemIndex}`}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/200x200?text=Error";
                          }}
                        />
                      </div>
                    );
                  }
                  return null;
                })
              ) : (
                <p className={styles.noImagesMessage}>No images available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageView;
