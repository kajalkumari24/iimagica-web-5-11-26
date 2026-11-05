import React from 'react';
import styles from '../MyProfile.module.css';

// ProfessionalFields: isolated professional-only UI block
// Props:
// - formData: object
// - handleChange: input change handler (event)
// - setFormData: setter for custom toggles
// - disabled: optional boolean to disable inputs
const ProfessionalFields = ({ formData = {}, handleChange, setFormData, disabled = false }) => {
  return (
    <div className={styles.formSection}>
      <div className={styles.sectionTitle}>💼 Professional</div>

      <div className={styles.formRow + ' ' + styles.single}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Categories</label>
          <input
            type="text"
            name="categories"
            value={Array.isArray(formData.categories) ? formData.categories.join(', ') : (formData.categories || '')}
            onChange={(e) => {
              // convert comma-separated string to array
              const v = e.target.value;
              const arr = String(v).split(',').map(s => s.trim()).filter(Boolean);
              // store both raw and array-safe
              setFormData((prev) => ({ ...prev, categories: arr }));
            }}
            placeholder="e.g. Technology, Finance"
            className={styles.profileInput}
            disabled={disabled || formData.showCategories === false}
          />
          <div style={{ marginTop: '8px' }}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.showCategories ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, showCategories: e.target.checked }))}
              />
              <span>Show categories</span>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.formRow + ' ' + styles.single}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Designation</label>
          <input
            type="text"
            name="designation"
            value={formData.designation || ''}
            onChange={handleChange}
            placeholder="Your role / title"
            className={styles.profileInput}
            disabled={disabled || formData.showDesignation === false}
          />
        </div>
      </div>
      <div className={styles.formRow + ' ' + styles.single}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.showDesignation ?? true}
            onChange={(e) => setFormData((prev) => ({ ...prev, showDesignation: e.target.checked }))}
          />
          <span>Show designation</span>
        </label>
      </div>

      <div className={styles.formRow + ' ' + styles.single}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Website</label>
          <input
            type="text"
            name="website"
            value={formData.website || ''}
            onChange={handleChange}
            placeholder="Professional website"
            className={styles.profileInput}
            disabled={disabled || formData.showWebsite === false}
          />
        </div>
      </div>
      <div className={styles.formRow + ' ' + styles.single}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.showWebsite ?? true}
            onChange={(e) => setFormData((prev) => ({ ...prev, showWebsite: e.target.checked }))}
          />
          <span>Show website</span>
        </label>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            placeholder="Street address"
            className={styles.profileInput}
            disabled={disabled || formData.showAddress === false}
          />
        </div>
      </div>
      <div className={styles.formRow + ' ' + styles.single}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.showAddress ?? true}
            onChange={(e) => setFormData((prev) => ({ ...prev, showAddress: e.target.checked }))}
          />
          <span>Show address</span>
        </label>
      </div>
    </div>
  );
};

export default ProfessionalFields;
