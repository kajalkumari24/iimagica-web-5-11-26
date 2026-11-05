import React, { useEffect, useState } from 'react';
import axios from '../../axiosConfig';
import { BASE_URL } from '../../url';
import styles from '../MyProfile.module.css';
import socket from '../../socket';

const ProfileTypeFields = ({
  profileType,
  setProfileType,
  formData,
  handleChange,
  setFormData,
  onProfileTypeChange,

  professionalTypes,
}) => {
  const [partyList, setPartyList] = useState([]);
  const [professionalList, setProfessionalList] = useState([]);
  const [brandList, setBrandList] = useState([]);

  useEffect(() => {
    // Fetch all three from unified API
    axios.get(`${BASE_URL}/api/profile-types/political`)
      .then((res) => setPartyList(res.data?.data || []))
      .catch(() => {});

    axios.get(`${BASE_URL}/api/profile-types/professional`)
      .then((res) => setProfessionalList(res.data?.data || []))
      .catch(() => {});

    axios.get(`${BASE_URL}/api/profile-types/brand`)
      .then((res) => setBrandList(res.data?.data || []))
      .catch(() => {});
  }, []);

  // Real-time: refresh dropdowns when admin updates profile types
  useEffect(() => {
    const handler = ({ type } = {}) => {
      if (!type || type === 'political')
        axios.get(`${BASE_URL}/api/profile-types/political`)
          .then((res) => setPartyList(res.data?.data || [])).catch(() => {});
      if (!type || type === 'professional')
        axios.get(`${BASE_URL}/api/profile-types/professional`)
          .then((res) => setProfessionalList(res.data?.data || [])).catch(() => {});
      if (!type || type === 'brand')
        axios.get(`${BASE_URL}/api/profile-types/brand`)
          .then((res) => setBrandList(res.data?.data || [])).catch(() => {});
    };
    socket.on('profileTypeUpdated', handler);
    return () => socket.off('profileTypeUpdated', handler);
  }, []);
  return (
    <div className={styles.formSection}>
      <div className={styles.sectionTitle}>🎯 Profile Type</div>

      <div className={styles.formRow + ' ' + styles.single}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Select Profile Type</label>
          <select
            name="profileType"
            value={profileType}
            onChange={(e) => {
                const lowerCaseValue = e.target.value.toLowerCase();
                const previous = (profileType || "").toString().toLowerCase();
                setProfileType(lowerCaseValue);
                setFormData((prev) => ({ ...prev, profileType: lowerCaseValue }));
                if (typeof onProfileTypeChange === "function") onProfileTypeChange(lowerCaseValue, previous);
              }}
            required
            className={`${styles.profileInput} ${styles.customSelect}`}
          >
            <option value="">Select Profile Type</option>
            <option value="business">Business</option>
            <option value="political">Political</option>
            <option value="professional">Professional</option>
            <option value="brand">Brands</option>
            <option value="personal">Personal</option>
            <option value="social">Social Work</option>
          </select>
        </div>
      </div>

      {profileType === "professional" && (
        <>
          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Professional Type <span style={{color:'#c00'}}>*</span></label>
              <select
                name="categories"
                value={formData.categories || ""}
                onChange={handleChange}
                className={`${styles.profileInput} ${styles.customSelect}`}
                disabled={formData.showCategories === false}
                required
              >
                <option value="">Select Professional Type</option>
                {(professionalList.length > 0 ? professionalList : professionalTypes || []).map((type, idx) => (
                    <option key={type._id || idx} value={type.name || type}>
                      {type.name || type}
                    </option>
                  ))}
              </select>
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
              <label className={styles.formLabel}>Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName || ""}
                onChange={handleChange}
                placeholder="Your business name"
                className={styles.profileInput}
                disabled={formData.showBusinessName === false}
              />
              <div style={{ marginTop: '8px' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.showBusinessName ?? true}
                    onChange={(e) => setFormData((prev) => ({ ...prev, showBusinessName: e.target.checked }))}
                  />
                  <span>Show business name</span>
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
                value={formData.designation || ""}
                onChange={handleChange}
                placeholder="Your role/title"
                className={styles.profileInput}
                disabled={formData.showDesignation === false}
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
                value={formData.website || ""}
                onChange={handleChange}
                placeholder="Your website www.example.com"
                className={styles.profileInput}
                disabled={formData.showWebsite === false}
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
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="Street address"
                className={styles.profileInput}
                disabled={formData.showAddress === false}
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
        </>
      )}

      {profileType === "personal" && (
        <>
          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Short Bio</label>
              <textarea
                name="bio"
                value={formData.bio || ""}
                onChange={handleChange}
                placeholder="A short bio about yourself"
                className={styles.profileInput}
                rows={3}
              />
            </div>
          </div>

          <div className={styles.formRow + ' ' + styles.single}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.showBio ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, showBio: e.target.checked }))}
              />
              <span>Show bio</span>
            </label>
          </div>

          {/* Birthdate and Gender removed from Personal block (handled globally) */}

          

          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Website (optional)</label>
              <input
                type="text"
                name="website"
                value={formData.website || ""}
                onChange={handleChange}
                placeholder="Personal website or portfolio"
                className={styles.profileInput}
                disabled={formData.showWebsite === false}
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
                  value={formData.address || ""}
                  onChange={handleChange}
                  placeholder="Street address"
                  className={styles.profileInput}
                  disabled={formData.showAddress === false}
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
        </>
      )}

      {profileType === "social" && (
        <>
          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Organization / Party Name</label>
              <input
                type="text"
                name="organization"
                value={formData.organization || formData.partyname || ""}
                onChange={handleChange}
                placeholder="Organization name"
                className={styles.profileInput}
              />
            </div>
          </div>

          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Website</label>
              <input
                type="text"
                name="website"
                value={formData.website || ""}
                onChange={handleChange}
                placeholder="Your website www.example.com"
                className={styles.profileInput}
                disabled={formData.showWebsite === false}
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
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="Office / org address"
                className={styles.profileInput}
                disabled={formData.showAddress === false}
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
        </>
      )}

      {profileType === "political" && (
        <>
          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Party / Organization Name <span style={{color:'#c00'}}>*</span></label>
              <select
                name="partyname"
                value={formData.partyname || ""}
                onChange={handleChange}
                className={`${styles.profileInput} ${styles.customSelect}`}
                required
              >
                <option value="">Select Party</option>
                {partyList.length > 0 ? (
                  partyList.map((p) => (
                    <option key={p._id || p.name} value={p.name}>{p.name}</option>
                  ))
                ) : (
                  <option disabled value="">Loading parties...</option>
                )}
              </select>
            </div>
          </div>

          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Position / Role</label>
              <input
                type="text"
                name="positionname"
                value={formData.positionname || ""}
                onChange={handleChange}
                placeholder="Your role in the party"
                className={styles.profileInput}
                disabled={formData.showPosition === false}
              />
            </div>
          </div>
          <div className={styles.formRow + ' ' + styles.single}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.showPosition ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, showPosition: e.target.checked }))}
              />
              <span>Show position</span>
            </label>
          </div>

          {/* Website removed for political profiles per requirement */}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="Office / party address"
                className={styles.profileInput}
                disabled={formData.showAddress === false}
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
        </>
      )}

      {profileType === "brand" && (
        <>
          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Brand Name <span style={{color:'#c00'}}>*</span></label>
              <select
                name="brandName"
                value={formData.brandName || ""}
                onChange={handleChange}
                className={`${styles.profileInput} ${styles.customSelect}`}
                required
              >
                <option value="">Select Brand</option>
                {brandList.length > 0 ? (
                  brandList.map((b) => (
                    <option key={b._id || b.name} value={b.name}>{b.name}</option>
                  ))
                ) : (
                  <option disabled value="">Loading brands...</option>
                )}
              </select>
            </div>
          </div>

          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Designation / Role</label>
              <input
                type="text"
                name="designation"
                value={formData.designation || ""}
                onChange={handleChange}
                placeholder="Your role in the brand"
                className={styles.profileInput}
              />
            </div>
          </div>

          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Website</label>
              <input
                type="text"
                name="website"
                value={formData.website || ""}
                onChange={handleChange}
                placeholder="Brand website"
                className={styles.profileInput}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="Brand address"
                className={styles.profileInput}
              />
            </div>
          </div>
        </>
      )}

      {profileType === "business" && (
        <>
          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName || ""}
                onChange={handleChange}
                placeholder="Your business name"
                className={styles.profileInput}
                disabled={formData.showBusinessName === false}
              />
            </div>
          </div>
          <div className={styles.formRow + ' ' + styles.single}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.showBusinessName ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, showBusinessName: e.target.checked }))}
              />
              <span>Show business name</span>
            </label>
          </div>

          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation || ""}
                onChange={handleChange}
                placeholder="Your designation"
                className={styles.profileInput}
                disabled={formData.showDesignation === false}
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

          {/* <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Business Tagline</label>
              <input
                type="text"
                name="businessTagline"
                value={formData.businessTagline || ""}
                onChange={handleChange}
                placeholder="Short tagline for your business"
                className={styles.profileInput}
                disabled={formData.showBusinessTagline === false}
              />
            </div>
          </div>
          <div className={styles.formRow + ' ' + styles.single}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.showBusinessTagline ?? true}
                onChange={(e) => setFormData((prev) => ({ ...prev, showBusinessTagline: e.target.checked }))}
              />
              <span>Show tagline</span>
            </label>
          </div> */}

          <div className={styles.formRow + ' ' + styles.single}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Website</label>
              <input
                type="text"
                name="website"
                value={formData.website || ""}
                onChange={handleChange}
                placeholder="Your website www.example.com"
                className={styles.profileInput}
                disabled={formData.showWebsite === false}
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
                value={formData.address || ""}
                onChange={handleChange}
                placeholder="Business address"
                className={styles.profileInput}
                disabled={formData.showAddress === false}
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
        </>
      )}
    </div>
  );
};

export default ProfileTypeFields;
