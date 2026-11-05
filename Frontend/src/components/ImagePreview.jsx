import React, { useState, useEffect, useRef } from "react";
import Draggable from "react-draggable";
import axios from "axios";
import { BASE_URL } from "../url";
import styles from "./ImagePreview.module.css";

const resolveFrameUrl = (frame) => {
  const path = frame?.framePath || frame;
  if (!path) return "";
  if (String(path).startsWith("http")) return path;
  if (String(path).startsWith("/")) return `${BASE_URL}${path}`;
  return `${BASE_URL}/${path}`;
};

const ImagePreview = ({ imageUrl, frames = [], onClose }) => {
  const [profile, setProfile] = useState(null);
  const [selectedImage, setSelectedImage] = useState(imageUrl || null);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [showText, setShowText] = useState(true);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const frameRef = useRef(null);

  // ✅ Fetch Profile Data (for name, position, etc.)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/profiles/me`, {
          withCredentials: true,
        });
        setProfile(res.data.profile);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // ✅ Handle Frame Select
  const handleFrameSelect = (frameUrl) => {
    setSelectedFrame(frameUrl);
  };

  // ✅ Download merged image (canvas merge without html2canvas)
  const handleDownload = () => {
    if (!selectedImage) {
      alert("Please select an image first!");
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = imageRef.current;
    const frame = frameRef.current;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // Base image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Overlay frame
    if (frame) ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

    // Overlay text if visible
    if (showText && profile) {
      ctx.font = "bold 40px Poppins";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";

      if (profile.visibleName && profile.name)
        ctx.fillText(profile.name, canvas.width / 2, canvas.height - 100);
      if (profile.showPosition && profile.positionname)
        ctx.fillText(profile.positionname, canvas.width / 2, canvas.height - 40);
    }

    // Download the canvas as image
    const link = document.createElement("a");
    link.download = "preview_image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Preview Image</h2>
        <button onClick={onClose} className={styles.closeBtn}>
          ✕
        </button>
      </div>

      {/* ✅ Frame Selection */}
      <div className={styles.frames}>
        <p>Select Frame:</p>
        {frames && frames.length > 0 ? (
          frames.map((frame, index) => (
            <img
              key={index}
              src={resolveFrameUrl(frame)}
              alt="frame"
              className={`${styles.frameOption} ${
                selectedFrame === resolveFrameUrl(frame) ? styles.selectedFrame : ""
              }`}
              onClick={() => handleFrameSelect(resolveFrameUrl(frame))}
            />
          ))
        ) : (
          <p>No frames found for this category.</p>
        )}
      </div>

      {/* ✅ Toggle Text */}
      <div className={styles.toggle}>
        <label>
          <input
            type="checkbox"
            checked={showText}
            onChange={() => setShowText(!showText)}
          />
          Show Text
        </label>
      </div>

      {/* ✅ Preview Section */}
      <div className={styles.previewWrapper}>
        {selectedImage ? (
          <div className={styles.previewArea}>
            <img
              ref={imageRef}
              src={selectedImage}
              alt="Selected"
              className={styles.previewImage}
            />
            {selectedFrame && (
              <img
                ref={frameRef}
                src={selectedFrame}
                alt="Frame"
                className={styles.frameOverlay}
              />
            )}

            {showText && profile && (
              <>
                {profile.visibleName && profile.name && (
                  <Draggable>
                    <p className={styles.draggableText}>{profile.name}</p>
                  </Draggable>
                )}
                {profile.showPosition && profile.positionname && (
                  <Draggable>
                    <p className={styles.draggableTextSmall}>
                      {profile.positionname}
                    </p>
                  </Draggable>
                )}
              </>
            )}
          </div>
        ) : (
          <p className={styles.placeholder}>Select an image to preview</p>
        )}
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ✅ Download Button */}
      {selectedImage && (
        <button onClick={handleDownload} className={styles.downloadBtn}>
          Download Preview Image
        </button>
      )}
    </div>
  );
};

export default ImagePreview;
