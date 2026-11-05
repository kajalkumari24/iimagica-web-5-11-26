// downloadHelper.js
// Draws the preview wrapper onto a canvas manually for pixel-perfect icon+text alignment

const PREVIEW_W = 330;
const PREVIEW_H = 415;
const EXPORT_SCALE = 3;

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

export const downloadPreviewAsCanvas = async (previewEl) => {
  if (!previewEl) return null;

  const rect = previewEl.getBoundingClientRect();
  const W = rect.width || PREVIEW_W;
  const H = rect.height || PREVIEW_H;
  const S = EXPORT_SCALE;

  const canvas = document.createElement('canvas');
  canvas.width = W * S;
  canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);

  // 1. Draw base image
  const baseImg = previewEl.querySelector('[data-preview-role="base-image"]') ||
    previewEl.querySelector('img.basePreviewImage') ||
    previewEl.querySelector('img:first-child');
  if (baseImg && baseImg.src) {
    const loaded = await loadImage(baseImg.src);
    if (loaded) ctx.drawImage(loaded, 0, 0, W, H);
  }

  // 2. Draw uploaded profile image
  const uploadedImg = previewEl.querySelector('[data-preview-role="uploaded-profile-image"]') ||
    previewEl.querySelector('.uploadedDraggable') ||
    previewEl.querySelector('img[alt="User"]');
  if (uploadedImg && uploadedImg.src) {
    const loaded = await loadImage(uploadedImg.src);
    if (loaded) {
      const s = uploadedImg.style;
      const x = parseFloat(s.left) || 0;
      const y = parseFloat(s.top) || 0;
      const w = parseFloat(s.width) || 80;
      const h = parseFloat(s.height) || 80;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.drawImage(loaded, x, y, w, h);
      ctx.restore();
    }
  }

  // 3. Draw frame overlay
  const frameImg = previewEl.querySelector('[data-preview-role="frame-image"]') ||
    previewEl.querySelector('img.frameOverlay') ||
    previewEl.querySelector('img[alt="Frame"]');
  if (frameImg && frameImg.src) {
    const loaded = await loadImage(frameImg.src);
    if (loaded) ctx.drawImage(loaded, 0, 0, W, H);
  }

  // 4. Draw text+icon fields
  const textDivs = previewEl.querySelectorAll('[data-label]');
  for (const div of textDivs) {
    const divStyle = window.getComputedStyle(div);
    const x = parseFloat(div.style.left) || 0;
    const y = parseFloat(div.style.top) || 0;
    const fontSize = parseFloat(divStyle.fontSize) || 14;
    const fontWeight = divStyle.fontWeight || 'normal';
    const fontFamily = divStyle.fontFamily || 'Poppins, sans-serif';
    const color = divStyle.color || '#000000';
    const label = div.getAttribute('data-label') || '';

    ctx.save();
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';

    // Check for icon img inside div
    const iconImg = div.querySelector('img');
    let iconDrawn = false;
    let iconW = 0;

    if (iconImg && iconImg.src && iconImg.style.display !== 'none') {
      const loadedIcon = await loadImage(iconImg.src);
      if (loadedIcon) {
        iconW = parseFloat(iconImg.style.width) || Math.round(fontSize * 0.9);
        const iconH = parseFloat(iconImg.style.height) || iconW;
        const iconY = y + fontSize / 2 - iconH / 2;
        ctx.drawImage(loadedIcon, x, iconY, iconW, iconH);
        iconDrawn = true;
      }
    }

    const textX = iconDrawn ? x + iconW + 3 : x;
    const textY = y + fontSize / 2 + 1;
    ctx.fillText(label, textX, textY);
    ctx.restore();
  }

  return canvas;
};

export const triggerDownload = (canvas, format, category) => {
  if (!canvas) return;
  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const ext = format === 'jpg' ? 'jpg' : 'png';
  const link = document.createElement('a');
  link.download = `${category}_preview.${ext}`;
  link.href = canvas.toDataURL(mimeType, 0.95);
  link.click();
};
