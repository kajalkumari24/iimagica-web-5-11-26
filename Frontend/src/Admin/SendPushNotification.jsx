import React, { useState, useEffect, useRef } from 'react';
import styles from './SendPushNotification.module.css';
import { FaPaperPlane, FaBell, FaTimes, FaImage } from 'react-icons/fa';
import adminApi from '../utils/adminApi';
import { VITE_FCM_TEST_TOKEN } from "../url";

const PROFILE_TYPE_OPTIONS = [
  { value: "global", label: "Global (All Users)" },
  { value: "business", label: "Business" },
  { value: "professional", label: "Professional" },
  { value: "personal", label: "Personal" },
  { value: "political", label: "Political" },
  { value: "social", label: "Social" },
  { value: "brand", label: "Brand" },
];

function SendPushNotification() {
  const [form, setForm] = useState({
    token: VITE_FCM_TEST_TOKEN || '',
    title: '',
    body: '',
    category: '',
    targetProfileType: 'global',
    coverImage: null
  });
  const [isTestMode, setIsTestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPreview, setShowPreview] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [dbParties, setDbParties] = useState([]);
  const [dbProfessionalTypes, setDbProfessionalTypes] = useState([]);
  const [dbBrandTypes, setDbBrandTypes] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchProfileTypes = async () => {
      try {
        const [partiesRes, profRes, brandRes] = await Promise.all([
          adminApi.get('/api/profile-types/political'),
          adminApi.get('/api/profile-types/professional'),
          adminApi.get('/api/profile-types/brand')
        ]);
        setDbParties(partiesRes.data?.data || partiesRes.data || []);
        setDbProfessionalTypes(profRes.data?.data || profRes.data || []);
        setDbBrandTypes(brandRes.data?.data || brandRes.data || []);
      } catch (err) {
        console.warn('Could not fetch profile types:', err);
      }
    };
    fetchProfileTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      setForm({ ...form, coverImage: files[0] });
      setPreviewSrc(URL.createObjectURL(files[0]));
    } else {
      if (name === 'targetProfileType') {
        setForm({ ...form, targetProfileType: value, category: '' });
      } else {
        setForm({ ...form, [name]: value });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('desc', form.body); // Backend expects 'desc' instead of 'body'
      formData.append('targetProfileType', form.targetProfileType);
      if (form.category) formData.append('category', form.category);
      if (form.coverImage) formData.append('coverImage', form.coverImage); // Backend expects 'coverImage'
      if (isTestMode && form.token) formData.append('token', form.token);

      // Automatically append current date and time (required by notification model)
      const now = new Date();
      formData.append('date', now.toISOString().split('T')[0]);
      formData.append('time', now.toTimeString().split(' ')[0].substring(0, 5));
      
      // Tell backend to trigger FCM Broadcast
      formData.append('sendPush', 'true');

      await adminApi.post('/api/notifications', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      setMessage({ text: 'Notification sent successfully!', type: 'success' });
      setShowPreview(true);
      setForm({ token: VITE_FCM_TEST_TOKEN || '', title: '', body: '', category: '', targetProfileType: 'global', coverImage: null });
      setPreviewSrc(null);
      setTimeout(() => setShowPreview(false), 5000);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to send notification', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <FaBell className={styles.headerIcon} />
          <div>
            <h2 className={styles.title}>Broadcast Push Notification</h2>
            <p className={styles.subtitle}>Send target-based FCM notifications to app users</p>
          </div>
        </div>
      </div>

      <div className={styles.contentGrid}>
        <form onSubmit={handleSubmit} className={styles.form}>

          <div className={styles.formGroup}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#0f766e', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              🧪 Test on Specific Device (Overrides Profile Type)
            </label>
          </div>

          {isTestMode && (
            <div className={styles.formGroup} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #94a3b8' }}>
              <label>FCM Token</label>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                When a token is provided, the push notification will be sent ONLY to this device. Profile Type targeting will be ignored.
              </p>
              <input
                type="text"
                name="token"
                value={form.token || ''}
                onChange={handleChange}
                placeholder="Enter FCM device token"
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label>Notification Title *</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter notification title"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Notification Body *</label>
            <textarea
              name="body"
              value={form.body}
              onChange={handleChange}
              placeholder="Enter notification message"
              rows="4"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Profile Type Target</label>
            <select name="targetProfileType" value={form.targetProfileType} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
              {PROFILE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Category (Optional)</label>
            {form.targetProfileType === 'political' ? (
              <select name="category" value={form.category} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <option value="">Select Political Party (Optional)</option>
                {dbParties.map(p => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
              </select>
            ) : form.targetProfileType === 'professional' ? (
              <select name="category" value={form.category} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <option value="">Select Profession (Optional)</option>
                {dbProfessionalTypes.map(p => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
              </select>
            ) : form.targetProfileType === 'brand' ? (
              <select name="category" value={form.category} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                <option value="">Select Brand (Optional)</option>
                {dbBrandTypes.map(p => <option key={p._id || p.name} value={p.name}>{p.name}</option>)}
              </select>
            ) : (
              <input type="text" name="category" placeholder="Category (optional)" value={form.category} onChange={handleChange} />
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Cover Image (Optional)</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleChange} style={{ display: 'none' }} />
              <button type="button" onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{ padding: '8px 16px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaImage /> Choose Image
              </button>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {form.coverImage ? form.coverImage.name : 'No file chosen'}
              </span>
            </div>
          </div>

          {message.text && (
            <div className={`${styles.message} ${styles[message.type]}`}>
              {message.text}
            </div>
          )}

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <FaPaperPlane />
            )}
            <span>{loading ? 'Sending...' : 'Send Notification'}</span>
          </button>
        </form>

        <div className={styles.previewSection}>
          <h3 className={styles.previewTitle}>Preview</h3>
          <div className={styles.phoneFrame}>
            <div className={styles.phoneNotch}></div>
            <div className={styles.phoneScreen}>
              {form.title || form.body || previewSrc ? (
                <div className={styles.notificationCard}>
                  <div className={styles.notifHeader}>
                    <FaBell className={styles.notifIcon} />
                    <span className={styles.appName}>Imagica</span>
                    <span className={styles.notifTime}>now</span>
                  </div>
                  {previewSrc && (
                    <img src={previewSrc} alt="Preview" className={styles.notifImage} />
                  )}
                  <div className={styles.notifContent}>
                    <div className={styles.notifTitle}>{form.title || 'Notification Title'}</div>
                    <div className={styles.notifBody}>{form.body || 'Message body text'}</div>
                  </div>
                </div>
              ) : (
                <div className={styles.emptyPreview}>
                  <FaBell size={40} />
                  <p>Fill the form to preview notification</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPreview && (
        <div className={styles.webNotification}>
          <div className={styles.webNotifCard}>
            <button className={styles.webNotifClose} onClick={() => setShowPreview(false)}>
              <FaTimes />
            </button>
            <div className={styles.webNotifHeader}>
              <FaBell className={styles.webNotifIcon} />
              <span className={styles.webNotifApp}>Imagica</span>
            </div>
            {previewSrc && (
              <img src={previewSrc} alt="" className={styles.webNotifImage} />
            )}
            <div className={styles.webNotifTitle}>{form.title}</div>
            <div className={styles.webNotifBody}>{form.body}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SendPushNotification;
