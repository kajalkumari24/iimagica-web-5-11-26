
import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./DownloadButton.css";
import { BASE_URL } from "../url";

const DownloadButton = ({ targetRef, onDownload }) => {
  const [format, setFormat] = useState("png");


const handleDownload = async () => {
  if (!targetRef?.current) return;

  try {
    let hasFeedback = false;

    try {
      const res = await fetch(`${BASE_URL}/api/feedback/check-feedback`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        hasFeedback = data.hasFeedback ?? false;
      }
    } catch (error) {
      console.warn("Feedback check failed:", error);
    }

    const el = targetRef.current;

    // 🧩 Clone element to prevent reflow shifts
    const clone = el.cloneNode(true);
    clone.style.width = "360px";
    clone.style.height = "450px";
    clone.style.transform = "none";
    clone.style.scale = "1";
    clone.style.position = "fixed";
    clone.style.top = "-9999px";
    clone.style.left = "-9999px";
    document.body.appendChild(clone);

    // ✨ Capture (perfect scale balance)
    const canvas = await html2canvas(clone, {
      useCORS: true,
      backgroundColor: null,
      scale: 2, // ⚖️ Balanced clarity, no huge file, no text drift
      scrollX: 0,
      scrollY: 0,
      logging: false,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
    });

    document.body.removeChild(clone); // 🧹 clean up clone

    // 🧠 Download in chosen format
    if (format === "png" || format === "jpg") {
      const link = document.createElement("a");
      link.download = `profile_with_frame.${format}`;
      link.href = canvas.toDataURL(`image/${format}`);
      link.click();
    } else if (format === "pdf") {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        canvas.width / 2,
        canvas.height / 2
      );
      pdf.save("profile_with_frame.pdf");
    }

    if (!hasFeedback) onDownload();
  } catch (err) {
    console.error("Download error:", err);
    alert("Something went wrong while downloading!");
  }
};


  return (
    <div>
      <div className="format-buttons">
        <button
          className={`format-btn ${format === "png" ? "active" : ""}`}
          onClick={() => setFormat("png")}
        >
          PNG
        </button>
        <button
          className={`format-btn ${format === "jpg" ? "active" : ""}`}
          onClick={() => setFormat("jpg")}
        >
          JPG
        </button>
        <button
          className={`format-btn ${format === "pdf" ? "active" : ""}`}
          onClick={() => setFormat("pdf")}
        >
          PDF
        </button>
      </div>

      <button className="download-btn" onClick={handleDownload}>
        Download ({format.toUpperCase()})
      </button>
    </div>
  );
};

export default DownloadButton;
