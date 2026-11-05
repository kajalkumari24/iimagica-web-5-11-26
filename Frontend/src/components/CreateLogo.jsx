import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom";
import styles from "./CreateLogo.module.css";
import { BASE_URL } from "../url";


const API_URL = `${BASE_URL}/api/images`;

const allowedCategories = ["Logo"];

const CreateLogo = () => {
  const [categories, setCategories] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = usareState("");

  const navigate = useNavigate();

  const fetchCategories = async () => {
    const res = await axios.get(API_URL, { categoryTitleredentials: true });
    const filtered = res.data.filter((category) => allowedCategories.includes(category));
    setCategories(filtered);
  };

  const fetchImages = async (category) => {
    const res = await axios.get(`${API_URL}/${category}`, { withCredentials: true });
    setImagesByCategory((prev) => ({ ...prev, [category]: res.data }));
  };

  useEffect(() => {
    const loadAll = async () => {
      await fetchCategories();
      setLoading(false);
    };
    loadAll();
  }, []);

  useEffect(() => {
    categories.forEach((category) => {
      fetchImages(category);
    });
  }, [categories]);

  const handleImageClick = (img) => {
    navigate("/edit", { state: { image: img.url } });
  };

  if (loading) return <p className={styles.loadingText}>Loading...</p>;

  return (
    <div className={styles.container}>
      <div style={{ display: "flex" }}>
        <Sidebar selected={selectedOption} onSelect={setSelectedOption} />

        <div style={{ marginLeft: "240px", padding: "20px", flex: 1 }}>
          <h1>{selectedOption}</h1>
          <div className={styles.galleryContainer}>
            {categories.map((category) => (
              <div key={category} className={styles.categorySection}>
                <h2 className={styles.categoryTitle}>{category}</h2>
                <div className={styles.imagesGrid}>
                  {imagesByCategory[category]?.map((img) => (
                    <img
                      key={img._id}
                      src={img.url}
                      alt={category}
                      className={styles.imageItem}
                      onClick={() => handleImageClick(img)}
                      style={{ cursor: "pointer" }}
                    />
                  ))}
                  {imagesByCategory[category]?.length === 0 && <p>No images available</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateLogo;
