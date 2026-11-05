import React, { useEffect, useState } from "react"; 
import axios from "axios";
import Sidebar from "./Sidebar";
import { useNavigate } from "react-router-dom"; // ✅ import
import styles from "./ImageCustom.module.css";
import { BASE_URL } from "../url";
//  import { BASE_URL } from "./url"; // ✅ Add this line
const API_URL = `${BASE_URL}/api/images`;

// Only these categories will be shown
const allowedCategories = ["Upcoming Events", "Navratri Festival"];

const ImageCustom = () => {
  const [categories, setCategories] = useState([]);
  const [imagesByCategory, setImagesByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState("");

  const navigate = useNavigate(); // ✅ useNavigate hook

  const fetchCategories = async () => {
    const res = await axios.get(API_URL, { withCredentials: true });
    const filtered = res.data.filter((category) =>
      allowedCategories.includes(category)
    );
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
    // Navigate to Edit page and send the image data
    navigate("/edit", { state: { image: img.url } });
  };

  if (loading) return <p className={styles.loadingText}>Loading...</p>;

  return (
    <div className={styles.container}>
    <div style={{ display: "flex" }}>
      <Sidebar selected={selectedOption} onSelect={setSelectedOption} />

      <div style={{ marginLeft: "240px", padding: "20px", flex: 1 }}>
        <h1>{selectedOption}</h1>

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
                  onClick={() => handleImageClick(img)} // ✅ click navigates to Edit
                  style={{ cursor: "pointer" }} // optional, pointer cursor
                />
              ))}
              {imagesByCategory[category]?.length === 0 && (
                <p>No images available</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
    </div>
  );
};

export default ImageCustom;
