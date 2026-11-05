import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./Calendar.module.css"; // ✅ CSS module import
import { BASE_URL } from "./url";
const API_KEY = "inz2qs5FnlC6TMc6ERUX7dUDaIRAX0SY"; // Calendarific API key
const UNSPLASH_KEY = "PadUIujMzXpLBy7oHTqMQzZtjozFQH-Ge9cyjnBrxpo"; // Unsplash API key
const COUNTRY_CODE = "IN"; // India

const Calendar = ({ onClose }) => {
  const navigate = useNavigate();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [festivals, setFestivals] = useState([]);
  const [modalFestival, setModalFestival] = useState(null);

  const scrollRef = useRef(null);

  const normalizeFestivalImageUrl = (value) => {
    if (!value) return "";
    const raw = String(value).trim();
    if (!raw) return "";
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    return `${BASE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  const getFirstFestivalImageUrl = (festival) => {
    if (!festival?.images?.length) return "";
    const first = festival.images[0];
    if (typeof first === "string") return normalizeFestivalImageUrl(first);
    if (first && typeof first === "object") return normalizeFestivalImageUrl(first.url || first.secure_url);
    return "";
  };

  // ✅ Fetch Festivals
  useEffect(() => {
    const fetchFestivals = async () => {
      try {
        // Get festivals from combined API
        const festivalsRes = await axios.get(`${BASE_URL}/api/festivals/combined`, { withCredentials: true });
        const allFestivals = Array.isArray(festivalsRes.data) ? festivalsRes.data : [];
        
        // Fetch images for festivals without strict category filtering
        const festivalsWithImages = await Promise.all(
          allFestivals.map(async (f) => {
            let img = getFirstFestivalImageUrl(f);
            if (!img) {
              img = await fetchFestivalImage(f.festivalName || f.name);
            }
            return {
              name: f.festivalName || f.name,
              date: { iso: f.festivalDate },
              image_url: img,
              source: f.source || 'local',
              linkedCategory: f.linkedCategory
            };
          })
        );
        
        setFestivals(festivalsWithImages);
      } catch (error) {
        console.error("Error fetching festival data:", error);
      }
    };

    fetchFestivals();
  }, [currentYear]);

  // ✅ Fetch Festival Image from Unsplash
  const fetchFestivalImage = async (festivalName) => {
    try {
      const res = await axios.get(`https://api.unsplash.com/search/photos`, {
        params: { query: festivalName, per_page: 1 },
        headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
      });

      if (res.data.results.length > 0) {
        return res.data.results[0].urls.small;
      }
      return "https://via.placeholder.com/150"; // fallback
    } catch (err) {
      console.error("Image fetch error:", err);
      return "https://via.placeholder.com/150";
    }
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // ✅ Filter festivals of selected month
  const festivalsOfTheMonth = festivals.filter((f) => {
    const festivalDate = new Date(f.date.iso);
    return festivalDate.getMonth() === currentMonth && festivalDate.getFullYear() === currentYear;
  });

  // ✅ Scroll handler
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div 
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 10000, overflowY: 'auto', padding: '20px' }} 
      onClick={onClose}
    >
      <div className={styles.calendarContainer} style={{ width: '100%', maxWidth: '1000px', margin: '40px auto', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose} 
          className={styles.closeOverlayBtn}
        >
          &times;
        </button>
      <div className={styles.calendarHeader}>
        <button onClick={handlePrevMonth}>&lt;</button>
        <h2>
          {new Date(currentYear, currentMonth).toLocaleString("default", {
            month: "long",
          })}{" "}
          {currentYear}
        </h2>
        <button onClick={handleNextMonth}>&gt;</button>
      </div>

      {/* ✅ Festival images for selected month */}
      {festivalsOfTheMonth.length > 0 ? (
        <div className={styles.festivalImages}>
          <h3>
            Festivals in{" "}
            {new Date(currentYear, currentMonth).toLocaleString("default", {
              month: "long",
            })}
            :
          </h3>
          <div className={styles.festivalList} ref={scrollRef}>
            {festivalsOfTheMonth.map((f, i) => {
              const festivalName = f.name || f.festivalName;
              return (
                <div
                  key={i}
                  className={styles.festivalCard}
                  onClick={() => {
                    const encoded = encodeURIComponent(festivalName);
                    navigate(`/category/${encoded}`, {
                      state: { category: festivalName, isFestival: true },
                    });
                  }}
                >
                  <img src={f.image_url} alt={festivalName} />
                  <p>{festivalName}</p>
                </div>
              );
            })}
          </div>
          <div className={styles.scrollButtons}>
            <button onClick={() => scroll("left")}>◀</button>
            <button onClick={() => scroll("right")}>▶</button>
          </div>
        </div>
      ) : (
        <p>No festivals found for this month.</p>
      )}

      {modalFestival && (
        <div className={styles.modal} onClick={() => setModalFestival(null)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{modalFestival.name || modalFestival.festivalName}</h2>
            <img src={modalFestival.image_url} alt={modalFestival.name || modalFestival.festivalName} />
            <button 
              onClick={() => {
                const festivalName = modalFestival.name || modalFestival.festivalName;
                const encoded = encodeURIComponent(festivalName);
                navigate(`/category/${encoded}`, {
                  state: { category: festivalName, isFestival: true },
                });
              }}
              className={styles.viewTemplatesBtn}
            >
              View Templates
            </button>
            <button onClick={() => setModalFestival(null)}>Close</button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Calendar;
