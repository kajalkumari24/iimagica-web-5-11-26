import * as fabric from "fabric";

const DEFAULTS = {
  width: 330,
  height: 415,
  minFontSize: 8,
  maxFontSize: 220,
  defaultFontSize: 14,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getTextObjects = (canvas) =>
  canvas
    .getObjects()
    .filter((o) => o?.type === "textbox" && o?.data?.type === "text");

const syncHeightToContent = (textObj) => {
  const boxWidth = Number(textObj?.data?.boxWidth);
  if (!Number.isFinite(boxWidth) || boxWidth <= 0) return;

  textObj.set({ width: Math.max(1, Math.round(boxWidth)) });
  textObj.initDimensions();

  const measuredHeight = Number(textObj.calcTextHeight?.() ?? textObj.getScaledHeight());
  const nextHeight = Math.max(1, Math.ceil(Number.isFinite(measuredHeight) ? measuredHeight : 1));

  textObj.data = {
    ...textObj.data,
    boxWidth: Math.max(1, Math.round(boxWidth)),
    boxHeight: nextHeight,
  };
  textObj.setCoords();
};

export const debounce = (fn, wait = 120) => {
  let timer = null;
  return (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
};

export const createHistory = (initialState = {}) => {
  let present = initialState || {};
  let past = [];
  let future = [];

  const same = (a, b) => JSON.stringify(a || {}) === JSON.stringify(b || {});

  return {
    push(nextState) {
      if (same(nextState, present)) return present;
      past.push(present);
      present = nextState || {};
      future = [];
      return present;
    },
    undo() {
      if (!past.length) return null;
      future.push(present);
      present = past.pop();
      return present;
    },
    redo() {
      if (!future.length) return null;
      past.push(present);
      present = future.pop();
      return present;
    },
    reset(nextState = {}) {
      present = nextState || {};
      past = [];
      future = [];
      return present;
    },
    current() {
      return present;
    },
    canUndo() {
      return past.length > 0;
    },
    canRedo() {
      return future.length > 0;
    },
  };
};

export const createTextObject = ({
  fieldKey,
  label,
  sampleText,
  left = 20,
  top = 20,
  width,
  height,
  fontSize = DEFAULTS.defaultFontSize,
  fontFamily = "Arial",
  fontWeight = "normal",
  fill = "#000000",
  textAlign = "left",
  angle = 0,
} = {}) => {
  const content = String(sampleText || label || fieldKey || "Text");
  const safeFontSize = clamp(Number(fontSize) || DEFAULTS.defaultFontSize, DEFAULTS.minFontSize, DEFAULTS.maxFontSize);
  const autoWidth = Math.max(90, Math.ceil(content.length * (safeFontSize * 0.62)) + 18);
  const boxWidth = Math.max(1, Math.round(Number(width) || autoWidth));

  const textObj = new fabric.Textbox(content, {
    left: Number(left) || 20,
    top: Number(top) || 20,
    width: boxWidth,
    fontSize: safeFontSize,
    fontFamily,
    fontWeight,
    fill,
    textAlign,
    angle: Number(angle) || 0,
    editable: true,
    selectable: true,
    evented: true,
    hasControls: true,
    hasBorders: true,
    lockUniScaling: false,
    cornerStyle: "circle",
    cornerColor: "#ffffff",
    cornerStrokeColor: "#7c3aed",
    borderColor: "#7c3aed",
    transparentCorners: false,
    cornerSize: 10,
  });

  textObj.data = {
    type: "text",
    fieldKey: String(fieldKey || label || "field"),
    label: String(label || fieldKey || "Field"),
    boxWidth,
    boxHeight: Math.max(1, Math.round(Number(height) || Math.ceil(safeFontSize * 1.6))),
    minFontSize: DEFAULTS.minFontSize,
    maxFontSize: DEFAULTS.maxFontSize,
  };

  syncHeightToContent(textObj);
  return textObj;
};

export const autoFitText = (textObj, opts = {}) => {
  if (!textObj || textObj?.data?.type !== "text") return false;

  const minFontSize = Number.isFinite(Number(opts.minFontSize))
    ? Number(opts.minFontSize)
    : Number(textObj.data?.minFontSize) || DEFAULTS.minFontSize;
  const maxFontSize = Number.isFinite(Number(opts.maxFontSize))
    ? Number(opts.maxFontSize)
    : Number(textObj.data?.maxFontSize) || DEFAULTS.maxFontSize;
  const maxIterations = Number.isFinite(Number(opts.maxIterations)) ? Number(opts.maxIterations) : 48;
  const boxWidth = Number(textObj.data?.boxWidth);
  const boxHeight = Number(textObj.data?.boxHeight);
  if (!Number.isFinite(boxWidth) || boxWidth <= 0 || !Number.isFinite(boxHeight) || boxHeight <= 0) return false;

  const doesOverflow = () => {
    textObj.set({ width: Math.max(1, Math.round(boxWidth)) });
    textObj.initDimensions();
    const textHeight = Number(textObj.calcTextHeight?.() ?? textObj.getScaledHeight());
    const textWidth = Number(textObj.getScaledWidth?.() ?? boxWidth);
    return textWidth > boxWidth + 0.5 || textHeight > boxHeight;
  };

  let changed = false;
  let i = 0;

  while (i < maxIterations) {
    const size = Number(textObj.fontSize) || DEFAULTS.defaultFontSize;
    if (!doesOverflow() || size <= minFontSize) break;
    textObj.set({ fontSize: size - 1 });
    changed = true;
    i += 1;
  }

  if (!changed) {
    while (i < maxIterations) {
      const size = Number(textObj.fontSize) || DEFAULTS.defaultFontSize;
      if (size >= maxFontSize) break;
      textObj.set({ fontSize: size + 1 });
      if (doesOverflow()) {
        textObj.set({ fontSize: size });
        break;
      }
      changed = true;
      i += 1;
    }
  }

  textObj.setCoords();
  return changed;
};

export const canvasStyleResize = (textObj, newBoxW, newBoxH, prevBoxW, prevBoxH) => {
  if (!textObj || textObj.data?.type !== "text") return;

  const safeNewW = Math.max(1, Math.round(newBoxW));
  const safeNewH = Math.max(1, Math.round(newBoxH));
  const safePrevH = Math.max(1, Math.round(prevBoxH || safeNewH));

  const minFs = Number(textObj.data?.minFontSize) || DEFAULTS.minFontSize;
  const maxFs = Number(textObj.data?.maxFontSize) || DEFAULTS.maxFontSize;
  const prevFs = Number(textObj.fontSize) || DEFAULTS.defaultFontSize;

  // Canva style: font sirf height ratio se scale hota hai
  const heightRatio = safeNewH / safePrevH;
  const heightChanged = Math.abs(heightRatio - 1) > 0.01;

  textObj.data = { ...textObj.data, boxWidth: safeNewW, boxHeight: safeNewH };
  textObj.set({ width: safeNewW });

  if (heightChanged) {
    const nextFs = clamp(Math.round(prevFs * heightRatio), minFs, maxFs);
    textObj.set({ fontSize: nextFs });
  }

  textObj.initDimensions();
  textObj.setCoords();
};
export const handleScaling = (obj, transform = null) => {

  const prevW = Number(obj.data?.boxWidth) || Math.max(1, Math.round(obj.getScaledWidth()));
  const prevH = Number(obj.data?.boxHeight) || Math.max(1, Math.round(obj.getScaledHeight()));

  const scaledW = Math.max(1, Math.round(Number(obj.getScaledWidth()) || prevW));
  const scaledH = Math.max(1, Math.round(Number(obj.getScaledHeight()) || prevH));

  const rawScaleX = Number(obj.scaleX || 1);
  const rawScaleY = Number(obj.scaleY || 1);
  const cornerByScale = Math.abs(rawScaleX - 1) > 0.001 && Math.abs(rawScaleY - 1) > 0.001;
  const cornerName = String(transform?.corner || obj.__corner || "").toLowerCase();
  const cornerByName = ["tl", "tr", "bl", "br"].includes(cornerName);
  const cornerResize = cornerByScale || cornerByName;

  obj.set({ scaleX: 1, scaleY: 1, width: scaledW });
  obj.data = { ...obj.data, boxWidth: scaledW, boxHeight: scaledH };

  if (cornerResize) {
    const ratio = Math.sqrt((scaledW * scaledH) / Math.max(1, prevW * prevH));
    const prevSize = Number(obj.fontSize) || DEFAULTS.defaultFontSize;
    const nextSize = clamp(
      Math.round(prevSize * ratio),
      Number(obj.data?.minFontSize) || DEFAULTS.minFontSize,
      Number(obj.data?.maxFontSize) || DEFAULTS.maxFontSize
    );
    obj.set({ fontSize: nextSize });
  } else if (Math.abs(scaledW - prevW) > 0.5 && Math.abs(scaledH - prevH) <= 0.5) {
    syncHeightToContent(obj);
  } else {
    const diffH = scaledH - prevH;
    if (Math.abs(diffH) > 0.5) {
      const prevSize = Number(obj.fontSize) || DEFAULTS.defaultFontSize;
      const step = Math.max(1, Math.round(Math.abs(diffH) / 10));
      const nextSize = clamp(
        prevSize + (diffH > 0 ? step : -step),
        Number(obj.data?.minFontSize) || DEFAULTS.minFontSize,
        Number(obj.data?.maxFontSize) || DEFAULTS.maxFontSize
      );
      obj.set({ fontSize: nextSize });
    }
  }

  autoFitText(obj, { maxIterations: 32 });
  obj.setCoords();
};

export const serializeLayout = (canvas) => {
  if (!canvas) return {};
  const out = {};

  getTextObjects(canvas).forEach((obj) => {
    const key = String(obj?.data?.fieldKey || "").trim();
    if (!key) return;

    const boxWidth = Number(obj.data?.boxWidth);
    const boxHeight = Number(obj.data?.boxHeight);

    out[key] = {
      left: Math.round(Number(obj.left) || 0),
      top: Math.round(Number(obj.top) || 0),
      width: Math.round(Number.isFinite(boxWidth) ? boxWidth : obj.getScaledWidth()),
      height: Math.round(Number.isFinite(boxHeight) ? boxHeight : obj.getScaledHeight()),
      fontSize: Math.round(Number(obj.fontSize) || DEFAULTS.defaultFontSize),
      fontFamily: obj.fontFamily || "Arial",
      fontWeight: obj.fontWeight || "normal",
      fontColour: obj.fill || "#000000",
      textAlign: obj.textAlign || "left",
      angle: Math.round(Number(obj.angle) || 0),
      sampleText: obj.text || obj?.data?.label || key,
    };
  });

  return out;
};

export const applyVisibility = (canvas, userData = {}) => {
  if (!canvas) return {};

  getTextObjects(canvas).forEach((obj) => {
    const key = String(obj?.data?.fieldKey || "");
    const fieldState = userData?.[key];
    if (!fieldState) return;

    if (typeof fieldState.visible === "boolean") obj.set({ visible: fieldState.visible });
    if (typeof fieldState.text === "string") obj.set({ text: fieldState.text });

    syncHeightToContent(obj);
    autoFitText(obj, { maxIterations: 24 });
    obj.setCoords();
  });

  canvas.requestRenderAll();
  return serializeLayout(canvas);
};

export const addText = (canvas, field, layoutEntry = {}) => {
  if (!canvas || !field?.key) return null;

  const existingObj = getTextObjects(canvas).find(
    (obj) => String(obj?.data?.fieldKey || "") === String(field.key)
  );
  if (existingObj) {
    if (typeof layoutEntry.sampleText === "string") existingObj.set({ text: layoutEntry.sampleText });
    if (Number.isFinite(Number(layoutEntry.left))) existingObj.set({ left: Number(layoutEntry.left) });
    if (Number.isFinite(Number(layoutEntry.top))) existingObj.set({ top: Number(layoutEntry.top) });
    if (Number.isFinite(Number(layoutEntry.width))) {
      existingObj.data = { ...existingObj.data, boxWidth: Math.max(1, Math.round(Number(layoutEntry.width))) };
    }
    if (Number.isFinite(Number(layoutEntry.height))) {
      existingObj.data = { ...existingObj.data, boxHeight: Math.max(1, Math.round(Number(layoutEntry.height))) };
    }
    if (Number.isFinite(Number(layoutEntry.fontSize))) existingObj.set({ fontSize: Number(layoutEntry.fontSize) });
    if (layoutEntry.fontFamily) existingObj.set({ fontFamily: layoutEntry.fontFamily });
    if (layoutEntry.fontWeight) existingObj.set({ fontWeight: layoutEntry.fontWeight });
    if (layoutEntry.fontColour) existingObj.set({ fill: layoutEntry.fontColour });
    if (layoutEntry.textAlign) existingObj.set({ textAlign: layoutEntry.textAlign });
    if (Number.isFinite(Number(layoutEntry.angle))) existingObj.set({ angle: Number(layoutEntry.angle) });

    syncHeightToContent(existingObj);
    autoFitText(existingObj, { maxIterations: 24 });
    existingObj.setCoords();
    canvas.setActiveObject(existingObj);
    canvas.requestRenderAll();
    return existingObj;
  }

  const existing = getTextObjects(canvas).length;
  const baseLeft = Number(layoutEntry.left);
  const baseTop = Number(layoutEntry.top);

  const obj = createTextObject({
    fieldKey: field.key,
    label: field.label || field.key,
    sampleText: layoutEntry.sampleText || field.label || field.key,
    left: Number.isFinite(baseLeft) ? baseLeft : 20 + existing * 8,
    top: Number.isFinite(baseTop) ? baseTop : 20 + existing * 8,
    width: layoutEntry.width,
    height: layoutEntry.height,
    fontSize: layoutEntry.fontSize,
    fontFamily: layoutEntry.fontFamily,
    fontWeight: layoutEntry.fontWeight,
    fill: layoutEntry.fontColour,
    textAlign: layoutEntry.textAlign,
    angle: layoutEntry.angle,
  });

  canvas.add(obj);
  canvas.setActiveObject(obj);
  obj.setCoords();
  canvas.requestRenderAll();
  return obj;
};

const loadBackground = (canvas, imageUrl) => {
  if (!canvas) return;
  if (!imageUrl) {
    canvas.setBackgroundImage(null, canvas.requestRenderAll.bind(canvas));
    return;
  }

  fabric.Image.fromURL(
    imageUrl,
    (img) => {
      canvas.setBackgroundImage(img, canvas.requestRenderAll.bind(canvas), {
        scaleX: (Number(canvas.width) || DEFAULTS.width) / img.width,
        scaleY: (Number(canvas.height) || DEFAULTS.height) / img.height,
        originX: "left",
        originY: "top",
      });
    },
    { crossOrigin: "anonymous" }
  );
};

const loadLayoutInternal = (canvas, fields, layout = {}) => {
  if (!canvas) return;
  canvas.getObjects().slice().forEach((o) => canvas.remove(o));

  (Array.isArray(fields) ? fields : []).forEach((field, idx) => {
    if (!field?.key) return;
    const entry = layout[field.key] || {};
    const defaultEntry = {
      left: 20,
      top: 20 + idx * 24,
      sampleText: field.label || field.key,
    };
    addText(canvas, field, { ...defaultEntry, ...entry });
  });

  canvas.discardActiveObject();
  canvas.requestRenderAll();
};

export const initCanvas = ({
  canvasEl,
  width = DEFAULTS.width,
  height = DEFAULTS.height,
  backgroundImageUrl = "",
  onLayoutChange,
  onSelectionChange,
} = {}) => {
  if (!canvasEl) throw new Error("canvasEl is required");

  const canvas = new fabric.Canvas(canvasEl, {
    width,
    height,
    selection: true,
    preserveObjectStacking: true,
  });

  loadBackground(canvas, backgroundImageUrl);

  const notifyLayout = debounce(() => {
    onLayoutChange?.(serializeLayout(canvas));
  }, 80);

  const onObjectScaling = (e) => {
    const obj = e?.target;
    if (!obj) return;
    handleScaling(obj, e?.transform || null);
    canvas.requestRenderAll();
    notifyLayout();
  };

  const onObjectModified = (e) => {
    const obj = e?.target;
    if (!obj) return;
    handleScaling(obj, e?.transform || null);
    canvas.requestRenderAll();
    notifyLayout();
  };

  const onObjectMoving = () => notifyLayout();

  const onTextChanged = (e) => {
    const obj = e?.target;
    if (!obj || obj?.data?.type !== "text") return;
    syncHeightToContent(obj);
    autoFitText(obj, { maxIterations: 24 });
    canvas.requestRenderAll();
    notifyLayout();
  };

  const onSelection = (e) => {
    const obj = e?.selected?.[0] || canvas.getActiveObject();
    onSelectionChange?.(obj || null);
  };

  const onSelectionCleared = () => onSelectionChange?.(null);

  canvas.on("object:scaling", onObjectScaling);
  canvas.on("object:modified", onObjectModified);
  canvas.on("object:moving", onObjectMoving);
  canvas.on("text:changed", onTextChanged);
  canvas.on("selection:created", onSelection);
  canvas.on("selection:updated", onSelection);
  canvas.on("selection:cleared", onSelectionCleared);

  return {
    canvas,
    addText: (field, layoutEntry = {}) => addText(canvas, field, layoutEntry),
    loadLayout: (fields, layout = {}) => {
      loadLayoutInternal(canvas, fields, layout);
      notifyLayout();
    },
    serialize: () => serializeLayout(canvas),
    setBackground: (url) => loadBackground(canvas, url),
    applyVisibility: (userData) => applyVisibility(canvas, userData),
    dispose: () => {
      canvas.off("object:scaling", onObjectScaling);
      canvas.off("object:modified", onObjectModified);
      canvas.off("object:moving", onObjectMoving);
      canvas.off("text:changed", onTextChanged);
      canvas.off("selection:created", onSelection);
      canvas.off("selection:updated", onSelection);
      canvas.off("selection:cleared", onSelectionCleared);
      canvas.dispose();
    },
  };
};
