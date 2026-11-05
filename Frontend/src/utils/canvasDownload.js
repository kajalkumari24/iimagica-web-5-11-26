// Load image helper (shared) - with debug logging
const loadImage = (src, label = '') => {
  console.log(`🔄 Loading ${label || 'image'}:`, src);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      console.log(`✅ Loaded ${label || 'image'}:`, src);
      resolve(img);
    };
    img.onerror = (err) => {
      console.error(`❌ Failed to load ${label || 'image'}:`, src, err);
      reject(new Error(`Image load failed: ${src}`));
    };
    img.src = src;
  });
};

/**
 * Perfect pixel export for ImageView preview state
 * Matches DOM preview exactly: base → userimg → texts+icons → frame
 */
export const exportImageViewCanvas = async ({
  baseImage,
  frameImage,
  uploadedImage,
  imagePos = { left: 20, top: 20 },
  imageSize = { width: 80, height: 80 },
  textFields = [], // {label, key, dragLeft, dragTop, fontSize, fontColor, fontFamily, fontWeight, iconSrc?, hasReactIcon?, iconSize, fittedFontPx}
  previewWidth = 330,
  previewHeight = 415,
  filename = 'profile_image',
  format = 'png'
}) => {
  const canvas = document.createElement('canvas');
  canvas.width = previewWidth;
  canvas.height = previewHeight;
  const ctx = canvas.getContext('2d');

  try {
    // 1. Base image (full size)
    if (baseImage) {
      const baseImg = await loadImage(baseImage);
      ctx.drawImage(baseImg, 0, 0, previewWidth, previewHeight);
    }

    // 2. User uploaded image (position + size from preview state)
    if (uploadedImage && imagePos) {
      const userImg = await loadImage(uploadedImage);
      ctx.drawImage(
        userImg,
        imagePos.left,
        imagePos.top,
        imageSize.width,
        imageSize.height
      );
    }

    // 3. Text fields + icons (exact preview positions/sizes)
    for (const field of textFields) {
      const { dragLeft = 0, dragTop = 0, label, fontSize, fontColor, fontFamily, fontWeight, iconSrc, iconGlyph, renderedIconPx = 0 } = field;
      
      const x = Math.round(dragLeft);
      const iconCenterY = Math.round(dragTop + renderedIconPx / 2);
      
      // Icon first (img or glyph)
      if (iconSrc) {
        const iconImg = await loadImage(iconSrc);
        ctx.drawImage(iconImg, x, dragTop, renderedIconPx, renderedIconPx);
      } else if (iconGlyph) {
        ctx.font = `${fontWeight} ${Math.round(renderedIconPx * 0.9)}px ${fontFamily}`;
        ctx.fillStyle = fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(iconGlyph, x + renderedIconPx / 2, iconCenterY);
        ctx.textAlign = 'left'; // reset
      }

      // Text next to icon (horizontal alignment)
      if (label) {
        ctx.fillStyle = fontColor || '#fff';
        ctx.font = `${fontWeight || 'normal'} ${fontSize}px ${fontFamily || 'Poppins, sans-serif'}`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        
        const textX = x + renderedIconPx + 4; // icon + gap
        ctx.fillText(label, textX, iconCenterY); // perfect center alignment
      }
    }

    // 4. Frame overlay (top layer)
    if (frameImage) {
      const frameImg = await loadImage(frameImage);
      ctx.drawImage(frameImg, 0, 0, previewWidth, previewHeight);
    }

    // 5. Export
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpg' ? 'jpg' : 'png';
    const dataUrl = canvas.toDataURL(mimeType, format === 'jpg' ? 0.95 : 1.0);
    
    const link = document.createElement('a');
    link.download = `${filename}.${ext}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return dataUrl;
  } catch (err) {
    console.error('Canvas export failed:', err);
    throw err;
  }
};

// Backward compatible original
export const generateCanvasImage = async ({
  baseImage,
  frameImage,
  uploadedImage,
  imagePos,
  imageSize,
  textItems
}) => {
  await exportImageViewCanvas({
    baseImage,
    frameImage,
    uploadedImage,
    imagePos,
    imageSize: imageSize || { width: 80, height: 80 },
    textFields: textItems.map(item => ({
      label: item.text,
      fontSize: parseInt(item.fontSize || 14),
      fontColor: item.color,
      fontWeight: item.fontWeight,
      iconSrc: item.icon,
      dragLeft: item.x,
      dragTop: item.y
    })),
    filename: 'image'
  });
};
