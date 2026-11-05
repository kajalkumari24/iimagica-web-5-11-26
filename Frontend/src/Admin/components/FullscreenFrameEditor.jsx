import React, { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import { BASE_URL } from "../../url";
import styles from "./FullscreenFrameEditor.module.css";
import socket from "../../socket";

const CANVAS_W = 330;
const CANVAS_H = 415;
const SOCIAL_KEYS = ["instagram", "facebook", "linkedin", "twitter"];
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 48,50,52,54,56,58,60,62,64];
const DEFAULT_TEXT_FONT_SIZE = 14;
const MIN_TEXT_FONT_SIZE = 8;
const MAX_TEXT_FONT_SIZE = 220;
const TEXT_ALIGN_ORDER = ["left", "center", "right", "justify"];
const FIELD_INSTANCE_SEPARATOR = "__";
const FONT_FAMILIES = [
  "Arial",
  "Poppins",
  "Alice",
  "Shrikhand",
  "Kalam",
  "Yeseva One",
  "Noto Serif",
  "Noto Sans",
  "Verdana",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Impact",
  "Tahoma",
  "Trebuchet MS",
  "Arya",
  "Amita",
  "Noto Sans Devanagari",
  "Noto Serif Devanagari",
  "Hind",
  "Mukta",
  "Karma",
  "Tiro Devanagari Hindi",
  "Amoresa",
  "A Ams Aakash",
  "A Ams Asmi",
  "A Ams Manaja",
  "A Ams Calligraphy",
  "A Ams Aditya",
];

const THEME_PRESETS = [
  {
    id: "slate",
    label: "Slate",
    vars: {
      "--bg": "#f8fafc",
      "--surface": "#ffffff",
      "--surface-soft": "#f1f5f9",
      "--line": "#dbe1ea",
      "--text": "#0f172a",
      "--text-muted": "#475569",
      "--accent": "#2563eb",
      "--accent-soft": "#dbeafe",
      "--accent-strong": "#1d4ed8",
      "--success": "#16a34a",
      "--success-strong": "#15803d",
      "--canvas-bg": "#f3f6fb",
      "--canvas-dot": "rgba(71, 85, 105, 0.14)",
      "--canvas-card": "#ffffff",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    vars: {
      "--bg": "#ecfeff",
      "--surface": "#ffffff",
      "--surface-soft": "#e6fffb",
      "--line": "#b6e8ef",
      "--text": "#083344",
      "--text-muted": "#155e75",
      "--accent": "#0891b2",
      "--accent-soft": "#cffafe",
      "--accent-strong": "#0e7490",
      "--success": "#0d9488",
      "--success-strong": "#0f766e",
      "--canvas-bg": "#e6f6fb",
      "--canvas-dot": "rgba(8, 145, 178, 0.16)",
      "--canvas-card": "#f8feff",
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    vars: {
      "--bg": "#fff7ed",
      "--surface": "#ffffff",
      "--surface-soft": "#ffedd5",
      "--line": "#fed7aa",
      "--text": "#7c2d12",
      "--text-muted": "#9a3412",
      "--accent": "#ea580c",
      "--accent-soft": "#ffedd5",
      "--accent-strong": "#c2410c",
      "--success": "#65a30d",
      "--success-strong": "#4d7c0f",
      "--canvas-bg": "#fff2e8",
      "--canvas-dot": "rgba(194, 65, 12, 0.16)",
      "--canvas-card": "#fffaf5",
    },
  },
  {
    id: "forest",
    label: "Forest",
    vars: {
      "--bg": "#f0fdf4",
      "--surface": "#ffffff",
      "--surface-soft": "#dcfce7",
      "--line": "#bbf7d0",
      "--text": "#14532d",
      "--text-muted": "#166534",
      "--accent": "#16a34a",
      "--accent-soft": "#dcfce7",
      "--accent-strong": "#15803d",
      "--success": "#0d9488",
      "--success-strong": "#0f766e",
      "--canvas-bg": "#eaf8ee",
      "--canvas-dot": "rgba(22, 163, 74, 0.16)",
      "--canvas-card": "#f8fff9",
    },
  },
  {
    id: "charcoal",
    label: "Charcoal",
    vars: {
      "--bg": "#111827",
      "--surface": "#1f2937",
      "--surface-soft": "#374151",
      "--line": "#4b5563",
      "--text": "#f9fafb",
      "--text-muted": "#cbd5e1",
      "--accent": "#38bdf8",
      "--accent-soft": "#334155",
      "--accent-strong": "#0ea5e9",
      "--success": "#22c55e",
      "--success-strong": "#16a34a",
      "--canvas-bg": "#0f172a",
      "--canvas-dot": "rgba(148, 163, 184, 0.25)",
      "--canvas-card": "#e5e7eb",
    },
  },
  {
    id: "rose",
    label: "Rose",
    vars: {
      "--bg": "#fff1f2",
      "--surface": "#ffffff",
      "--surface-soft": "#ffe4e6",
      "--line": "#fecdd3",
      "--text": "#881337",
      "--text-muted": "#9f1239",
      "--accent": "#e11d48",
      "--accent-soft": "#ffe4e6",
      "--accent-strong": "#be123c",
      "--success": "#16a34a",
      "--success-strong": "#15803d",
      "--canvas-bg": "#fff1f2",
      "--canvas-dot": "rgba(225, 29, 72, 0.16)",
      "--canvas-card": "#ffe4e6",
    },
  },
  {
    id: "lavender",
    label: "Lavender",
    vars: {
      "--bg": "#f5f3ff",
      "--surface": "#ffffff",
      "--surface-soft": "#ede9fe",
      "--line": "#ddd6fe",
      "--text": "#4c1d95",
      "--text-muted": "#5b21b6",
      "--accent": "#7c3aed",
      "--accent-soft": "#ede9fe",
      "--accent-strong": "#6d28d9",
      "--success": "#16a34a",
      "--success-strong": "#15803d",
      "--canvas-bg": "#f5f3ff",
      "--canvas-dot": "rgba(124, 58, 237, 0.16)",
      "--canvas-card": "#ede9fe",
    },
  },
  {
    id: "mango",
    label: "Mango",
    vars: {
      "--bg": "#fff7ed",
      "--surface": "#ffffff",
      "--surface-soft": "#ffedd5",
      "--line": "#fdba74",
      "--text": "#7c2d12",
      "--text-muted": "#9a3412",
      "--accent": "#f97316",
      "--accent-soft": "#ffedd5",
      "--accent-strong": "#ea580c",
      "--success": "#65a30d",
      "--success-strong": "#4d7c0f",
      "--canvas-bg": "#fff7ed",
      "--canvas-dot": "rgba(249, 115, 22, 0.16)",
      "--canvas-card": "#fed7aa",
    },
  },
  {
    id: "mint",
    label: "Mint",
    vars: {
      "--bg": "#ecfdf5",
      "--surface": "#ffffff",
      "--surface-soft": "#d1fae5",
      "--line": "#a7f3d0",
      "--text": "#064e3b",
      "--text-muted": "#065f46",
      "--accent": "#10b981",
      "--accent-soft": "#d1fae5",
      "--accent-strong": "#059669",
      "--success": "#0d9488",
      "--success-strong": "#0f766e",
      "--canvas-bg": "#ecfdf5",
      "--canvas-dot": "rgba(16, 185, 129, 0.16)",
      "--canvas-card": "#d1fae5",
    },
  },
  {
    id: "sky",
    label: "Sky",
    vars: {
      "--bg": "#f0f9ff",
      "--surface": "#ffffff",
      "--surface-soft": "#e0f2fe",
      "--line": "#bae6fd",
      "--text": "#0c4a6e",
      "--text-muted": "#075985",
      "--accent": "#0ea5e9",
      "--accent-soft": "#e0f2fe",
      "--accent-strong": "#0284c7",
      "--success": "#16a34a",
      "--success-strong": "#15803d",
      "--canvas-bg": "#f0f9ff",
      "--canvas-dot": "rgba(14, 165, 233, 0.16)",
      "--canvas-card": "#e0f2fe",
    },
  },
  {
    id: "sand",
    label: "Sand",
    vars: {
      "--bg": "#fefce8",
      "--surface": "#ffffff",
      "--surface-soft": "#fef9c3",
      "--line": "#fde68a",
      "--text": "#713f12",
      "--text-muted": "#854d0e",
      "--accent": "#ca8a04",
      "--accent-soft": "#fef9c3",
      "--accent-strong": "#a16207",
      "--success": "#65a30d",
      "--success-strong": "#4d7c0f",
      "--canvas-bg": "#fefce8",
      "--canvas-dot": "rgba(202, 138, 4, 0.16)",
      "--canvas-card": "#fde68a",
    },
  },
];

const FONT_STYLE_PRESETS = {
  Shrikhand: {
    fontWeight: "400",
    letterSpacing: 20,
    textShadow: "2px 2px 0 rgba(216,199,242,0.95)",
    angle: 0,
  },

  Poppins: {
    fontWeight: "700",
    letterSpacing: 10,
    angle: 0,
  },

  Alice: {
    fontWeight: "400",
    letterSpacing: 20,
    textShadow: "1px 1px 0 rgba(235,220,207,0.95)",
    angle: 0,
  },

  Amita: {
    fontWeight: "700",
    letterSpacing: 25,
    angle: -2,
    textShadow: "2px 2px 3px rgba(0,0,0,0.25)",
  },

  Kalam: {
    fontWeight: "700",
    letterSpacing: 18,
    textShadow: "1px 2px 0 rgba(202,236,248,0.95)",
    angle: -1,
  },

  Hind: {
    fontWeight: "600",
    letterSpacing: 8,
    angle: 0,
  },

  "Noto Sans Devanagari": {
    fontWeight: "600",
    letterSpacing: 6,
    angle: 0,
  },

  "Noto Serif Devanagari": {
    fontWeight: "600",
    letterSpacing: 5,
    angle: 0,
  },

  "Tiro Devanagari Hindi": {
    fontWeight: "400",
    letterSpacing: 4,
    angle: 0,
  },

  // 🔥 IMPORTANT (Aakash Upgrade)
  "A Ams Aakash": {
    fontWeight: "400",
    letterSpacing: 12,
    angle: -2,
    textShadow: "2px 2px 2px rgba(0,0,0,0.25)",
  },

  "A Ams Asmi": {
    fontWeight: "400",
    letterSpacing: 10,
    angle: -1,
  },

  "A Ams Manaja": {
    fontWeight: "400",
    letterSpacing: 10,
    angle: -1,
  },

  "A Ams Calligraphy": {
    fontWeight: "400",
    letterSpacing: 14,
    angle: -2,
    textShadow: "1px 2px 2px rgba(0,0,0,0.2)",
  },

  "A Ams Aditya": {
    fontWeight: "400",
    letterSpacing: 12,
    angle: -1,
  },
};
const CONTROL_STYLE = {
  borderColor: "#7c3aed",
  cornerColor: "#ffffff",
  cornerStrokeColor: "#7c3aed",
  cornerStyle: "circle",
  borderScaleFactor: 2,
  transparentCorners: false,
  cornerSize: 10,
  padding: 2,
};

/* ── helpers ── */
const loadCanvasFont = async (fontFamily) => {
  if (typeof document === "undefined" || !document.fonts || !fontFamily) return;
  const family = String(fontFamily).trim();
  if (!family) return;
  const escaped = family.replace(/"/g, '\\"');
  try {
    await Promise.all([
      document.fonts.load(`400 24px "${escaped}"`),
      document.fonts.load(`700 24px "${escaped}"`),
    ]);
  } catch (_) {
    // Ignore load errors; Fabric will fallback to available fonts.
  }
};

const resolveCanvasFontFamily = (fontFamily) => {
  const family = String(fontFamily || "").trim();
  if (!family) return "Arial";

  if (family === "A Ams Aakash") {
    return `"A Ams Aakash","A Ams Akash","Tiro Devanagari Hindi","Noto Serif Devanagari",serif`;
  }
  if (family === "A Ams Asmi") {
    return `"A Ams Asmi","Noto Serif Devanagari","Tiro Devanagari Hindi",serif`;
  }
  if (family === "A Ams Manaja") {
    return `"A Ams Manaja","Noto Serif Devanagari","Tiro Devanagari Hindi",serif`;
  }
  if (family === "A Ams Calligraphy") {
    return `"A Ams Calligraphy","Noto Serif Devanagari","Tiro Devanagari Hindi",serif`;
  }
  if (family === "A Ams Aditya") {
    return `"A Ams Aditya","Noto Serif Devanagari","Tiro Devanagari Hindi",serif`;
  }

  return family;
};

const normalizeTextFontSize = (value, fallback = DEFAULT_TEXT_FONT_SIZE) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.round(clampNumber(n, MIN_TEXT_FONT_SIZE, MAX_TEXT_FONT_SIZE));
};

const fabricObjToLayout = (obj) => ({
  left: Math.round(obj.left),
  top: Math.round(obj.top),
  width: Math.round(
    obj.data?.type === "text" && Number.isFinite(Number(obj.data?.boxWidth))
      ? Number(obj.data.boxWidth)
      : obj.getScaledWidth()
  ),
  height: Math.round(
    obj.data?.type === "text" && Number.isFinite(Number(obj.data?.boxHeight))
      ? Number(obj.data.boxHeight)
      : obj.getScaledHeight()
  ),
  // Keep text size stable; we normalize scale back to 1 on resize.
  fontSize: obj.fontSize ? normalizeTextFontSize(obj.fontSize) : undefined,
  fontColour: obj.fill || "#000000",
  fontWeight: obj.fontWeight || "normal",
  fontFamily: obj.data?.selectedFontFamily || obj.fontFamily || "",
  letterSpacing: Number.isFinite(Number(obj.charSpacing)) ? Number(obj.charSpacing) / 10 : 0,
  textShadow: obj.data?.textShadow || "",
  textAlign: obj.data?.textAlign || obj.textAlign || "left",
  angle: obj.angle ? Math.round(obj.angle) : 0,
  showBorder: true,
  borderPadding: obj.data?.borderPadding ?? 4,
  borderColour: obj.data?.borderColour ?? "#7c3aed",
  borderWidth: obj.data?.borderWidth ?? 0.6,
  selectBorderColour: obj.data?.selectBorderColour ?? "#7c3aed",
  selectBorderWidth: obj.data?.selectBorderWidth ?? 0.8,
});

const makeTextObj = (field, layoutEntry = {}, instanceFieldKey = field.key) => {
  const sourceFieldKey = String(instanceFieldKey || "").split(FIELD_INSTANCE_SEPARATOR)[0];
  const isSocial = SOCIAL_KEYS.includes(sourceFieldKey);
  const label = layoutEntry.sampleText || field.label;
  const selectedFontFamily = layoutEntry.fontFamily || "Arial";
  const fontFamily = resolveCanvasFontFamily(selectedFontFamily);
  const preset = FONT_STYLE_PRESETS[selectedFontFamily] || {};
  const parsedWidth = Number(layoutEntry.width);
  const parsedHeight = Number(layoutEntry.height);
  const selectBorderColour = layoutEntry.selectBorderColour || "#7c3aed";
  const selectBorderWidth = Number(layoutEntry.selectBorderWidth) || 0.8;
  const borderPadding = Number(layoutEntry.borderPadding ?? 4) || 0;
  const parsedAngle = Number(layoutEntry.angle);
  const hasLayoutAngle = Number.isFinite(parsedAngle);
  const rawSpacing = Number.isFinite(Number(layoutEntry.letterSpacing))
    ? Number(layoutEntry.letterSpacing)
    : Number.isFinite(Number(preset.letterSpacing))
      ? Number(preset.letterSpacing)
      : 0;

  // 🔥 convert px → fabric unit
  const normalizedFontSize = normalizeTextFontSize(layoutEntry.fontSize, DEFAULT_TEXT_FONT_SIZE);
  const textContent = `${isSocial ? `[${field.label}] ` : ""}${label}`;
  const fallbackWidth = Math.max(70, Math.ceil(textContent.length * (normalizedFontSize * 0.62)) + 18);
  const resolvedWidth = Number.isFinite(parsedWidth) && parsedWidth > 0 ? parsedWidth : fallbackWidth;
  const letterSpacing = rawSpacing * 10;
  const textShadow = null;
  return new fabric.Textbox(textContent, {
    left: Number(layoutEntry.left) || 20,
    top: Number(layoutEntry.top) || 20,
    fontSize: normalizedFontSize,
    fontWeight: layoutEntry.fontWeight || preset.fontWeight || "normal",
    fontFamily,
    charSpacing: letterSpacing,
    shadow: null,
    fill: layoutEntry.fontColour || "#000000",
    textAlign: layoutEntry.textAlign || "left",
    width: resolvedWidth,
    splitByGrapheme: false,
    angle: hasLayoutAngle ? parsedAngle : (Number(preset.angle) || 0),
    hasControls: false, hasBorders: false, selectable: true, evented: true, editable: true, lockUniScaling: false,
    ...CONTROL_STYLE,
    borderColor: selectBorderColour,
    cornerStrokeColor: selectBorderColour,
    borderScaleFactor: selectBorderWidth,
    padding: borderPadding,
    data: {
      fieldKey: instanceFieldKey, sourceFieldKey, type: "text", label: field.label,
      selectedFontFamily,
      showBorder: true,
      borderPadding,
      borderColour: layoutEntry.borderColour ?? "#7c3aed",
      borderWidth: Number(layoutEntry.borderWidth) || 0.6,
      selectBorderColour,
      selectBorderWidth,
      textShadow: "",
      textAlign: layoutEntry.textAlign || "left",
      letterSpacing: rawSpacing,
      boxWidth: resolvedWidth,
      boxHeight: Number.isFinite(parsedHeight) ? parsedHeight : null,
    },
  });
};

const makePhotoRect = (layoutEntry = {}, instanceFieldKey = "photo") => {
  const w = Number(layoutEntry.width) || 80;
  const h = Number(layoutEntry.height) || 80;
  const rect = new fabric.Rect({ width: w, height: h, fill: "rgba(200,220,255,0.35)", stroke: "#3b82f6", strokeWidth: 2, strokeDashArray: [6, 4] });
  const lbl = new fabric.Text("📷 Photo", { fontSize: 12, fill: "#1e40af", fontWeight: "bold", originX: "center", originY: "center", left: w / 2, top: h / 2 });
  return new fabric.Group([rect, lbl], {
    left: Number(layoutEntry.left) || 20, top: Number(layoutEntry.top) || 20,
    angle: Number(layoutEntry.angle) || 0,
    hasControls: true, hasBorders: true, selectable: true,
    ...CONTROL_STYLE,
    data: { fieldKey: instanceFieldKey, sourceFieldKey: "photo", type: "photo" },
  });
};

const syncBorderRect = (canvas, textObj) => {
  if (!textObj || textObj.data?.type !== "text") return;
  const fieldKey = textObj.data.fieldKey;
  const existing = canvas.getObjects().find((o) => o.data?.isBorderRect && o.data?.forField === fieldKey);
  if (!textObj.data.showBorder) {
    if (existing) canvas.remove(existing);
    return;
  }
  const pad = textObj.data.borderPadding ?? 4;
  const colour = textObj.fill || textObj.data.borderColour || "#7c3aed";
  const borderWidth = Number(textObj.data.borderWidth) || 0.6;
  const selectBorderColour = textObj.data.selectBorderColour || colour;
  const selectBorderWidth = Number(textObj.data.selectBorderWidth) || 0.8;
  const boxWidth = Number(textObj.data?.boxWidth);
  const boxHeight = Number(textObj.data?.boxHeight);
  const w = Number.isFinite(boxWidth) && boxWidth > 0 ? boxWidth : textObj.getScaledWidth();
  const h = Number.isFinite(boxHeight) && boxHeight > 0 ? boxHeight : textObj.getScaledHeight();
  const borderRect = existing || new fabric.Rect({
    fill: "transparent",
    data: { isBorderRect: true, forField: fieldKey, type: "text_controller" },
  });
  borderRect.set({
    left: textObj.left - pad,
    top: textObj.top - pad,
    width: w + pad * 2,
    height: h + pad * 2,
    angle: textObj.angle || 0,
    stroke: colour,
    strokeWidth: borderWidth,
    selectable: true,
    evented: true,
    hasControls: true,
    hasBorders: true,
    lockUniScaling: false,
    borderColor: selectBorderColour,
    cornerStrokeColor: selectBorderColour,
    borderScaleFactor: selectBorderWidth,
    cornerColor: "#ffffff",
    cornerStyle: "circle",
    transparentCorners: false,
    cornerSize: 10,
    padding: 0,
  });
  borderRect.data = { ...(borderRect.data || {}), isBorderRect: true, forField: fieldKey, type: "text_controller" };
  borderRect.setCoords();
  if (!existing) canvas.add(borderRect);
  const textIndex = canvas.getObjects().indexOf(textObj);
  if (textIndex >= 0) {
    canvas.moveTo(borderRect, textIndex + 1);
  }
};

const removeBorderRect = (canvas, fieldKey) => {
  const ex = canvas.getObjects().find((o) => o.data?.isBorderRect && o.data?.forField === fieldKey);
  if (ex) canvas.remove(ex);
};

const getScaledSizeWithoutStroke = (obj) => ({
  width: (Number(obj?.width) || 0) * (Number(obj?.scaleX) || 1),
  height: (Number(obj?.height) || 0) * (Number(obj?.scaleY) || 1),
});

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);
const getBaseFieldKey = (fieldKey) => String(fieldKey || "").split(FIELD_INSTANCE_SEPARATOR)[0];
const buildInstanceFieldKey = (baseFieldKey, index) =>
  index <= 1 ? String(baseFieldKey || "") : `${String(baseFieldKey || "")}${FIELD_INSTANCE_SEPARATOR}${index}`;
const makeUniqueFieldKey = (baseFieldKey, usedKeys = new Set()) => {
  const base = String(baseFieldKey || "");
  if (!usedKeys.has(base)) return base;
  let index = 2;
  while (usedKeys.has(buildInstanceFieldKey(base, index))) index += 1;
  return buildInstanceFieldKey(base, index);
};
const getDefaultInsertPosition = (sourceKey, existingTypeCount, totalElementsOnCanvas) => {
  const anchors = {
    personal: { left: 24, top: 24 },
    personalprimary: { left: 24, top: 24 },
    personaldetails: { left: 24, top: 58 },
    contact: { left: 24, top: 74 },
    social: { left: 24, top: 124 },
    address: { left: 24, top: 174 },
    photo: { left: 210, top: 24 },
  };
  const base = anchors[String(sourceKey || "").toLowerCase()] || { left: 24, top: 24 };
  const localStep = Math.min(existingTypeCount, 6) * 12;
  const globalStep = Math.min(totalElementsOnCanvas, 12) * 4;
  return {
    left: base.left + localStep + globalStep,
    top: base.top + localStep,
  };
};

const scaleFontByBoxResize = (textObj, prevBoxHeight, nextBoxHeight, opts = {}) => {
  const prevH = Number(prevBoxHeight);
  const nextH = Number(nextBoxHeight);
  if (!Number.isFinite(prevH) || prevH <= 0 || !Number.isFinite(nextH) || nextH <= 0) return false;

  const stepPixels = Number.isFinite(Number(opts.stepPixels)) ? Number(opts.stepPixels) : 10;
  const minFontSize = Number.isFinite(Number(opts.minFontSize)) ? Number(opts.minFontSize) : 10;
  const maxFontSize = Number.isFinite(Number(opts.maxFontSize)) ? Number(opts.maxFontSize) : 220;
  const currentSize = Number(textObj.fontSize) || 14;
  const diff = nextH - prevH;
  if (Math.abs(diff) < 0.5) return false;

  const steps = Math.max(1, Math.round(Math.abs(diff) / Math.max(1, stepPixels)));
  const direction = diff > 0 ? 1 : -1;
  const nextSize = clampNumber(currentSize + direction * steps, minFontSize, maxFontSize);
  if (Math.abs(nextSize - currentSize) < 0.1) return false;
  textObj.set({ fontSize: nextSize });
  return true;
};

const autoFitTextToBox = (textObj, opts = {}) => {
  if (!textObj || textObj.data?.type !== "text") return false;
  const minFontSize = Number.isFinite(Number(opts.minFontSize)) ? Number(opts.minFontSize) : 10;
  const maxFontSize = Number.isFinite(Number(opts.maxFontSize)) ? Number(opts.maxFontSize) : 220;
  const maxIterations = Number.isFinite(Number(opts.maxIterations)) ? Number(opts.maxIterations) : 32;
  const boxWidth = Number(textObj.data?.boxWidth);
  const boxHeight = Number(textObj.data?.boxHeight);
  if (!boxWidth || boxWidth <= 0 || !boxHeight || boxHeight <= 0) return false;

  let changed = false;
  let i = 0;

  // First, shrink if overflowing
  while (i < maxIterations) {
    const fontSize = Number(textObj.fontSize) || 14;
    const textWidth = Number(textObj.calcTextWidth?.() ?? textObj.getScaledWidth());
    const textHeight = fontSize * 1.35;
    const overflow = textWidth > boxWidth || textHeight > boxHeight;
    if (!overflow || fontSize <= minFontSize) break;
    textObj.set({ fontSize: fontSize - 1 });
    changed = true;
    i += 1;
  }

  // Then, grow if there's significant space left (to fill the box)
  if (!changed) {
    while (i < maxIterations) {
      const fontSize = Number(textObj.fontSize) || 14;
      if (fontSize >= maxFontSize) break;
      const nextSize = fontSize + 1;
      textObj.set({ fontSize: nextSize });
      const textWidth = Number(textObj.calcTextWidth?.() ?? textObj.getScaledWidth());
      const textHeight = nextSize * 1.35;
      if (textWidth > boxWidth || textHeight > boxHeight) {
        textObj.set({ fontSize: fontSize }); // Step back
        break;
      }
      changed = true;
      i += 1;
    }
  }

  return changed;
};

const expandTextBoxToFitContent = (textObj, opts = {}) => {
  if (!textObj || textObj.data?.type !== "text") return false;
  const growOnly = Boolean(opts.growOnly);
  textObj.initDimensions();
  const measuredWidthRaw = Number(textObj.calcTextWidth?.() ?? textObj.getScaledWidth());
  const measuredHeightRaw = Number(textObj.calcTextHeight?.() ?? textObj.getScaledHeight());
  const measuredWidth = Number.isFinite(measuredWidthRaw) && measuredWidthRaw > 0
    ? measuredWidthRaw
    : Number(textObj.getScaledWidth()) || 1;
  const measuredHeight = Number.isFinite(measuredHeightRaw) && measuredHeightRaw > 0
    ? measuredHeightRaw
    : Number(textObj.getScaledHeight()) || 1;
  const nextWidth = Math.max(1, Math.ceil(measuredWidth));
  const nextHeight = Math.max(1, Math.ceil(measuredHeight));

  const currentWidth = Number(textObj.data?.boxWidth);
  const currentHeight = Number(textObj.data?.boxHeight);
  const resolvedCurrentWidth = Number.isFinite(currentWidth) && currentWidth > 0 ? currentWidth : 0;
  const resolvedCurrentHeight = Number.isFinite(currentHeight) && currentHeight > 0 ? currentHeight : 0;

  const finalWidth = growOnly ? Math.max(resolvedCurrentWidth, nextWidth) : nextWidth;
  const finalHeight = growOnly ? Math.max(resolvedCurrentHeight, nextHeight) : nextHeight;
  const changed = finalWidth !== resolvedCurrentWidth || finalHeight !== resolvedCurrentHeight;
  if (!changed) return false;

  textObj.data = {
    ...textObj.data,
    boxWidth: finalWidth,
    boxHeight: finalHeight,
  };
  textObj.set({ width: Math.max(1, Number(textObj.data.boxWidth) || 1) });
  textObj.setCoords();
  return true;
};

const syncTextBoxHeightToContent = (textObj) => {
  if (!textObj || textObj.data?.type !== "text") return false;
  const currentWidth = Number(textObj.data?.boxWidth);
  const lockedWidth = Number.isFinite(currentWidth) && currentWidth > 0
    ? Math.max(1, Math.ceil(currentWidth))
    : Math.max(1, Math.ceil(Number(textObj.getScaledWidth()) || 1));

  // Keep user-set width fixed and recompute only height from content.
  textObj.set({ width: lockedWidth });
  textObj.initDimensions();

  const measuredHeightRaw = Number(textObj.calcTextHeight?.() ?? textObj.getScaledHeight());
  const measuredHeight = Number.isFinite(measuredHeightRaw) && measuredHeightRaw > 0
    ? measuredHeightRaw
    : Number(textObj.getScaledHeight()) || 1;
  const nextHeight = Math.max(1, Math.ceil(measuredHeight));

  const prevHeight = Number(textObj.data?.boxHeight);
  const resolvedPrevHeight = Number.isFinite(prevHeight) && prevHeight > 0 ? prevHeight : 0;
  const changed = resolvedPrevHeight !== nextHeight;

  textObj.data = {
    ...textObj.data,
    boxWidth: lockedWidth,
    boxHeight: nextHeight,
  };
  textObj.set({ width: lockedWidth });
  textObj.setCoords();
  return changed;
};

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
const FullscreenFrameEditor = ({ frame, fields = [], layout: initLayout = {}, onSave, onClose }) => {
  const normalizedFields = React.useMemo(() => {
    const list = Array.isArray(fields) ? fields : [];
    const hasLegacyPersonal = list.some((f) => String(f?.key || "").toLowerCase() === "personal");
    const hasPrimary = list.some((f) => String(f?.key || "").toLowerCase() === "personalprimary");
    const hasDetails = list.some((f) => String(f?.key || "").toLowerCase() === "personaldetails");

    if (!hasLegacyPersonal || (hasPrimary && hasDetails)) return list;

    const next = [];
    list.forEach((field) => {
      const key = String(field?.key || "").toLowerCase();
      if (key === "personal") {
        if (!hasPrimary) next.push({ key: "personalPrimary", label: "Name / Business Name" });
        if (!hasDetails) next.push({ key: "personalDetails", label: "Profile Details" });
        return;
      }
      next.push(field);
    });
    return next;
  }, [fields]);

  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const suppressRef = useRef(false);
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  const [layout, setLayout] = useState(initLayout);
  const [activeObj, setActiveObj] = useState(null);
  const [activeProp, setActiveProp] = useState(null);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [themeId, setThemeId] = useState("ocean");
  const [externalUpdateMsg, setExternalUpdateMsg] = useState(null);

  // Listen for profile type updates from other admin tabs
  useEffect(() => {
    const handler = ({ type } = {}) => {
      setExternalUpdateMsg(`Profile type "${type || 'unknown'}" was updated. Save your work and reload if needed.`);
      setTimeout(() => setExternalUpdateMsg(null), 5000);
    };
    socket.on('profileTypeUpdated', handler);
    return () => socket.off('profileTypeUpdated', handler);
  }, []);

  const frameImageUrl = frame?.framePath?.startsWith("http")
    ? frame.framePath
    : frame?.framePath ? `${BASE_URL}/${frame.framePath}` : null;

  /* read props from fabric obj */
  const readProps = useCallback((obj) => {
    if (!obj) return null;
    const boxWidth = Number(obj.data?.boxWidth);
    const boxHeight = Number(obj.data?.boxHeight);
    const resolvedWidth =
      obj.data?.type === "text" && Number.isFinite(boxWidth) && boxWidth > 0
        ? boxWidth
        : obj.getScaledWidth();
    const resolvedHeight =
      obj.data?.type === "text" && Number.isFinite(boxHeight) && boxHeight > 0
        ? boxHeight
        : obj.getScaledHeight();
    return {
      fieldKey: obj.data?.fieldKey,
      type: obj.data?.type,
      fontSize: normalizeTextFontSize(obj.fontSize, DEFAULT_TEXT_FONT_SIZE),
      fontColour: obj.fill || "#000000",
      fontWeight: obj.fontWeight || "normal",
      fontFamily: obj.data?.selectedFontFamily || obj.fontFamily || "Arial",
      textAlign: obj.data?.textAlign || obj.textAlign || "left",
      letterSpacing: Number.isFinite(Number(obj.charSpacing)) ? Number(obj.charSpacing) / 10 : 0,
      textShadow: obj.data?.textShadow || "",
      left: Math.round(obj.left),
      top: Math.round(obj.top),
      width: Math.round(resolvedWidth),
      height: Math.round(resolvedHeight),
      angle: Math.round(obj.angle || 0),
      showBorder: true,
      borderPadding: obj.data?.borderPadding ?? 4,
      borderColour: obj.data?.borderColour ?? "#7c3aed",
      borderWidth: obj.data?.borderWidth ?? 0.6,
      selectBorderColour: obj.data?.selectBorderColour ?? "#7c3aed",
      selectBorderWidth: obj.data?.selectBorderWidth ?? 0.8,
    };
  }, []);

  /* serialize canvas → layout JSON */
  const serializeLayout = useCallback((canvas) => {
    const next = {};
    canvas.getObjects().forEach((obj) => {
      const key = obj.data?.fieldKey;
      if (!key || obj.data?.isBorderRect) return;
      const e = fabricObjToLayout(obj);
      next[key] = {
        ...(layout[key] || {}),
        left: e.left, top: e.top, width: e.width, height: e.height, angle: e.angle,
        ...(e.fontSize !== undefined ? { fontSize: e.fontSize } : {}),
        ...(e.fontColour ? { fontColour: e.fontColour } : {}),
        ...(e.fontWeight ? { fontWeight: e.fontWeight } : {}),
        ...(e.fontFamily ? { fontFamily: e.fontFamily } : {}),
        ...(e.textAlign ? { textAlign: e.textAlign } : {}),
        ...(Number.isFinite(Number(e.letterSpacing)) ? { letterSpacing: Number(e.letterSpacing) } : {}),
        ...(e.textShadow ? { textShadow: e.textShadow } : {}),
        showBorder: e.showBorder, borderPadding: e.borderPadding, borderColour: e.borderColour, borderWidth: e.borderWidth,
        selectBorderColour: e.selectBorderColour, selectBorderWidth: e.selectBorderWidth,
      };
    });
    return next;
  }, [layout]);

  useEffect(() => {
    setLayout(initLayout || {});
  }, [initLayout, frame?._id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("frameEditorTheme");
    if (!saved) return;
    const exists = THEME_PRESETS.some((t) => t.id === saved);
    if (exists) setThemeId(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("frameEditorTheme", themeId);
  }, [themeId]);

  const updateHistoryFlags = useCallback(() => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  const renderLayoutOnCanvas = useCallback((layoutInput = {}) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    suppressRef.current = true;
    canvas.getObjects().slice().forEach((o) => canvas.remove(o));
    const fieldMap = new Map(normalizedFields.map((field) => [field.key, field]));
    const layoutEntries = Object.entries(layoutInput || {});
    const entriesToRender = layoutEntries.length
      ? [...layoutEntries]
      : normalizedFields
          .filter((field) => field.key === "photo")
          .map((field) => [field.key, layoutInput[field.key] || {}]);
    const hasPhotoEntry = entriesToRender.some(([instanceFieldKey]) => getBaseFieldKey(instanceFieldKey) === "photo");
    if (!hasPhotoEntry && fieldMap.has("photo")) {
      entriesToRender.unshift(["photo", layoutInput.photo || {}]);
    }

    entriesToRender.forEach(([instanceFieldKey, entry]) => {
      const baseFieldKey = getBaseFieldKey(instanceFieldKey);
      const fieldMeta = fieldMap.get(baseFieldKey);
      if (!fieldMeta) return;
      const obj = baseFieldKey === "photo"
        ? makePhotoRect(entry, instanceFieldKey)
        : makeTextObj(fieldMeta, entry, instanceFieldKey);
      if (obj.data?.type === "text") {
        obj.data = {
          ...obj.data,
          boxWidth: Number.isFinite(Number(entry.width)) ? Number(entry.width) : Math.round(obj.getScaledWidth()),
          boxHeight: Number.isFinite(Number(entry.height)) ? Number(entry.height) : Math.round(obj.getScaledHeight()),
        };
        obj.set({ width: Math.max(1, Number(obj.data.boxWidth) || 1) });
      }
      canvas.add(obj);
      if (baseFieldKey !== "photo") syncBorderRect(canvas, obj);
    });
    canvas.requestRenderAll();
    suppressRef.current = false;
  }, [normalizedFields]);

  const pushUndoSnapshot = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || suppressRef.current) return;
    const snapshot = serializeLayout(canvas);
    const currentJson = JSON.stringify(snapshot);
    const last = undoStackRef.current[undoStackRef.current.length - 1];
    const lastJson = last ? JSON.stringify(last) : "";
    if (currentJson === lastJson) return;
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > 80) undoStackRef.current.shift();
    redoStackRef.current = [];
    updateHistoryFlags();
  }, [serializeLayout, updateHistoryFlags]);

  const handleUndo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || undoStackRef.current.length === 0) return;
    const current = serializeLayout(canvas);
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    redoStackRef.current.push(current);
    renderLayoutOnCanvas(prev);
    setLayout(prev);
    setActiveObj(null);
    setActiveProp(null);
    updateHistoryFlags();
  }, [renderLayoutOnCanvas, serializeLayout, updateHistoryFlags]);

  const handleRedo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas || redoStackRef.current.length === 0) return;
    const current = serializeLayout(canvas);
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(current);
    renderLayoutOnCanvas(next);
    setLayout(next);
    setActiveObj(null);
    setActiveProp(null);
    updateHistoryFlags();
  }, [renderLayoutOnCanvas, serializeLayout, updateHistoryFlags]);

  /* ── init canvas ── */
  useEffect(() => {
    const canvas = new fabric.Canvas(canvasElRef.current, {
      width: CANVAS_W, height: CANVAS_H, selection: true, preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    const emitChange = (e, source = "") => {
      if (suppressRef.current) return;
      const obj = e?.target;
      if (obj?.data?.isBorderRect && obj?.data?.forField) {
        const textObj = canvas.getObjects().find(
          (o) => o.data?.fieldKey === obj.data.forField && o.data?.type === "text" && !o.data?.isBorderRect
        );
        if (textObj) {
          const pad = Number(textObj.data?.borderPadding) || 0;
          const prevBoxH = Number(textObj.data?.boxHeight);

          const hasRectScale =
            Math.abs((obj.scaleX || 1) - 1) > 0.001 ||
            Math.abs((obj.scaleY || 1) - 1) > 0.001;

          const outerSize = getScaledSizeWithoutStroke(obj);
          // 🔥 Normalize scale
          if (hasRectScale) {
            obj.set({
              scaleX: 1,
              scaleY: 1,
              width: outerSize.width,
              height: outerSize.height,
            });
          }

          // 🔥 Position sync
          textObj.set({
            left: (obj.left || 0) + pad,
            top: (obj.top || 0) + pad,
            angle: obj.angle || 0,
          });

          // 🔥 Size update only when real resize
          if (
            source === "object:scaling" ||
            source === "object:scaled" ||
            (source === "object:modified" && hasRectScale)
          ) {
            textObj.data = {
              ...textObj.data,
              boxWidth: Math.max(1, Math.round(outerSize.width - pad * 2)),
              boxHeight: Math.max(1, Math.round(outerSize.height - pad * 2)),
            };
            textObj.set({ width: Math.max(1, Number(textObj.data.boxWidth) || 1) });
            scaleFontByBoxResize(textObj, prevBoxH, textObj.data.boxHeight, { stepPixels: 9, minFontSize: 10 });
            autoFitTextToBox(textObj, {
              minFontSize: 10,
              maxIterations: source === "object:scaling" ? 8 : 28,
            });
          }

          // 🔥 CRITICAL FIX (DON’T MISS)
          textObj.initDimensions(); // 👈 THIS FIXES TEXT BREAK / FONT ISSUE

          textObj.setCoords();

          // 🔥 Sync border again
          syncBorderRect(canvas, textObj);

          // 🔥 Force render
          canvas.requestRenderAll();
        }
      }
      if (obj?.data?.type === "text") {
        const currentBoxW = Number(obj.data?.boxWidth);
        const currentBoxH = Number(obj.data?.boxHeight);
        const hasScale = Math.abs((obj.scaleX || 1) - 1) > 0.001 || Math.abs((obj.scaleY || 1) - 1) > 0.001;
        const prevBoxH = Number(obj.data?.boxHeight);

      if (
          source === "object:scaling" ||
          source === "object:scaled" ||
          (source === "object:modified" && hasScale)
        ) {
          const scaledW = obj.getScaledWidth();
          const scaledH = obj.getScaledHeight();
          if (hasScale) {
            obj.set({ scaleX: 1, scaleY: 1 });
          }
          obj.data = {
            ...obj.data,
            boxWidth: Math.round(scaledW),
            boxHeight: Math.round(scaledH),
          };
          obj.set({ width: Math.max(1, Number(obj.data.boxWidth) || 1) });
          scaleFontByBoxResize(obj, prevBoxH, obj.data.boxHeight, { stepPixels: 9, minFontSize: 10 });
          autoFitTextToBox(obj, {
            minFontSize: 10,
            maxIterations: source === "object:scaling" ? 8 : 28,
          });
        } else if (source === "text:changed") {
          // When text content grows while typing, expand controller box instead of letting text overflow.
          expandTextBoxToFitContent(obj, { growOnly: false });
        } else if (
          !Number.isFinite(currentBoxW) || currentBoxW <= 0 ||
          !Number.isFinite(currentBoxH) || currentBoxH <= 0
        ) {
          obj.data = {
            ...obj.data,
            boxWidth: Math.round(obj.getScaledWidth()),
            boxHeight: Math.round(obj.getScaledHeight()),
          };
        }

        syncBorderRect(canvas, obj);
      }
      const newLayout = serializeLayout(canvas);
      setLayout(newLayout);
      const active = canvas.getActiveObject();
      if (active?.data?.isBorderRect && active?.data?.forField) {
        const mapped = canvas.getObjects().find(
          (o) => o.data?.fieldKey === active.data.forField && o.data?.type === "text" && !o.data?.isBorderRect
        );
        if (mapped) setActiveProp(readProps(mapped));
      } else if (active) {
        setActiveProp(readProps(active));
      }
      updateHistoryFlags();
    };

    canvas.on("object:modified", (e) => emitChange(e, "object:modified"));
    canvas.on("object:moved", (e) => emitChange(e, "object:moved"));
    canvas.on("object:scaling", (e) => emitChange(e, "object:scaling"));
    canvas.on("object:scaled", (e) => emitChange(e, "object:scaled"));
    canvas.on("object:rotated", (e) => emitChange(e, "object:rotated"));
    canvas.on("text:changed", (e) => emitChange(e, "text:changed"));
    canvas.on("mouse:down", (e) => {
      if (e?.target && !suppressRef.current) pushUndoSnapshot();
    });

    // Make text content editable on double-click (works even when border rect is selected)
    canvas.on("mouse:dblclick", (e) => {
      const target = e?.target;
      if (!target) return;

      const textObj =
        target.data?.isBorderRect && target.data?.forField
          ? canvas
            .getObjects()
            .find(
              (o) =>
                o.data?.fieldKey === target.data.forField &&
                o.data?.type === "text" &&
                !o.data?.isBorderRect
            )
          : target.data?.type === "text"
            ? target
            : null;

      if (!textObj) return;
      canvas.setActiveObject(textObj);
      setActiveObj(textObj);
      setActiveProp(readProps(textObj));
      textObj.enterEditing();
      textObj.hiddenTextarea?.focus?.();
      canvas.requestRenderAll();
    });

    const onSel = (e) => {
      const obj = e.selected?.[0];
      if (!obj) return;
      if (obj.data?.isBorderRect && obj.data?.forField) {
        const mapped = canvas.getObjects().find(
          (o) => o.data?.fieldKey === obj.data.forField && o.data?.type === "text" && !o.data?.isBorderRect
        );
        if (!mapped) return;
        setActiveObj(mapped);
        setActiveProp(readProps(mapped));
        return;
      }
      if (obj.data?.type === "text") syncBorderRect(canvas, obj);
      setActiveObj(obj);
      setActiveProp(readProps(obj));
    };
    canvas.on("selection:created", onSel);
    canvas.on("selection:updated", onSel);
    canvas.on("selection:cleared", () => { setActiveObj(null); setActiveProp(null); });

    return () => { canvas.dispose(); fabricRef.current = null; };
  }, []); // eslint-disable-line

  /* ── background image ── */
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!frameImageUrl) { canvas.setBackgroundImage(null, canvas.requestRenderAll.bind(canvas)); return; }
    fabric.Image.fromURL(frameImageUrl, (img) => {
      canvas.setBackgroundImage(img, canvas.requestRenderAll.bind(canvas), {
        scaleX: CANVAS_W / img.width, scaleY: CANVAS_H / img.height, originX: "left", originY: "top",
      });
    }, { crossOrigin: "anonymous" });
  }, [frameImageUrl]);

  /* ── build objects from fields ── */
  useEffect(() => {
    renderLayoutOnCanvas(initLayout || {});
    const canvas = fabricRef.current;
    if (!canvas) return;
    Promise.all(
      normalizedFields
        .map((field) => (initLayout || {})[field.key]?.fontFamily)
        .filter(Boolean)
        .map((ff) => loadCanvasFont(ff))
    ).then(() => canvas.requestRenderAll());
    undoStackRef.current = [];
    redoStackRef.current = [];
    updateHistoryFlags();
    setActiveObj(null); setActiveProp(null);
  }, [normalizedFields, initLayout, frame?._id, renderLayoutOnCanvas, updateHistoryFlags]); // eslint-disable-line

  /* ── apply prop change ── */
  const applyProp = useCallback((propKey, value) => {
    const canvas = fabricRef.current;
    const obj = activeObj;
    if (!canvas || !obj) return;
    pushUndoSnapshot();

    if (propKey === "fontSize") obj.set({ fontSize: normalizeTextFontSize(value, DEFAULT_TEXT_FONT_SIZE) });
    else if (propKey === "fontColour") {
      obj.set({ fill: value });
      obj.data = { ...obj.data, borderColour: value, selectBorderColour: value };
    }
    else if (propKey === "fontWeight") obj.set({ fontWeight: value });
    else if (propKey === "textAlign") {
      obj.set({ textAlign: value });
      obj.data = { ...obj.data, textAlign: value };
    }
    else if (propKey === "fontFamily") {
      const preset = FONT_STYLE_PRESETS[value] || {};

      // 🔥 STEP 1: RESET OLD STYLE (VERY IMPORTANT)
      obj.set({
        fontWeight: "normal",
        charSpacing: 0,
        angle: 0,
        shadow: null,
      });

      // 🔥 STEP 2: APPLY NEW FONT + PRESET
      obj.set({
        fontFamily: resolveCanvasFontFamily(value),
        fontWeight: preset.fontWeight || "normal",
        charSpacing: Number.isFinite(Number(preset.letterSpacing))
          ? Number(preset.letterSpacing) * 10
          : 0,
        angle: Number.isFinite(Number(preset.angle))
          ? Number(preset.angle)
          : 0,
        shadow: null,
      });

      // 🔥 STEP 3: SAVE DATA
      obj.data = {
        ...obj.data,
        selectedFontFamily: value,
        letterSpacing: Number.isFinite(Number(preset.letterSpacing))
          ? Number(preset.letterSpacing)
          : 0,
        textShadow: "",
      };

      // 🔥 STEP 4: LOAD FONT + RENDER
      loadCanvasFont(value).then(() => {
        obj.setCoords();
        canvas.requestRenderAll();
      });
    }
    else if (propKey === "left") obj.set({ left: Number(value) });
    else if (propKey === "top") obj.set({ top: Number(value) });
    else if (propKey === "width") {
      if (obj.type === "group") obj.set({ scaleX: Number(value) / obj.width });
      else if (obj.data?.type === "text") obj.data = { ...obj.data, boxWidth: Number(value) };
      else obj.set({ width: Number(value) });
    }
    else if (propKey === "height") {
      if (obj.type === "group") obj.set({ scaleY: Number(value) / obj.height });
      else if (obj.data?.type === "text") obj.data = { ...obj.data, boxHeight: Number(value) };
      else obj.set({ height: Number(value) });
    }
    else if (propKey === "angle") obj.set({ angle: Number(value) });
    else if (propKey === "borderPadding") {
      const n = Math.max(0, Number(value) || 0);
      obj.data = { ...obj.data, showBorder: true, borderPadding: n };
      // Make selection/resize box follow outer border area.
      obj.set({ padding: n });
    }
    else if (propKey === "borderColour") obj.data = { ...obj.data, borderColour: value };
    else if (propKey === "borderWidth") obj.data = { ...obj.data, borderWidth: Number(value) };
    else if (propKey === "selectBorderWidth") {
      const n = Math.max(0.5, Number(value) || 0.8);
      obj.data = { ...obj.data, selectBorderWidth: n };
      obj.set({ borderScaleFactor: n });
    }
    else if (propKey === "selectBorderColour") {
      obj.data = { ...obj.data, selectBorderColour: value };
      obj.set({ borderColor: value, cornerStrokeColor: value });
    }

    obj.setCoords();
    if (obj.data?.type === "text") {
      const prevBoxH = Number(obj.data?.boxHeight);
      const nextData = { ...obj.data };
      if (propKey === "width") {
        const n = Number(value);
        if (Number.isFinite(n) && n > 0) nextData.boxWidth = n;
      } else if (propKey === "height") {
        const n = Number(value);
        if (Number.isFinite(n) && n > 0) nextData.boxHeight = n;
      } else {
        const bw = Number(nextData.boxWidth);
        const bh = Number(nextData.boxHeight);
        if (!Number.isFinite(bw) || bw <= 0) nextData.boxWidth = Math.round(obj.getScaledWidth());
        if (!Number.isFinite(bh) || bh <= 0) nextData.boxHeight = Math.round(obj.getScaledHeight());
      }
      obj.data = nextData;
      obj.set({ width: Math.max(1, Number(nextData.boxWidth) || 1) });
      if (propKey === "fontSize") {
        // On font-size change, keep width fixed and sync only height with content.
        syncTextBoxHeightToContent(obj);
      }
      if (propKey === "height") {
        scaleFontByBoxResize(obj, prevBoxH, nextData.boxHeight, { stepPixels: 9, minFontSize: 10 });
      }
      if (propKey === "width" || propKey === "height" || propKey === "fontFamily" || propKey === "fontWeight") {
        autoFitTextToBox(obj, { minFontSize: 10, maxIterations: 28 });
      }
      syncBorderRect(canvas, obj);
    }
    canvas.requestRenderAll();
    setActiveProp(readProps(obj));
    const newLayout = serializeLayout(canvas);
    setLayout(newLayout);
    updateHistoryFlags();
  }, [activeObj, pushUndoSnapshot, readProps, serializeLayout, updateHistoryFlags]);

  const nudgeActiveObject = useCallback((dx, dy) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;

    // Keep undo behavior consistent with other edits.
    pushUndoSnapshot();

    const obj = active;
    const nextLeftRaw = (Number(obj.left) || 0) + Number(dx || 0);
    const nextTopRaw = (Number(obj.top) || 0) + Number(dy || 0);
    const maxLeft = Math.max(0, CANVAS_W - Math.round(obj.getScaledWidth?.() || 0));
    const maxTop = Math.max(0, CANVAS_H - Math.round(obj.getScaledHeight?.() || 0));

    obj.set({
      left: clampNumber(Math.round(nextLeftRaw), 0, maxLeft),
      top: clampNumber(Math.round(nextTopRaw), 0, maxTop),
    });
    obj.setCoords();
    canvas.requestRenderAll();

    // Reuse existing canvas change pipeline so text/border/layout stay in sync.
    canvas.fire("object:moved", { target: obj });
  }, [pushUndoSnapshot]);

  useEffect(() => {
    const onKeyDown = (e) => {
      const key = String(e.key || "").toLowerCase();
      if (!(e.ctrlKey || e.metaKey)) return;
      const active = fabricRef.current?.getActiveObject();
      if (active?.isEditing) return;
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (key === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }
      const nudgeStep = e.shiftKey ? 5 : 1;
      if (key === "arrowleft") {
        e.preventDefault();
        nudgeActiveObject(-nudgeStep, 0);
        return;
      }
      if (key === "arrowright") {
        e.preventDefault();
        nudgeActiveObject(nudgeStep, 0);
        return;
      }
      if (key === "arrowup") {
        e.preventDefault();
        nudgeActiveObject(0, -nudgeStep);
        return;
      }
      if (key === "arrowdown") {
        e.preventDefault();
        nudgeActiveObject(0, nudgeStep);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRedo, handleUndo, nudgeActiveObject]);

  /* ── zoom canvas via CSS scale ── */
  const ZOOM_STEPS = [0.5, 0.6, 0.75, 1, 1.25, 1.5, 2];
  const zoomIn = () => setZoom((z) => { const i = ZOOM_STEPS.indexOf(z); return ZOOM_STEPS[Math.min(i + 1, ZOOM_STEPS.length - 1)]; });
  const zoomOut = () => setZoom((z) => { const i = ZOOM_STEPS.indexOf(z); return ZOOM_STEPS[Math.max(i - 1, 0)]; });

  /* ── select field from sidebar ── */
  const selectField = useCallback((fieldKey) => {
    const canvas = fabricRef.current;
    if (!canvas) return false;
    const baseFieldKey = getBaseFieldKey(fieldKey);
    const targetText = canvas.getObjects().find(
      (o) =>
        o.data?.type === "text" &&
        !o.data?.isBorderRect &&
        getBaseFieldKey(o.data?.fieldKey) === baseFieldKey
    );
    const targetRect = targetText
      ? canvas.getObjects().find(
          (o) => o.data?.isBorderRect && o.data?.forField === targetText.data?.fieldKey
        )
      : null;
    if (targetRect && targetText) {
      canvas.setActiveObject(targetRect);
      setActiveObj(targetText);
      setActiveProp(readProps(targetText));
      canvas.requestRenderAll();
      return true;
    }
    if (targetText) {
      canvas.setActiveObject(targetText);
      setActiveObj(targetText);
      setActiveProp(readProps(targetText));
      canvas.requestRenderAll();
      return true;
    }
    return false;
  }, [readProps]);

  const addFieldInstance = useCallback((baseFieldKey) => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const sourceKey = getBaseFieldKey(baseFieldKey);
    if (sourceKey === "photo") {
      selectField("photo");
      return;
    }

    pushUndoSnapshot();

    const usedKeys = new Set(
      canvas
        .getObjects()
        .filter((o) => !o.data?.isBorderRect && o.data?.fieldKey)
        .map((o) => String(o.data.fieldKey))
    );
    const instanceFieldKey = makeUniqueFieldKey(sourceKey, usedKeys);
    const fieldMeta = normalizedFields.find((field) => field.key === sourceKey) || {
      key: sourceKey,
      label: sourceKey,
    };
    const sameTypeObjects = canvas
      .getObjects()
      .filter((o) => !o.data?.isBorderRect && getBaseFieldKey(o.data?.fieldKey) === sourceKey);
    const existingSameTypeCount = sameTypeObjects.length;
    const totalElementsOnCanvas = canvas
      .getObjects()
      .filter((o) => !o.data?.isBorderRect)
      .length;
    const seedEntry = layout[sourceKey] || {};
    const defaultPos = getDefaultInsertPosition(sourceKey, existingSameTypeCount, totalElementsOnCanvas);
    const hasSeedLeft = Number.isFinite(Number(seedEntry.left));
    const hasSeedTop = Number.isFinite(Number(seedEntry.top));
    const lastSameType = sameTypeObjects[existingSameTypeCount - 1];
    const hasLastLeft = Number.isFinite(Number(lastSameType?.left));
    const hasLastTop = Number.isFinite(Number(lastSameType?.top));
    const stackedLeft = hasLastLeft ? Number(lastSameType.left) + 18 : defaultPos.left;
    const stackedTop = hasLastTop ? Number(lastSameType.top) + 18 : defaultPos.top;
    const nextEntry = {
      ...seedEntry,
      left:
        existingSameTypeCount > 0
          ? clampNumber(stackedLeft, 8, CANVAS_W - 120)
          : (hasSeedLeft ? Number(seedEntry.left) : defaultPos.left),
      top:
        existingSameTypeCount > 0
          ? clampNumber(stackedTop, 8, CANVAS_H - 70)
          : (hasSeedTop ? Number(seedEntry.top) : defaultPos.top),
    };

    const obj = makeTextObj(fieldMeta, nextEntry, instanceFieldKey);
    obj.data = {
      ...obj.data,
      boxWidth: Number.isFinite(Number(nextEntry.width))
        ? Number(nextEntry.width)
        : Math.round(obj.getScaledWidth()),
      boxHeight: Number.isFinite(Number(nextEntry.height))
        ? Number(nextEntry.height)
        : Math.round(obj.getScaledHeight()),
    };
    obj.set({ width: Math.max(1, Number(obj.data.boxWidth) || 1) });

    canvas.add(obj);
    syncBorderRect(canvas, obj);
    const borderRect = canvas.getObjects().find(
      (o) => o.data?.isBorderRect && o.data?.forField === instanceFieldKey
    );
    canvas.setActiveObject(borderRect || obj);
    setActiveObj(obj);
    setActiveProp(readProps(obj));
    canvas.requestRenderAll();

    const latestLayout = serializeLayout(canvas);
    setLayout(latestLayout);
    updateHistoryFlags();
  }, [normalizedFields, layout, pushUndoSnapshot, readProps, selectField, serializeLayout, updateHistoryFlags]);

  /* ── save ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const canvas = fabricRef.current;
      const latestLayout = canvas ? serializeLayout(canvas) : layout;
      setLayout(latestLayout);
      await onSave(latestLayout);
      // Notify all connected clients that a frame layout was updated
      socket.emit('frameUpdated', { id: frame?._id, category: frame?.category });
    } finally { setSaving(false); }
  };

  const isText = activeProp?.type === "text";
  const isPhoto = activeProp?.type === "photo";
  const currentFontSize = normalizeTextFontSize(activeProp?.fontSize, DEFAULT_TEXT_FONT_SIZE);
  const [fontSizeDraft, setFontSizeDraft] = useState(String(DEFAULT_TEXT_FONT_SIZE));
  const currentTextAlign = activeProp?.textAlign || "left";
  const cycleTextAlign = () => {
    if (!isText) return;
    const idx = TEXT_ALIGN_ORDER.indexOf(currentTextAlign);
    const nextAlign = TEXT_ALIGN_ORDER[(idx + 1) % TEXT_ALIGN_ORDER.length];
    applyProp("textAlign", nextAlign);
  };
  useEffect(() => {
    if (!isText) return;
    setFontSizeDraft(String(currentFontSize));
  }, [isText, currentFontSize, activeProp?.fieldKey]);

  const commitFontSize = (rawValue) => {
    if (!isText) return;
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      setFontSizeDraft(String(currentFontSize));
      return;
    }
    const normalized = normalizeTextFontSize(parsed, DEFAULT_TEXT_FONT_SIZE);
    applyProp("fontSize", normalized);
    setFontSizeDraft(String(normalized));
  };

  const stepFontSize = (delta) => {
    if (!isText) return;
    const next = clampNumber(currentFontSize + delta, MIN_TEXT_FONT_SIZE, MAX_TEXT_FONT_SIZE);
    applyProp("fontSize", next);
    setFontSizeDraft(String(next));
  };
  const decreaseFontSize = () => stepFontSize(-1);
  const increaseFontSize = () => stepFontSize(1);
  const isMinFontSize = currentFontSize <= MIN_TEXT_FONT_SIZE;
  const isMaxFontSize = currentFontSize >= MAX_TEXT_FONT_SIZE;
  const activeTheme = THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
  const themeVars = {
    "--canvas-card": activeTheme?.vars?.["--canvas-card"],
  };

  return (
    <div className={styles.overlay} style={themeVars}>
      {/* External update notification */}
      {externalUpdateMsg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: '#f59e0b', color: '#1c1917', padding: '8px 16px',
          fontSize: 13, fontWeight: 600, textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          ⚠️ {externalUpdateMsg}
          <button onClick={() => setExternalUpdateMsg(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>✕</button>
        </div>
      )}
      {/* ══ TOP TOOLBAR ══ */}
      <div className={styles.topBar}>
        {/* Left: close + title */}
        <div className={styles.topLeft}>
          <button className={styles.closeBtn} onClick={onClose} title="Close editor">X</button>
          <div className={styles.frameTitle}>
            <span className={styles.frameTitleLabel}>Editing Frame</span>
            <span className={styles.frameCat}>{frame?.category || "-"}</span>
          </div>
        </div>

        {/* Center: property controls */}
        <div className={styles.toolGroup}>
          {!activeProp && (
            <span className={styles.toolHint}>Click an element on the canvas to edit</span>
          )}

          {activeProp && (
            <>
              {/* Field badge */}
              <span className={styles.fieldBadge}>{getBaseFieldKey(activeProp.fieldKey)?.toUpperCase()}</span>

              {/* Font size — text only */}
              {isText && (
                <div className={styles.toolSection}>
                  <span className={styles.toolLabel}>Size</span>
                  <div className={styles.sizeRow}>
                    <button
                      type="button"
                      className={styles.sizeBtn}
                      onClick={decreaseFontSize}
                      disabled={isMinFontSize}
                      title="Decrease text size"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className={styles.sizeInput}
                      value={fontSizeDraft}
                      min={MIN_TEXT_FONT_SIZE}
                      max={MAX_TEXT_FONT_SIZE}
                      step={1}
                      onChange={(e) => setFontSizeDraft(e.target.value)}
                      onBlur={(e) => commitFontSize(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitFontSize(e.currentTarget.value);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.sizeBtn}
                      onClick={increaseFontSize}
                      disabled={isMaxFontSize}
                      title="Increase text size"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Color — text only */}
              {isText && (
                <div className={styles.toolSection}>
                  <span className={styles.toolLabel}>Color</span>
                  <label className={styles.colorSwatch} style={{ background: activeProp.fontColour }}>
                    <input type="color" value={activeProp.fontColour} onChange={(e) => applyProp("fontColour", e.target.value)} />
                  </label>
                </div>
              )}

              {/* Bold — text only */}
              {isText && (
                <div className={styles.toolSection}>
                  <button type="button"
                    className={`${styles.boldBtn} ${activeProp.fontWeight === "bold" ? styles.boldBtnActive : ""}`}
                    onClick={() => applyProp("fontWeight", activeProp.fontWeight === "bold" ? "normal" : "bold")}>
                    <b>B</b>
                  </button>
                </div>
              )}

              {/* Font family — text only */}
              {isText && (
                <div className={styles.toolSection}>
                  <span className={styles.toolLabel}>Font</span>
                  <select className={styles.fontSelect} value={activeProp.fontFamily} onChange={(e) => applyProp("fontFamily", e.target.value)}>
                    {FONT_FAMILIES.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                  </select>
                </div>
              )}

              {isText && (
                <div className={styles.toolSection}>
                  <span className={styles.toolLabel}>Align</span>
                  <button
                    type="button"
                    className={styles.alignCycleBtn}
                    onClick={cycleTextAlign}
                    title={`Text align: ${currentTextAlign} (click to change)`}
                  >
                    <span className={`${styles.alignIcon} ${styles[`align_${currentTextAlign}`]}`}>
                      <i />
                      <i />
                      <i />
                    </span>
                  </button>
                </div>
              )}

              {/* Border — text only */}
              {isText && (
                <div className={styles.toolSection}>
                  <span className={styles.toolLabel}>Border</span>
                  <input type="range" min={0} max={30} value={activeProp.borderPadding}
                    onChange={(e) => applyProp("borderPadding", e.target.value)}
                    className={styles.padRange} title="Border padding" />
                  <span className={styles.padVal}>{activeProp.borderPadding}px</span>
                  <input type="range" min={0.5} max={12} step={0.1} value={activeProp.borderWidth ?? 0.6}
                    onChange={(e) => applyProp("borderWidth", e.target.value)}
                    className={styles.padRange} title="Border width" />
                  <span className={styles.padVal}>{activeProp.borderWidth ?? 0.6}px</span>
                  <label className={styles.colorSwatch} style={{ background: activeProp.borderColour }}>
                    <input type="color" value={activeProp.borderColour} onChange={(e) => applyProp("borderColour", e.target.value)} />
                  </label>
                  <input type="range" min={0.5} max={10} step={0.1} value={activeProp.selectBorderWidth ?? 0.8}
                    onChange={(e) => applyProp("selectBorderWidth", e.target.value)}
                    className={styles.padRange} title="Selection border width" />
                  <span className={styles.padVal}>{activeProp.selectBorderWidth ?? 0.8}px</span>
                  <label className={styles.colorSwatch} style={{ background: activeProp.selectBorderColour || "#7c3aed" }}>
                    <input type="color" value={activeProp.selectBorderColour || "#7c3aed"} onChange={(e) => applyProp("selectBorderColour", e.target.value)} />
                  </label>
                </div>
              )}

              {/* X / Y */}
              <div className={styles.toolSection}>
                <span className={styles.toolLabel}>X</span>
                <input type="number" className={styles.numInput} value={activeProp.left} onChange={(e) => applyProp("left", e.target.value)} />
                <span className={styles.toolLabel}>Y</span>
                <input type="number" className={styles.numInput} value={activeProp.top} onChange={(e) => applyProp("top", e.target.value)} />
              </div>

              {/* W / H — photo + text box */}
              {(isPhoto || isText) && (
                <div className={styles.toolSection}>
                  <span className={styles.toolLabel}>W</span>
                  <input type="number" className={styles.numInput} value={activeProp.width} onChange={(e) => applyProp("width", e.target.value)} />
                  <span className={styles.toolLabel}>H</span>
                  <input type="number" className={styles.numInput} value={activeProp.height} onChange={(e) => applyProp("height", e.target.value)} />
                </div>
              )}

              {/* Angle */}
              <div className={styles.toolSection}>
                <span className={styles.toolLabel}>Angle</span>
                <input type="range" min={-180} max={180} value={activeProp.angle}
                  onChange={(e) => applyProp("angle", e.target.value)} className={styles.padRange} />
                <span className={styles.padVal}>{activeProp.angle}deg</span>
              </div>
            </>
          )}
        </div>

        {/* Right: zoom + save */}
        <div className={styles.topRight}>
          <div className={styles.zoomGroup}>
            <span className={styles.themeLabel}>Theme</span>
            <select
              className={styles.themeSelect}
              value={themeId}
              onChange={(e) => setThemeId(e.target.value)}
              title="Choose editor theme"
            >
              {THEME_PRESETS.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.zoomGroup}>
            <button className={styles.zoomBtn} onClick={handleUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}>
              ↶
            </button>
            <button className={styles.zoomBtn} onClick={handleRedo} title="Redo (Ctrl+Y)" disabled={!canRedo}>
              ↷
            </button>
          </div>
          <div className={styles.zoomGroup}>
            <button className={styles.zoomBtn} onClick={zoomOut} title="Zoom out">-</button>
            <span className={styles.zoomVal}>{Math.round(zoom * 100)}%</span>
            <button className={styles.zoomBtn} onClick={zoomIn} title="Zoom in">+</button>
          </div>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? <span className={styles.spinner} /> : null}
            {saving ? "Saving..." : "Save Layout"}
          </button>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className={styles.body}>
        {/* ── LEFT SIDEBAR: field list ── */}
        <div className={styles.sidebar}>
          <div className={styles.sidebarTitle}>Fields</div>
          {normalizedFields.map((field) => (
            <button key={field.key} type="button"
              className={`${styles.fieldBtn} ${getBaseFieldKey(activeProp?.fieldKey) === field.key ? styles.fieldBtnActive : ""}`}
              onClick={() => addFieldInstance(field.key)}>
              <span className={styles.fieldIcon}>{field.key === "photo" ? "P" : "T"}</span>
              {field.label}
            </button>
          ))}
        </div>

        {/* ── CANVAS AREA ── */}
        <div className={styles.canvasArea}>
          <div className={styles.canvasScaler} style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            <canvas ref={canvasElRef} />
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: full tools panel ── */}
        <div className={styles.inspector}>
          <div className={styles.inspectorHeader}>Tools</div>
          {!activeProp && (
            <div className={styles.inspectorHint}>Select any element on canvas to edit properties.</div>
          )}

          {activeProp && (
            <div className={styles.inspectorBody}>
              <div className={styles.inspectorBadge}>{getBaseFieldKey(activeProp.fieldKey)?.toUpperCase()}</div>

              {isText && (
                <div className={styles.inspectorRow}>
                  <span className={styles.inspectorLabel}>Size</span>
                  <div className={styles.sizeRow}>
                    <button
                      type="button"
                      className={styles.sizeBtn}
                      onClick={decreaseFontSize}
                      disabled={isMinFontSize}
                      title="Decrease text size"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      className={styles.sizeInput}
                      value={fontSizeDraft}
                      min={MIN_TEXT_FONT_SIZE}
                      max={MAX_TEXT_FONT_SIZE}
                      step={1}
                      onChange={(e) => setFontSizeDraft(e.target.value)}
                      onBlur={(e) => commitFontSize(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitFontSize(e.currentTarget.value);
                      }}
                    />
                    <button
                      type="button"
                      className={styles.sizeBtn}
                      onClick={increaseFontSize}
                      disabled={isMaxFontSize}
                      title="Increase text size"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {isText && (
                <div className={styles.inspectorRow}>
                  <span className={styles.inspectorLabel}>Color</span>
                  <label className={styles.colorSwatch} style={{ background: activeProp.fontColour }}>
                    <input type="color" value={activeProp.fontColour} onChange={(e) => applyProp("fontColour", e.target.value)} />
                  </label>
                </div>
              )}

              {isText && (
                <div className={styles.inspectorRow}>
                  <span className={styles.inspectorLabel}>Bold</span>
                  <button type="button"
                    className={`${styles.boldBtn} ${activeProp.fontWeight === "bold" ? styles.boldBtnActive : ""}`}
                    onClick={() => applyProp("fontWeight", activeProp.fontWeight === "bold" ? "normal" : "bold")}>
                    <b>B</b>
                  </button>
                </div>
              )}

              {isText && (
                <div className={styles.inspectorRow}>
                  <span className={styles.inspectorLabel}>Font</span>
                  <select className={styles.fontSelect} value={activeProp.fontFamily} onChange={(e) => applyProp("fontFamily", e.target.value)}>
                    {FONT_FAMILIES.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                  </select>
                </div>
              )}

              {isText && (
                <div className={styles.inspectorRow}>
                  <span className={styles.inspectorLabel}>Align</span>
                  <button
                    type="button"
                    className={styles.alignCycleBtn}
                    onClick={cycleTextAlign}
                    title={`Text align: ${currentTextAlign} (click to change)`}
                  >
                    <span className={`${styles.alignIcon} ${styles[`align_${currentTextAlign}`]}`}>
                      <i />
                      <i />
                      <i />
                    </span>
                  </button>
                </div>
              )}

              {isText && (
                <div className={styles.inspectorRow}>
                  <span className={styles.inspectorLabel}>Border Pad</span>
                  <input type="range" min={0} max={30} value={activeProp.borderPadding}
                    onChange={(e) => applyProp("borderPadding", e.target.value)}
                    className={styles.padRange} title="Border padding" />
                  <span className={styles.padVal}>{activeProp.borderPadding}px</span>
                </div>
              )}

              {isText && (
                <div className={styles.inspectorRow}>
                  <span className={styles.inspectorLabel}>Border Width</span>
                  <input type="range" min={0.5} max={12} step={0.1} value={activeProp.borderWidth ?? 0.6}
                    onChange={(e) => applyProp("borderWidth", e.target.value)}
                    className={styles.padRange} title="Border width" />
                  <span className={styles.padVal}>{activeProp.borderWidth ?? 0.6}px</span>
                  <label className={styles.colorSwatch} style={{ background: activeProp.borderColour }}>
                    <input type="color" value={activeProp.borderColour} onChange={(e) => applyProp("borderColour", e.target.value)} />
                  </label>
                </div>
              )}

              {isText && (
                <div className={styles.inspectorRow}>
                  <span className={styles.inspectorLabel}>Selection</span>
                  <input type="range" min={0.5} max={10} step={0.1} value={activeProp.selectBorderWidth ?? 0.8}
                    onChange={(e) => applyProp("selectBorderWidth", e.target.value)}
                    className={styles.padRange} title="Selection border width" />
                  <span className={styles.padVal}>{activeProp.selectBorderWidth ?? 0.8}px</span>
                  <label className={styles.colorSwatch} style={{ background: activeProp.selectBorderColour || "#7c3aed" }}>
                    <input type="color" value={activeProp.selectBorderColour || "#7c3aed"} onChange={(e) => applyProp("selectBorderColour", e.target.value)} />
                  </label>
                </div>
              )}

              <div className={styles.inspectorRow}>
                <span className={styles.inspectorLabel}>X</span>
                <input type="number" className={styles.numInput} value={activeProp.left} onChange={(e) => applyProp("left", e.target.value)} />
                <span className={styles.inspectorLabel}>Y</span>
                <input type="number" className={styles.numInput} value={activeProp.top} onChange={(e) => applyProp("top", e.target.value)} />
              </div>

              {(isPhoto || isText) && (
                <div className={styles.inspectorRow}>
                  <span className={styles.inspectorLabel}>W</span>
                  <input type="number" className={styles.numInput} value={activeProp.width} onChange={(e) => applyProp("width", e.target.value)} />
                  <span className={styles.inspectorLabel}>H</span>
                  <input type="number" className={styles.numInput} value={activeProp.height} onChange={(e) => applyProp("height", e.target.value)} />
                </div>
              )}

              <div className={styles.inspectorRow}>
                <span className={styles.inspectorLabel}>Angle</span>
                <input type="range" min={-180} max={180} value={activeProp.angle}
                  onChange={(e) => applyProp("angle", e.target.value)} className={styles.padRange} />
                <span className={styles.padVal}>{activeProp.angle}deg</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FullscreenFrameEditor;
