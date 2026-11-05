import React from 'react';
import styles from '../MyProfile.module.css';

const PersonalInfo = ({ formData, handleChange, setFormData, phoneLocked = false }) => {
  const handleMobileChange = (e) => {
    if (phoneLocked) return;

    const onlyNums = e.target.value.replace(/[^0-9]/g, '');
    if (onlyNums.length <= 10) {
      setFormData((prev) => ({ ...prev, mobile: onlyNums }));
    }
  };

  return (
    <div className={styles.formSection}>
      <div className={styles.sectionTitle}>👤 Personal Information</div>

      <div className={styles.formRow + ' ' + styles.single}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name || ""}
            onChange={handleChange}
            placeholder="Enter your full name"
            className={styles.profileInput}
            disabled={formData.visibleName === false}
          />
          <div style={{ marginTop: '8px' }}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.showMobile ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, showMobile: e.target.checked }))}
              />
              <span>Show phone in preview</span>
            </label>
          </div>
        </div>
      </div>

      <div className={styles.formRow + ' ' + styles.single}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={formData.visibleName ?? true}
            onChange={(e) => setFormData((prev) => ({ ...prev, visibleName: e.target.checked }))}
          />
          <span>Make name visible to others</span>
        </label>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Email</label>
          <input 
            type="email" 
            name="email" 
            value={formData.email || ""} 
            onChange={handleChange} 
            placeholder="Email" 
            className={styles.profileInput} 
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Phone</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              name="mobile"
              value={formData.mobile || ""}
              onChange={handleMobileChange}
              placeholder="Contact number"
              className={styles.profileInput}
              maxLength="10"
              pattern="\d{10}"
              disabled={phoneLocked}
            />
          </div>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Fax No</label>
          <input
            type="text"
            name="fax"
            value={formData.fax || ""}
            onChange={handleChange}
            placeholder="Fax Number"
            className={styles.profileInput}
          />
        </div>
        <div className={styles.formGroup} style={{ alignSelf: 'flex-end', paddingBottom: '10px' }}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={formData.showFax ?? true}
              onChange={(e) => setFormData((prev) => ({ ...prev, showFax: e.target.checked }))}
            />
            <span>Show fax in preview</span>
          </label>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Gender</label>
          <select 
            name="gender" 
            value={formData.gender || ""} 
            onChange={handleChange} 
            className={styles.profileInput}
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Religion</label>
          <select 
            name="religion" 
            value={formData.religion || ""} 
            onChange={handleChange} 
            className={styles.profileInput}
          >
            <option value="">Select Religion</option>
            <option value="Hinduism">Hinduism</option>
            <option value="Islam">Islam</option>
            <option value="Christianity">Christianity</option>
            <option value="Sikhism">Sikhism</option>
            <option value="Buddhism">Buddhism</option>
            <option value="Jainism">Jainism</option>
            <option value="Judaism">Judaism</option>
            <option value="Zoroastrianism">Zoroastrianism</option>
            <option value="Other">Other</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow + ' ' + styles.single}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Birth Date</label>
          <input 
            type="date" 
            name="birthDate" 
            value={formData.birthDate ? formData.birthDate.split("T")[0] : ""} 
            onChange={handleChange} 
            className={styles.profileInput} 
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
