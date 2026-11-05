import React from 'react';
import styles from '../MyProfile.module.css';

const Location = ({ formData, handleChange }) => {
  return (
    <div className={styles.formSection}>
      <div className={styles.sectionTitle}> Location</div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>City</label>
          <input 
            type="text" 
            name="city" 
            value={formData.city || ""} 
            onChange={handleChange} 
            placeholder="City" 
            className={styles.profileInput} 
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>State</label>
          <input 
            type="text" 
            name="state" 
            value={formData.state || ""} 
            onChange={handleChange} 
            placeholder="State" 
            className={styles.profileInput} 
          />
        </div>
      </div>
    </div>
  );
};

export default Location;
