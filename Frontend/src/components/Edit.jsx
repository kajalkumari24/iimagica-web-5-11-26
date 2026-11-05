import React, { useEffect, useRef, useState } from "react";
// import { fabric } from "fabric";
import * as fabric from "fabric";
import { Link, useLocation, useNavigate } from "react-router-dom";
import styles from "./Edit.module.css";

const frames = [
  null,
  "/frame1.png",
  "frame2.jpg",

  "frame3.jpg",
  "frame4.jpg",
  "frame5.jpg",
  "frame6.jpg",
];

const Edit = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const image = location.state?.image;

  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const cropRectRef = useRef(null);
  const suppressHistoryRef = useRef(false);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [activeTool, setActiveTool] = useState(null);

  const frameObjRef = useRef(null);

  // Text state
  const [selectedText, setSelectedText] = useState(null);
  const [selectedObject, setSelectedObject] = useState(null);
  const [textOptions, setTextOptions] = useState({
    fontSize: 24,
    fill: "#ffffff",
    text: "Your Text Here",
    fontFamily: "Arial",
    fontWeight: "normal",
    fontStyle: "normal",
    textAlign: "left",
    backgroundColor: "transparent",
  });
const [originalImage, setOriginalImage] = useState(null);


const [adjustments, setAdjustments] = useState({
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  blur: 0,
});
  // history for undo/redo
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });

  // keep text objects always above images
  const bringTextFront = () => {
    if (!fabricRef.current) return;
    try {
      const objs = fabricRef.current.getObjects();
      objs
        .filter((o) => o && (o.type === 'textbox' || o.type === 'i-text' || o.type === 'text'))
        .forEach((t) => {
          try { fabricRef.current.bringToFront(t); } catch (e) {}
        });
      fabricRef.current.requestRenderAll();
    } catch (e) {}
  };

  const ensureInteractive = (obj, opts = {}) => {
    if (!obj) return;
    try {
      const locked = opts.locked === true;
      obj.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: !!locked,
        lockMovementY: !!locked,
      });
      // mark base images so we can identify them later if needed
      if (opts.isBase) obj.set('isBaseImage', true);
      obj.setCoords();
    } catch (e) {}
  };
const applyFilters = () => {
  const obj = fabricRef.current.getActiveObject();
  if (obj && obj.type === "image") {
    obj.filters = [
      new fabric.Image.filters.Brightness({ brightness: adjustments.brightness }),
      new fabric.Image.filters.Contrast({ contrast: adjustments.contrast }),
      new fabric.Image.filters.Saturation({ saturation: adjustments.saturation }),
      new fabric.Image.filters.Vibrance({ vibrance: adjustments.vibrance }),
      new fabric.Image.filters.Blur({ blur: adjustments.blur }),
    ];
    obj.applyFilters();
    fabricRef.current.renderAll();
    saveState();
  }
};
const updateAdjustment = (key, value) => {
  setAdjustments((prev) => ({ ...prev, [key]: value }));
  setTimeout(applyFilters, 0); // apply after state updates
};

// history helpers
const saveState = () => {
  if (!fabricRef.current || suppressHistoryRef.current) return;
  try {
    const json = fabricRef.current.toJSON();
    setHistory((prev) => {
      const cut = prev.slice(0, historyStep + 1);
      const next = [...cut, json];
      setHistoryStep(next.length - 1);
      return next;
    });
    updatePreview();
  } catch (e) {
    console.warn("saveState failed", e);
  }
};

const undo = () => {
  if (historyStep <= 0) return;
  const newStep = historyStep - 1;
  const json = history[newStep];
  if (!json) return;
  suppressHistoryRef.current = true;
  fabricRef.current.loadFromJSON(json, () => {
    fabricRef.current.renderAll();
    setHistoryStep(newStep);
    suppressHistoryRef.current = false;
    updatePreview();
  });
};

const redo = () => {
  if (historyStep >= history.length - 1) return;
  const newStep = historyStep + 1;
  const json = history[newStep];
  if (!json) return;
  suppressHistoryRef.current = true;
  fabricRef.current.loadFromJSON(json, () => {
    fabricRef.current.renderAll();
    setHistoryStep(newStep);
    suppressHistoryRef.current = false;
    updatePreview();
  });
};

const updatePreview = () => {
  if (!fabricRef.current) return;
  try {
    const data = fabricRef.current.toDataURL({ format: "png", multiplier: 0.5 });
    setPreviewUrl(data);
  } catch (e) {
    // ignore
  }
};

const updateImageSize = (dim, val) => {
  const obj = fabricRef.current.getObjects().find((o) => o.type === "image");
  if (!obj || !val) return;
  if (dim === "width") obj.scaleToWidth(val);
  else obj.scaleToHeight(val);
  fabricRef.current.renderAll();
  setImageSize({ width: Math.round(obj.width * (obj.scaleX || 1)), height: Math.round(obj.height * (obj.scaleY || 1)) });
  saveState();
};



// Crop




  const [isCropping, setIsCropping] = useState(false);
  const [aspectRatio, setAspectRatio] = useState("free");

  // 🟢 Reset
 const resetCanvas = () => {
  if (!fabricRef.current || !originalImage) return;

  fabricRef.current.clear();
  fabricRef.current.backgroundColor = "#fff";

  originalImage.clone((fresh) => {
    fresh.set({
      left: 50,
      top: 50,
      selectable: true,
      evented: true,
    });
    fabricRef.current.add(fresh);
    // reset image should be selectable but locked by default
    ensureInteractive(fresh, { locked: true });
    try { fresh.sendToBack(); } catch(e){}
    // keep text on top after reset
    setTimeout(() => bringTextFront(), 20);
    fabricRef.current.setActiveObject(fresh);
    fabricRef.current.renderAll();
  });

  // reset states
  setSelectedText(null);
  setSelectedFrame(null);
  setAdjustments({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    vibrance: 0,
    blur: 0,
  });
  setIsCropping(false);
};

  // 🟢 Init Canvas
useEffect(() => {
  if (!image) navigate("/");

  fabricRef.current = new fabric.Canvas(canvasRef.current, {
    width: 800,
    height: 600,
    // leave canvas background transparent so editor background shows through
    backgroundColor: null,
  });

  fabric.Image.fromURL(image, (img) => {
    img.set({ crossOrigin: "anonymous" });
    fabricRef.current.add(img);
    // mark base image and make it selectable but locked (not movable) by default
    ensureInteractive(img, { locked: true, isBase: true });
    // ensure base image stays at the back so added text is visible above it
    try { img.sendToBack(); } catch(e){}
    fabricRef.current.setActiveObject(img);
    // ensure any existing text stays above
    setTimeout(() => bringTextFront(), 30);

    // ✅ save original safely (clone)
    img.clone((cloned) => {
      setOriginalImage(cloned);
      // set image size
      setImageSize({ width: Math.round(img.width * (img.scaleX || 1)), height: Math.round(img.height * (img.scaleY || 1)) });
      // initial history state
      setTimeout(() => saveState(), 50);
    });
  });

  fabricRef.current.on("selection:created", handleSelection);
  fabricRef.current.on("selection:updated", handleSelection);
  fabricRef.current.on("selection:cleared", () => { setSelectedText(null); setSelectedObject(null); });
  // record modifications
  fabricRef.current.on("object:modified", () => saveState());
  fabricRef.current.on("object:added", (e) => {
    try {
      const obj = e.target || e;
      if (obj && obj.type === 'image') {
        // make sure image is selectable but locked by default (so it doesn't move)
        ensureInteractive(obj, { locked: true });
        try { obj.sendToBack(); } catch (e) {}
      }
    } catch (err) {}
    if (!suppressHistoryRef.current) saveState();
    // new objects may change stacking; ensure text stays above
    setTimeout(() => bringTextFront(), 20);
  });
  fabricRef.current.on("object:removed", () => saveState());
  // double click to edit text
  fabricRef.current.on('mouse:dblclick', (opt) => {
    if (opt.target && opt.target.type === 'textbox') {
      try { opt.target.enterEditing(); opt.target.selectAll(); } catch (e) {}
    }
  });

  // when clicking anywhere on canvas, update selectedObject state
  fabricRef.current.on('mouse:down', (opt) => {
    const t = opt.target;
    if (!t) {
      setSelectedObject(null);
      setSelectedText(null);
    }
    // if user clicks an image, ensure texts stay above immediately
    if (t && t.type === 'image') {
      setTimeout(() => bringTextFront(), 8);
    }
  });

  return () => fabricRef.current.dispose();
}, [image, navigate]);

  // 🟢 Selection handler
  function handleSelection(e) {
    const obj = e.selected[0];
    if (!obj) {
      setSelectedText(null);
      setSelectedObject(null);
      return;
    }

    // if image selected, ensure text overlays stay above it
    if (obj.type === 'image') {
      setSelectedObject(obj);
      // small delay to let fabric finish its internal ordering
      setTimeout(() => bringTextFront(), 10);
      return;
    }

    if (obj && (obj.type === "textbox" || obj.type === 'i-text' || obj.type === 'text')) {
      setSelectedText(obj);
      setSelectedObject(obj);
      // make selection clamps visible and distinct
      try {
        obj.set({
          borderColor: '#ff9800',
          cornerColor: '#ff9800',
          cornerStrokeColor: '#fff',
          cornerSize: 8,
          padding: 6,
          transparentCorners: false,
          borderScaleFactor: 2,
        });
      } catch (e) {}

      setTextOptions({
        text: obj.text,
        fontSize: obj.fontSize,
        fill: obj.fill,
        fontFamily: obj.fontFamily,
        fontWeight: obj.fontWeight || "normal",
        fontStyle: obj.fontStyle || "normal",
        textAlign: obj.textAlign || "left",
        backgroundColor: obj.backgroundColor || "transparent",
      });
    } else {
      setSelectedText(null);
      setSelectedObject(obj || null);
    }
  }

  // NOTE: removed automatic text creation when tool is toggled.
  // Users should click "Add Text" in the Text panel to insert multiple text objects.



  const addText = () => {
  const text = new fabric.Textbox("New Text", {
    left: 120,
    top: 120,
    fontSize: 28,
    fill: "#111",
    fontFamily: "Arial",
    backgroundColor: "transparent",
    textAlign: "left",
    selectable: true,
    evented: true,
  });
  // set clearer selection visuals for the textbox
  try {
    text.set({
      borderColor: '#ff9800',
      cornerColor: '#ff9800',
      cornerStrokeColor: '#fff',
      cornerSize: 8,
      padding: 6,
      transparentCorners: false,
    });
  } catch (e) {}

  fabricRef.current.add(text);
  // ensure text is above image
  try { fabricRef.current.bringToFront(text); } catch (e) {}
  fabricRef.current.setActiveObject(text);
  setSelectedText(text);
  // enter inline editing immediately so user sees cursor and text
  try { text.enterEditing(); text.selectAll(); } catch (e) {}

  // Default options sync
  setTextOptions({
    text: "New Text",
    fontSize: 28,
    fill: "#111",
    fontFamily: "Arial",
    backgroundColor: "transparent",
    textAlign: "left",
    fontWeight: "normal",
    fontStyle: "normal",
  });
  saveState();
};

  const updateText = (prop, value) => {
    if (!selectedText) return;
    // for content change, ensure property 'text' is used
    if (prop === "text") {
      selectedText.set('text', value);
    } else {
      selectedText.set(prop, value);
    }
    try { selectedText.setCoords(); } catch (e) {}
    fabricRef.current.requestRenderAll();
    setTextOptions((prev) => ({ ...prev, [prop]: value }));
    // save state for undo/redo (debounced could be used later)
    saveState();
  };

  const deleteText = () => {
    if (!selectedText) return;
    fabricRef.current.remove(selectedText);
    fabricRef.current.discardActiveObject();
    setSelectedText(null);
    fabricRef.current.renderAll();
    saveState();
  };

  // 🟢 Adjust functions
  const rotate = () => {
    const obj = fabricRef.current.getActiveObject();
    if (obj) {
      obj.rotate((obj.angle || 0) + 90);
      fabricRef.current.renderAll();
      saveState();
    }
  };

  const rotateLeft = () => {
    const obj = fabricRef.current.getActiveObject();
    if (obj) {
      obj.rotate((obj.angle || 0) - 90);
      fabricRef.current.renderAll();
      saveState();
    }
  };

  const flipHorizontal = () => {
    const obj = fabricRef.current.getActiveObject();
    if (obj) {
      obj.set("flipX", !obj.flipX);
      fabricRef.current.renderAll();
      saveState();
    }
  };

  const flipVertical = () => {
    const obj = fabricRef.current.getActiveObject();
    if (obj) {
      obj.set("flipY", !obj.flipY);
      fabricRef.current.renderAll();
      saveState();
    }
  };

  const grayscale = () => {
    const obj = fabricRef.current.getActiveObject();
    if (obj && obj.type === "image") {
      obj.filters = [new fabric.Image.filters.Grayscale()];
      obj.applyFilters();
      fabricRef.current.renderAll();
    }
  };

const startCrop = () => {
  setIsCropping(true);

  if (cropRectRef.current) {
    fabricRef.current.remove(cropRectRef.current);
  }

  const rect = new fabric.Rect({
    left: 100,
    top: 100,
    width: 200,
    height: 200,
    fill: "rgba(0,0,0,0.2)",
    stroke: "red",
    strokeWidth: 2,
    selectable: true,
    hasBorders: true,
    hasControls: true,
    objectCaching: false,
  });

  cropRectRef.current = rect;
  fabricRef.current.add(rect);
  fabricRef.current.setActiveObject(rect);
  fabricRef.current.renderAll();
};

// 🟢 Apply Crop
const applyCrop = () => {
  const img = fabricRef.current
    .getObjects()
    .find((o) => o.type === "image");
  const rect = cropRectRef.current;
  if (!img || !rect) return;

  // 🔑 Rect bounds relative to canvas
  const rectBounds = rect.getBoundingRect();

  // 🔑 Image ko crop canvas par nikalna
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = rectBounds.width;
  tempCanvas.height = rectBounds.height;

  const ctx = tempCanvas.getContext("2d");

  ctx.drawImage(
    fabricRef.current.lowerCanvasEl, // full canvas as image
    rectBounds.left,
    rectBounds.top,
    rectBounds.width,
    rectBounds.height,
    0,
    0,
    rectBounds.width,
    rectBounds.height
  );

  const croppedDataUrl = tempCanvas.toDataURL("image/png");

  // 🔑 Canvas clean + cropped image wapas dalna
  fabricRef.current.clear();
  fabric.Image.fromURL(croppedDataUrl, (croppedImg) => {
    croppedImg.set({
      left: 50,
      top: 50,
      selectable: true,
      evented: true,
    });
    fabricRef.current.add(croppedImg);
    // cropped image should also be selectable but locked by default
    ensureInteractive(croppedImg, { locked: true });
    try { croppedImg.sendToBack(); } catch(e){}
    // after cropping, make sure texts are above
    setTimeout(() => bringTextFront(), 20);
    fabricRef.current.setActiveObject(croppedImg);
    fabricRef.current.renderAll();

    croppedImg.clone((cloned) => setOriginalImage(cloned));
  });

  cropRectRef.current = null;
  setIsCropping(false);
  // ensure text stays on top after crop
  setTimeout(() => bringTextFront(), 20);
};

// 🟢 Cancel Crop
const cancelCrop = () => {
  if (cropRectRef.current) {
    fabricRef.current.remove(cropRectRef.current);
    cropRectRef.current = null;
  }
  setIsCropping(false);
  fabricRef.current.renderAll();
};

  // 🟢 Frames
  const applyFrame = (frameUrl) => {
    if (!fabricRef.current) return;
    const activeObj = fabricRef.current.getActiveObject();
    if (!activeObj || activeObj.type !== "image") return;

    if (frameObjRef.current) {
      fabricRef.current.remove(frameObjRef.current);
      frameObjRef.current = null;
    }

    if (!frameUrl) {
      setSelectedFrame(null);
      fabricRef.current.renderAll();
      return;
    }

    fabric.Image.fromURL(frameUrl, (frameImg) => {
      frameImg.scaleToWidth(activeObj.width * activeObj.scaleX);
      frameImg.scaleToHeight(activeObj.height * activeObj.scaleY);

      frameImg.set({
        left: activeObj.left,
        top: activeObj.top,
        originX: "left",
        originY: "top",
        selectable: false,
        evented: false,
      });

      const group = new fabric.Group([activeObj, frameImg], {
        left: activeObj.left,
        top: activeObj.top,
        originX: "left",
        originY: "top",
      });

      fabricRef.current.remove(activeObj);
      fabricRef.current.add(group);
      // ensure group is selectable but locked by default
      ensureInteractive(group, { locked: true });
      fabricRef.current.setActiveObject(group);

      frameObjRef.current = frameImg;
      setSelectedFrame(frameUrl);

      fabricRef.current.renderAll();
      // ensure text overlays remain on top after adding frames
      setTimeout(() => bringTextFront(), 20);
    });
  };

 // 🟢 Download
const download = async (format = "png") => {
  const fabricCanvas = fabricRef.current;
  if (!fabricCanvas) return;

  // ✅ Export canvas content
  const dataURL = fabricCanvas.toDataURL({
    format: format === "jpg" ? "jpeg" : "png", // fabric accepts "jpeg" not "jpg"
    quality: 1,
    multiplier: 2, // high res
  });

  if (format === "pdf") {
    const { jsPDF } = await import("jspdf");

    const pdf = new jsPDF("l", "pt", [
      fabricCanvas.getWidth(),
      fabricCanvas.getHeight(),
    ]);

    pdf.addImage(
      dataURL,
      "PNG",
      0,
      0,
      fabricCanvas.getWidth(),
      fabricCanvas.getHeight()
    );
    pdf.save("design.pdf");
  } else {
    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `design.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Quick editor actions for selected object
const deleteSelected = () => {
  const obj = selectedObject || fabricRef.current.getActiveObject();
  if (!obj) return;
  fabricRef.current.remove(obj);
  fabricRef.current.discardActiveObject();
  setSelectedObject(null);
  setSelectedText(null);
  fabricRef.current.requestRenderAll();
  saveState();
};

const duplicateSelected = () => {
  const obj = selectedObject || fabricRef.current.getActiveObject();
  if (!obj) return;
  obj.clone((cloned) => {
    cloned.set({ left: (obj.left || 100) + 20, top: (obj.top || 100) + 20 });
    fabricRef.current.add(cloned);
    fabricRef.current.setActiveObject(cloned);
    setSelectedObject(cloned);
    if (cloned.type && cloned.type.includes('text')) setSelectedText(cloned);
    saveState();
  });
};

const bringForward = () => {
  const obj = selectedObject || fabricRef.current.getActiveObject();
  if (!obj) return;
  try { fabricRef.current.bringForward(obj); } catch (e) {}
  bringTextFront();
  saveState();
};

const sendBackward = () => {
  const obj = selectedObject || fabricRef.current.getActiveObject();
  if (!obj) return;
  try { fabricRef.current.sendBackwards(obj); } catch (e) {}
  bringTextFront();
  saveState();
};

const alignCenter = () => {
  const obj = selectedObject || fabricRef.current.getActiveObject();
  if (!obj) return;
  const canvas = fabricRef.current;
  const w = canvas.getWidth();
  const h = canvas.getHeight();
  const ow = obj.getScaledWidth ? obj.getScaledWidth() : (obj.width || 0);
  const oh = obj.getScaledHeight ? obj.getScaledHeight() : (obj.height || 0);
  obj.set({ left: Math.round((w - ow) / 2), top: Math.round((h - oh) / 2) });
  obj.setCoords();
  fabricRef.current.requestRenderAll();
  saveState();
};

const addTextToImage = (presetText = 'New Text') => {
  const active = selectedObject || fabricRef.current.getActiveObject();
  let left = 120, top = 120;
  if (active && active.type === 'image') {
    left = (active.left || 0) + 20;
    top = (active.top || 0) + 20;
  }
  const t = new fabric.Textbox(presetText, {
    left,
    top,
    fontSize: 28,
    fill: '#111',
    fontFamily: 'Arial',
    backgroundColor: 'transparent',
    selectable: true,
    evented: true,
  });
  fabricRef.current.add(t);
  try { fabricRef.current.bringToFront(t); } catch (e) {}
  fabricRef.current.setActiveObject(t);
  setSelectedText(t);
  setSelectedObject(t);
  try { t.enterEditing(); t.selectAll(); } catch (e) {}
  saveState();
};

const toggleLockSelected = () => {
  const obj = selectedObject || fabricRef.current.getActiveObject();
  if (!obj) return;
  const currentlyLocked = !!obj.lockMovementX;
  try {
    obj.set({ lockMovementX: !currentlyLocked, lockMovementY: !currentlyLocked });
    obj.setCoords();
    fabricRef.current.requestRenderAll();
    saveState();
  } catch (e) {}
};

  // 🟢 Sidebar rendering
const renderSidebar = () => {
  switch (activeTool) {
    case "text":
      return (
        <div className={styles.textOptions}>
          <h3>Text</h3>
          <button onClick={addText}>+ Add Text</button>

          {!selectedText && (
            <div style={{ marginTop: 10, color: '#ccc' }}>
              <small>Select a text object on canvas to edit its properties.</small>
            </div>
          )}

          {selectedText && (
            <>
              <label>
                Content:
                <input
                  type="text"
                  value={textOptions.text}
                  onChange={(e) => updateText('text', e.target.value)}
                />
              </label>
              <label>
                Font Size:
                <input
                  type="number"
                  value={textOptions.fontSize}
                  onChange={(e) =>
                    updateText("fontSize", parseInt(e.target.value))
                  }
                />
              </label>
              <label>
                Color:
                <input
                  type="color"
                  value={textOptions.fill}
                  onChange={(e) => updateText("fill", e.target.value)}
                />
              </label>
              <label>
                Background:
                <input
                  type="color"
                  value={textOptions.backgroundColor}
                  onChange={(e) =>
                    updateText("backgroundColor", e.target.value)
                  }
                />
              </label>
              <label>
                Font:
                <select
                  value={textOptions.fontFamily}
                  onChange={(e) => updateText("fontFamily", e.target.value)}
                >
                  <option>Arial</option>
                  <option>Verdana</option>
                  <option>Times New Roman</option>
                  <option>Courier New</option>
                  <option>Georgia</option>
                </select>
              </label>
              <label>
                Alignment:
                <select
                  value={textOptions.textAlign}
                  onChange={(e) => updateText("textAlign", e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
              <div className={styles.textStyleButtons}>
                <button
                  onClick={() =>
                    updateText(
                      "fontWeight",
                      textOptions.fontWeight === "bold" ? "normal" : "bold"
                    )
                  }
                >
                  B
                </button>
                <button
                  onClick={() =>
                    updateText(
                      "fontStyle",
                      textOptions.fontStyle === "italic" ? "normal" : "italic"
                    )
                  }
                >
                  I
                </button>
              </div>
              <button className={styles.deleteBtn} onClick={deleteText}>
                Delete Text
              </button>
            </>
          )}
        </div>
      );


    case "crop":
  return (
    <div className={styles.cropOptions}>
      <h3>Crop</h3>
      <div className={styles.aspectGrid}>
        {[
          { value: "free", label: "Free" },
          { value: "1:1", label: "1 : 1" },
          { value: "16:9", label: "16 : 9" },
          { value: "4:3", label: "4 : 3" },
        ].map((opt) => (
          <div
            key={opt.value}
            className={`${styles.aspectBox} ${
              aspectRatio === opt.value ? styles.activeAspect : ""
            }`}
            onClick={() => setAspectRatio(opt.value)}
          >
            {opt.label}
          </div>
        ))}
      </div>

      {!isCropping ? (
        <button onClick={startCrop}>Start Crop</button>
      ) : (
        <>
          <button onClick={applyCrop}>Apply Crop</button>
          <button onClick={cancelCrop}>Cancel</button>
        </>
      )}
    </div>
  );

    case "frames":
  return (
    <div className={styles.framesOptions}>
      <h3>Select Frame</h3>
      <div className={styles.frameGrid}>
        {frames.map((f, i) => (
          <div
            key={i}
            className={`${styles.frameBox} ${
              selectedFrame === f ? styles.activeFrame : ""
            }`}
            onClick={() => applyFrame(f)}
          >
            {f ? (
              <img src={f} alt={`Frame ${i}`} className={styles.frameThumb} />
            ) : (
              <span className={styles.noFrame}>No Frame</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );

    case "adjust":
  return (
    <div className={styles.adjustOptions}>
      <h3>Adjust</h3>

      <label>
        Brightness
        <input
          type="range"
          min="-1"
          max="1"
          step="0.1"
          value={adjustments.brightness}
          onChange={(e) => updateAdjustment("brightness", parseFloat(e.target.value))}
        />
      </label>

      <label>
        Contrast
        <input
          type="range"
          min="-1"
          max="1"
          step="0.1"
          value={adjustments.contrast}
          onChange={(e) => updateAdjustment("contrast", parseFloat(e.target.value))}
        />
      </label>

      <label>
        Saturation
        <input
          type="range"
          min="-1"
          max="1"
          step="0.1"
          value={adjustments.saturation}
          onChange={(e) => updateAdjustment("saturation", parseFloat(e.target.value))}
        />
      </label>

      <label>
        Vibrance
        <input
          type="range"
          min="-1"
          max="1"
          step="0.1"
          value={adjustments.vibrance}
          onChange={(e) => updateAdjustment("vibrance", parseFloat(e.target.value))}
        />
      </label>

      <label>
        Blur
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={adjustments.blur}
          onChange={(e) => updateAdjustment("blur", parseFloat(e.target.value))}
        />
      </label>
    </div>
  );
         case "resize":
        return (
          <div className={styles.resizeOptions}>
            <h3>Resize Image</h3>
            <label>
              Width:
              <input
                type="number"
                value={Math.round(imageSize.width)}
                onChange={(e) => updateImageSize("width", parseInt(e.target.value))}
              />
            </label>
            <label>
              Height:
              <input
                type="number"
                value={Math.round(imageSize.height)}
                onChange={(e) => updateImageSize("height", parseInt(e.target.value))}
              />
            </label>
          </div>
        );

    



      case "export":
        return (
          <div>
            <h3>Export</h3>
            <button onClick={() => download("png")}>Download PNG</button>
            <button onClick={() => download("jpg")}>Download JPG</button>
            <button onClick={() => download("pdf")}>Download PDF</button>
          </div>
        );

      default:
        return <p>Select a tool from top menu</p>;
    }
  };


  
  return (
    <div className={styles.editorContainer}>
      {/* Canva-style Header */}
      <div className={styles.header}>
        {/* Left */}
        <div className={styles.headerLeft}>
          <button className={styles.toggleSidebar} onClick={() => setSidebarOpen((s) => !s)}>
            {sidebarOpen ? "Hide" : "Tools"}
          </button>
          <span className={styles.logo}>Editor</span>
          {previewUrl && (
            <img src={previewUrl} alt="preview" className={styles.previewThumb} />
          )}
        </div>

        {/* Center Toolbar */}
        <div className={styles.headerCenter}>
          <button className={activeTool === "text" ? styles.activeTool : ''} onClick={() => setActiveTool("text")}>Text</button>
          <button className={activeTool === "crop" ? styles.activeTool : ''} onClick={() => setActiveTool("crop")}>Crop</button>
          <button className={activeTool === "adjust" ? styles.activeTool : ''} onClick={() => setActiveTool("adjust")}>Adjust</button>
          <button className={activeTool === "frames" ? styles.activeTool : ''} onClick={() => setActiveTool("frames")}>Frames</button>
          <button onClick={() => setActiveTool("Remover")}>BG Remover</button>
        </div>

        {/* Right */}
        <div className={styles.headerRight}>
          <button onClick={undo} disabled={historyStep <= 0}>Undo</button>
          <button onClick={redo} disabled={historyStep >= history.length - 1}>Redo</button>
          <button onClick={flipHorizontal}>Flip H</button>
          <button onClick={flipVertical}>Flip V</button>
          <button onClick={rotateLeft}>⟲</button>
          <button onClick={rotate}>⟳</button>
          <button onClick={resetCanvas}>Reset</button>
          <button onClick={() => setActiveTool("export")} className={styles.primaryBtn}>Export</button>
          <button onClick={() => navigate(-1)}>Close</button>
        </div>
      </div>

      {/* Sidebar + Canvas */}
      <div className={styles.mainArea}>
        <div className={`${styles.sidebar} ${sidebarOpen ? '' : styles.sidebarCollapsed}`}>
          {sidebarOpen ? renderSidebar() : <div className={styles.collapsedHint}>Tools</div>}
        </div>
        <div className={styles.canvasContainer}>
          <canvas ref={canvasRef} />
        </div>
      </div>
      {/* Bottom contextual toolbar (Canva-like) */}
      {(selectedObject || selectedText) && (
        <div className={styles.bottomBar}>
          {selectedText ? (
            <>
              <button onClick={() => updateText('fontSize', Math.max(8, (textOptions.fontSize||24)-2))}>A-</button>
              <button onClick={() => updateText('fontSize', (textOptions.fontSize||24)+2)}>A+</button>
              <button onClick={() => updateText('fontWeight', textOptions.fontWeight === 'bold' ? 'normal' : 'bold')}>B</button>
              <button onClick={() => updateText('fontStyle', textOptions.fontStyle === 'italic' ? 'normal' : 'italic')}>I</button>
              <input type="color" value={textOptions.fill} onChange={(e) => updateText('fill', e.target.value)} />
              <button onClick={() => duplicateSelected()}>Duplicate</button>
              <button onClick={() => deleteSelected()}>Delete</button>
            </>
          ) : selectedObject && selectedObject.type === 'image' ? (
            <>
              <button className="primary" onClick={() => addTextToImage('Title')}>Add Title</button>
              <button onClick={() => addTextToImage('Subtitle')}>Add Subtitle</button>
              <button onClick={() => addTextToImage()}>Add Text</button>
              <button onClick={() => duplicateSelected()}>Duplicate</button>
              <button onClick={() => alignCenter()}>Align Center</button>
              <button onClick={() => bringForward()}>Bring Forward</button>
              <button onClick={() => sendBackward()}>Send Back</button>
              <button onClick={() => toggleLockSelected()}>{(selectedObject && selectedObject.lockMovementX) ? 'Unlock' : 'Lock'}</button>
              <button onClick={() => deleteSelected()}>Delete</button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
 }
 export default Edit;

