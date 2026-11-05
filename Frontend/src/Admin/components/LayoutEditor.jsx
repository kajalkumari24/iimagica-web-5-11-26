import React from 'react';
import styles from '../ManageFrames.module.css';
import { FaInstagram, FaFacebook, FaLinkedin, FaTwitter } from "react-icons/fa";

const iconBase = (import.meta && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : "/";
const normalizeBase = (b) => (b && b.endsWith("/")) ? b : `${b || "/"}/`;
const socialIconMap = {
  instagram: `${normalizeBase(iconBase)}icons/instagram.png`,
  facebook: `${normalizeBase(iconBase)}icons/facebook.png`,
  linkedin: `${normalizeBase(iconBase)}icons/linkedin.png`,
  twitter: `${normalizeBase(iconBase)}icons/twitter.png`,
};

const getSocialIconSrc = (key) => socialIconMap[String(key || "").toLowerCase()] || null;

const SocialFieldIcon = ({ fieldKey, size = 14 }) => {
  const [imgError, setImgError] = React.useState(false);
  const key = String(fieldKey || "").toLowerCase();
  const src = getSocialIconSrc(fieldKey);
  const fallbackIcon =
    key === "instagram" ? <FaInstagram style={{ color: "#E4405F", width: size, height: size }} /> :
    key === "facebook" ? <FaFacebook style={{ color: "#1877F2", width: size, height: size }} /> :
    key === "linkedin" ? <FaLinkedin style={{ color: "#0A66C2", width: size, height: size }} /> :
    key === "twitter" ? <FaTwitter style={{ color: "#1DA1F2", width: size, height: size }} /> :
    null;
  if (!src || imgError) return fallbackIcon;
  return (
    <img
      src={src}
      alt={`${fieldKey} icon`}
      style={{ width: size, height: size, minWidth: size, minHeight: size, display: "block", objectFit: "contain" }}
      onError={() => setImgError(true)}
    />
  );
};

// Reusable layout editor
// Props:
// - fields: array of { key, label }
// - layout: object
// - onChange: function(fieldKey, key, value)
const LayoutEditor = ({ fields = [], layout = {}, onChange = () => {} }) => {
  return (
    <div>
      {fields.map((field) => (
        <div key={field.key} className={styles.layoutGroup} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <SocialFieldIcon fieldKey={field.key} />
            {field.label} Layout
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Top (px)"
              value={layout[field.key]?.top || ''}
              onChange={(e) => onChange(field.key, 'top', e.target.value)}
            />
            <input
              type="text"
              placeholder="Left (px)"
              value={layout[field.key]?.left || ''}
              onChange={(e) => onChange(field.key, 'left', e.target.value)}
            />
            <input
              type="text"
              placeholder="Width (px)"
              value={layout[field.key]?.width || ''}
              onChange={(e) => onChange(field.key, 'width', e.target.value)}
            />
            <input
              type="text"
              placeholder="Height (px)"
              value={layout[field.key]?.height || ''}
              onChange={(e) => onChange(field.key, 'height', e.target.value)}
            />
          </div>

          {field.key !== 'photo' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Font Size (px)"
                value={layout[field.key]?.fontSize || ''}
                onChange={(e) => onChange(field.key, 'fontSize', e.target.value)}
              />
              <input
                type="color"
                value={layout[field.key]?.fontColour || '#000000'}
                onChange={(e) => onChange(field.key, 'fontColour', e.target.value)}
                style={{ width: 50, height: 30, borderRadius: 6 }}
              />
              <input
                type="text"
                placeholder="Sample Text"
                value={layout[field.key]?.sampleText || ''}
                onChange={(e) => onChange(field.key, 'sampleText', e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                value={layout[field.key]?.fontWeight || 'normal'}
                onChange={(e) => onChange(field.key, 'fontWeight', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="bolder">Bolder</option>
                <option value="lighter">Lighter</option>
              </select>
              <select
                value={layout[field.key]?.fontFamily || ''}
                onChange={(e) => onChange(field.key, 'fontFamily', e.target.value)}
                style={{ minWidth: 130 }}
              >
                <option value="">Default Font</option>
                <option value="Arial">Arial</option>
                <option value="Verdana">Verdana</option>
                <option value="Georgia">Georgia</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Impact">Impact</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Palatino">Palatino</option>
              </select>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default LayoutEditor;
