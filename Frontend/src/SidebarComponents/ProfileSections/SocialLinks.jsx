import React from 'react';
import styles from '../MyProfile.module.css';

const SocialLinks = ({ formData, handleChange, setFormData, shouldShow }) => {

  const isSelected = (field) => {
    if (typeof shouldShow !== "function") return true;
    return shouldShow(field);
  };

  const getStyle = (field) => ({
    opacity: isSelected(field) ? 1 : 0.4,
    pointerEvents: isSelected(field) ? "auto" : "none",
  });

  const renderField = (label, name, placeholder, showKey) => (
    <div style={getStyle(name)}>
      <div className={styles.formRow + ' ' + styles.single}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            {label} {!isSelected(name) && "(Discarded)"}
          </label>
          <input
            type="text"
            name={name}
            value={formData[name] || ""}
            onChange={handleChange}
            placeholder={placeholder}
            className={styles.profileInput}
            disabled={showKey && formData[showKey] === false}
          />
        </div>
      </div>

      {/* toggle for all socials */}
      {showKey && (
        <div className={styles.formRow + ' ' + styles.single}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData[showKey] ?? true}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  [showKey]: e.target.checked,
                }))
              }
            />
            <span>Show {label}</span>
          </label>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.formSection}>
      <div className={styles.sectionTitle}>🔗 Social Links</div>

      {renderField("Instagram", "social_instagram", "Instagram URL", "showInstagram")}
      {renderField("LinkedIn", "social_linkedin", "LinkedIn URL", "showLinkedIn")}
      {renderField("Facebook", "social_facebook", "Facebook URL", "showFacebook")}
      {renderField("Twitter", "social_twitter", "Twitter URL", "showTwitter")}

      {renderField("Snapchat", "social_snapchat", "Snapchat username", "showSnapchat")}
      {renderField("YouTube", "social_youtube", "YouTube channel", "showYouTube")}
      {renderField("Telegram", "social_telegram", "Telegram username", "showTelegram")}
      {renderField("Discord", "social_discord", "Discord username / link", "showDiscord")}
    </div>
  );
};

export default SocialLinks;
