import React, { useState } from "react";
import styles from "./ImageEditor.module.css";
import { Link } from "react-router-dom";

const frames = [
  null,
  "/frame1.png",
  "/frame2.png",
  "/frame3.png",
  "/frame4.png",
  "/frame5.jpg",
  "/frame6.jpg"
];

const ImageEditor = ({ image, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [frame, setFrame] = useState(null);
  const [showFrames, setShowFrames] = useState(false);

  // ✅ Download with format
  const downloadImage = async (format = "png") => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;

    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (frame) {
        const frameImg = new Image();
        frameImg.crossOrigin = "anonymous";
        frameImg.src = frame;
        frameImg.onload = () => {
          ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
          exportFile(format, canvas);
        };
      } else {
        exportFile(format, canvas);
      }
    };
  };

  const exportFile = async (format, canvas) => {
    if (format === "pdf") {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      pdf.addImage(canvas.toDataURL("image/jpeg"), "JPEG", 10, 10, 180, 160);
      pdf.save("image.pdf");
    } else {
      const link = document.createElement("a");
      link.href = canvas.toDataURL(`image/${format}`);
      link.download = `image.${format}`;
      link.click();
    }
  };

return (
  <div className={styles.modalOverlay}>
    <div className={styles.modalContent}>


      {/* Modal body: Sidebar + Image */}
      <div className={styles.modalBody}>
        {/* Sidebar buttons */}
        {!isEditing && (
          <div className={styles.sidebarActions}>
            <Link to="/edit" state={{ image }} className={styles.sidebarBtn}>
              Edit
            </Link>
            <button className={styles.sidebarBtn} onClick={() => setShowFrames(!showFrames)}>
              Add Frames
            </button>
            <button className={styles.sidebarBtn} onClick={() => downloadImage("jpg")}>
              Download JPG
            </button>
            <button className={styles.sidebarBtn} onClick={() => downloadImage("png")}>
              Download PNG
            </button>
            <button className={styles.sidebarBtn} onClick={() => downloadImage("pdf")}>
              Download PDF
            </button>
          </div>
        )}

        {/* Preview image */}
        <div className={styles.previewBox}>
          <img src={image} alt="Selected" className={styles.modalImage} />
          {frame && <img src={frame} alt="Frame" className={styles.frameOverlay} style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            pointerEvents: "none"
          }} />}
          <span className={styles.closeBtn} onClick={onClose}>✖</span>
        </div>
      </div>

      {/* Frames scroller */}
      {showFrames && (
        <div 
          className={styles.framesScroller}
          onScroll={() => setShowFrames(false)}
          onWheel={() => setShowFrames(false)}
        >
          <div className={styles.framesContainer}>
            {frames.map((frameOption, index) => (
              <div 
                key={index} 
                className={`${styles.frameItem} ${frame === frameOption ? styles.activeFrame : ''}`}
                style={{
                  width: 170,
                  height: 170,
                  minHeight: 170,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 8,
                  overflow: "hidden"
                }}
                onClick={() => {
                  setFrame(frameOption);
                  setShowFrames(false);
                }}
              >
                {frameOption ? (
                  <img
                    src={frameOption}
                    alt={`Frame ${index}`}
                    className={styles.framePreview}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block"
                    }}
                  />
                ) : (
                  <div className={styles.noFrame}>No Frame</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default ImageEditor;
