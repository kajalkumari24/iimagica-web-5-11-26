import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BASE_URL } from '../url';
import styles from './AdminManageDesign.module.css';

const AdminDesignUpload = () => {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('banners');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [designs, setDesigns] = useState([]);

  const categories = [
    'banners', 'website', 'logo', 'visiting card', 'digital card', 'templates'
  ];

  useEffect(() => {
    const fetchDesigns = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/designs/category/${category}`);
        setDesigns(res.data);
      } catch (error) {
        console.error("Error fetching designs", error);
      }
    };
    fetchDesigns();
  }, [category]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select an image to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      setLoading(true);
      setMessage('');
      const res = await axios.post(`${BASE_URL}/api/designs/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      setMessage('Design uploaded successfully!');
      setFile(null);
      setDesigns((prev) => [...prev, res.data.design]); 
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading design');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this design?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/designs/${id}`, { withCredentials: true });
      setDesigns((prev) => prev.filter(design => design._id !== id));
      setMessage('Design deleted successfully!');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error deleting design');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.pageTitle}>Manage Designs</h2>
          <p className={styles.subtitle}>Upload and manage images for various design categories.</p>
        </div>
      </div>
      
      <form onSubmit={handleUpload} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Design Category</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className={styles.formInput}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Upload Image</label>
          <input 
            type="file" 
            onChange={(e) => setFile(e.target.files[0])} 
            accept="image/*" 
            className={styles.formInput}
          />
        </div>

        <button type="submit" disabled={loading} className={styles.addBtn}>
          {loading ? 'Uploading...' : 'Upload Design'}
        </button>
      </form>

      {message && <p style={{ color: message.includes('Error') ? 'red' : 'green', fontWeight: 'bold' }}>{message}</p>}

      <div className={styles.imageGrid}>
        {designs.map((design) => (
          <div key={design._id} className={styles.imageCard}>
            <div className={styles.imageContainer}>
              <img src={design.url} alt={design.category} />
            </div>
            <div className={styles.cardFooter}>
                <button onClick={() => handleDelete(design._id)} className={styles.deleteBtn}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {designs.length === 0 && <p className={styles.noData}>No designs uploaded in this category yet.</p>}
    </div>
  );
};

export default AdminDesignUpload;