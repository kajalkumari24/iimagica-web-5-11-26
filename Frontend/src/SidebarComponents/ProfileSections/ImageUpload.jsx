import React from 'react';
import styles from '../MyProfile.module.css';

const ImageUpload = ({
  profile = {},
  file,
  handleFileChange,
  isImageProcessing = false,
  handleRemoveBackground,
  handleDeleteImage,
  formData = {},
  setFormData,
}) => {
  const fileUrl = profile.fileUrl || formData.fileUrl || null;
  const publicId = formData.public_id || formData.cloudinary_id || profile.public_id || profile.cloudinary_id || '';
  let filename = '';
  if (file && file.name) filename = file.name;
  else if (fileUrl) {
    try {
      filename = decodeURIComponent((fileUrl || '').split('/').pop() || '');
    } catch (e) {
      filename = (fileUrl || '').split('/').pop() || '';
    }
  }

  return (
    <div className={styles.uploadSection}>
      <label htmlFor="fileInput" className={styles.uploadBox} title="Click to upload profile image">
        {fileUrl ? (
          <img src={fileUrl} alt="Profile preview" className={styles.profileImage} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
            <div className={styles.uploadLabel}>Click to upload<br />your photo</div>
          </div>
        )}
      </label>

      <input
        id="fileInput"
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange?.(e)}
        className={styles.uploadInput}
        aria-label="Upload profile image"
        disabled={isImageProcessing}
      />

      {fileUrl && (
        <div style={{ marginTop: 8 }}>
          <div className={styles.imagePreviewMeta}>
            <div style={{ fontSize: 12, color: '#666' }}>{filename}</div>
            {publicId ? <div style={{ fontSize: 12, color: '#666' }}>id: {publicId}</div> : null}
          </div>

          <div className={styles.imageActions} style={{ marginTop: 8 }}>
            <button
              type="button"
              onClick={() => handleRemoveBackground?.()}
              className={styles.actionBtn}
              disabled={isImageProcessing}
              title="Remove background"
            >
              {isImageProcessing ? 'Processing...' : '✨ Remove BG'}
            </button>

            <button
              type="button"
              onClick={() => handleDeleteImage?.()}
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              disabled={isImageProcessing}
              title="Delete image"
            >
              {isImageProcessing ? 'Working...' : '🗑️ Delete Image'}
            </button>
          </div>

            <label className={styles.showImageCheckbox} style={{ display: 'block', marginTop: 8 }}>
              <input
                type="checkbox"
                name="showProfileImage"
                checked={formData.showProfileImage ?? true}
                onChange={(e) => setFormData?.((prev) => ({ ...prev, showProfileImage: e.target.checked }))}
              />
              <span style={{ marginLeft: 8 }}>Show in Preview</span>
            </label>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
