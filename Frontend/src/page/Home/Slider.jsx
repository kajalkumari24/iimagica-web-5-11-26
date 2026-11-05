import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BASE_URL } from '../../url';

const categoryImagesCache = {}; // Global cache for slider images
const SKELETON_DELAY_MS = 1000;

const getSliderImageUrl = (item, category) =>
  item.images?.[0]?.url ||
  item.images?.[0] ||
  item.url ||
  "https://via.placeholder.com/300x200?text=" + encodeURIComponent(category);

const buildDisplayItems = (images = [], categoryFestivals = []) => {
  let result = [];

  images.forEach(item => {
    if (Array.isArray(item.images) && item.images.length > 0) {
      item.images.forEach(img => {
        result.push({
          ...item,
          url: typeof img === "string" ? img : img.url,
        });
      });
    } else if (item.url) {
      result.push(item);
    }
  });

  if (categoryFestivals.length > 0 && result.length < 5) {
    categoryFestivals.forEach(item => {
      if (Array.isArray(item.images) && item.images.length > 0) {
        item.images.forEach(img => {
          result.push({
            ...item,
            url: typeof img === "string" ? img : img.url,
          });
        });
      } else if (item.url) {
        result.push(item);
      }
    });
  }

  return result;
};

const preloadSliderImages = (items, category) => {
  const urls = [...new Set(items.map(item => getSliderImageUrl(item, category)).filter(Boolean))];

  return Promise.all(
    urls.map(url => new Promise((resolve) => {
      const image = new Image();
      image.onload = resolve;
      image.onerror = resolve;
      image.src = url;
    }))
  );
};

const Sliders = ({ category, title, festivals = [] }) => {
  const navigate = useNavigate();
  const [images, setImages] = useState(categoryImagesCache[category] || []);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollable, setIsScrollable] = useState(false);

  const sliderRef = useRef(null);
  const scrollTickingRef = useRef(false);
  const isRestoringRef = useRef(true);
  const lastXRef = useRef(null);

  const updateScrollIndicator = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const totalScrollable = scrollWidth - clientWidth;
    setIsScrollable(totalScrollable > 0);
    if (totalScrollable > 0) {
      const progress = (scrollLeft / totalScrollable) * 100;
      setScrollProgress(progress);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    lastXRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    lastXRef.current = null;
  };

  const handleMouseMove = (e) => {
    if (lastXRef.current === null) {
      lastXRef.current = e.clientX;
      return;
    }
    const dx = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;

    if (dx !== 0 && sliderRef.current) {
      sliderRef.current.scrollLeft += dx * 1.5;
    }
  };

  const categoryFestivals = useMemo(() => festivals.filter(fest =>
    fest.festivalName?.toLowerCase().includes(category.toLowerCase()) ||
    fest.linkedCategory?.toLowerCase() === category.toLowerCase()
  ), [category, festivals]);



  // const displayItems = categoryFestivals.length > 0 
  // ? categoryFestivals 
  // : images;

  const displayItems = useMemo(() => buildDisplayItems(images, categoryFestivals), [categoryFestivals, images]);

  const handleCardClick = (item) => {
    // Use festival category if available, otherwise use linkedCategory or default category
    const targetCategory = item.festivalName || item.linkedCategory || category;

    navigate(`/image-view/${encodeURIComponent(targetCategory)}`, {
      state: {
        selectedImage: item.url || item.images?.[0]?.url || item.images?.[0],
        category: targetCategory,  // Pass festival category
        festivalName: item.festivalName || title,
        festivalCategory: targetCategory,  // Extra: explicit festival category
      },
    });
  };

  useEffect(() => {
    let cancelled = false;

    const fetchImages = async () => {
      setIsLoading(true);

      try {
        let newImages = categoryImagesCache[category];

        if (!newImages) {
          const res = await axios.get(`${BASE_URL}/api/images/category/${category}`, { withCredentials: true });
          newImages = res.data || [];
          categoryImagesCache[category] = newImages;
        }

        if (cancelled) return;

        setImages(newImages);
        const nextDisplayItems = buildDisplayItems(newImages, categoryFestivals);

        await Promise.all([
          preloadSliderImages(nextDisplayItems, category),
          new Promise(resolve => setTimeout(resolve, SKELETON_DELAY_MS))
        ]);
      } catch (err) {
        console.error("Error fetching images:", err);
        setImages([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchImages();

    return () => {
      cancelled = true;
    };
  }, [category, categoryFestivals]);

  // Save horizontal scroll position
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (isRestoringRef.current) return;
      updateScrollIndicator();
      if (scrollTickingRef.current) return;
      scrollTickingRef.current = true;
      requestAnimationFrame(() => {
        if (sliderRef.current) {
          sessionStorage.setItem(`sliderScrollX_${category}`, sliderRef.current.scrollLeft);
        }
        scrollTickingRef.current = false;
      });
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [category, isLoading]);

  // Restore horizontal scroll position
  useEffect(() => {
    if (!isLoading && displayItems.length > 0) {
      const saved = sessionStorage.getItem(`sliderScrollX_${category}`);
      if (saved && sliderRef.current) {
        setTimeout(() => {
          if (sliderRef.current) {
            sliderRef.current.scrollLeft = Number(saved);
            updateScrollIndicator();
          }
          setTimeout(() => { isRestoringRef.current = false; }, 50);
        }, 50);
        return;
      }
      isRestoringRef.current = false;
      setTimeout(updateScrollIndicator, 100);
    }
  }, [isLoading, displayItems.length, category]);

  if (isLoading) {
    return (
      <div className="my-0">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="h-7 bg-slate-200 rounded w-1/3 animate-pulse" />
          <div className="h-6 bg-slate-200 rounded w-16 animate-pulse" />
        </div>
        <div className="flex gap-6 overflow-hidden pb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[90px] h-[120px] sm:w-[130px] sm:h-[170px] md:w-[160px] md:h-[200px] lg:w-[230px] lg:h-[220px] flex-shrink-0 bg-slate-200 animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }


  // The outer isLoading block has been removed so that we render the same UI structure (including title and slider buttons) while showing skeleton cards inside the slider track.

  return (
    <div className="my-0">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-6 px-2">
        {/* <h2 className="text-3xl font-bold text-slate-900 ml-[-41px]">
          {title || category}
        </h2> */}

        <h2 className="text-[15px] sm:text-xl font-poppins font-medium text-slate-800">
          {title || category}
        </h2>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();

            if (!category) {
              // console.log("Category missing ❌");
              return;
            }

            const safeCategory = encodeURIComponent(category);
            // console.log("Navigating to:", safeCategory);

            navigate(`/category/${safeCategory}`);
          }}
          className="relative z-10 text-[#F11C6B] hover:text-[#d4105a] font-medium flex items-center gap-2 text-sm sm:text-lg transition-colors"
        >
          More
          <span className='text-xl font-bold'>→</span>
        </button>
      </div>



      {/* Horizontal Scrollable Slider */}
      <div className="relative">

        <div
          ref={sliderRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            willChange: 'scroll-position',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: isHovered ? 'none' : 'x mandatory'
          }}
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-[85px] h-[110px] sm:w-[130px] sm:h-[170px] md:w-[160px] md:h-[200px] lg:w-[230px] lg:h-[220px] flex-shrink-0 bg-slate-200 animate-pulse rounded-xl"
              />
            ))
          ) : displayItems.length > 0 ? (
            displayItems.map((item, index) => {
              const imageUrl = getSliderImageUrl(item, category);

              return (
                <div
                  key={index}
                  onClick={() => handleCardClick(item)}

                  className="
w-[85px] h-[110px] 
sm:w-[130px] sm:h-[170px] 
md:w-[160px] md:h-[200px] 
lg:w-[230px] lg:h-[220px] 
flex-shrink-0 
bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl transition-all duration-300 snap-start group
"

                >
                  {/* Image */}
                  <div className="relative w-full h-full overflow-hidden bg-slate-100">
                    <img
                      src={imageUrl}
                      alt={item.festivalName || category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 opacity-0 md:opacity-100"
                      onLoad={(e) => e.target.classList.remove('opacity-0')}
                      loading={index < 4 ? "eager" : "lazy"}
                      fetchpriority={index < 4 ? "high" : "auto"}
                      decoding="async"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                        e.target.classList.remove('opacity-0');
                      }}
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                    {/* View Overlay like CategoryPage */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
                        View
                      </div>
                    </div>

                    {/* Date Badge */}
                    {item.festivalDate && (
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-slate-700 text-xs font-bold px-3 py-1 rounded-full shadow">
                        {new Date(item.festivalDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  {/* <div className="p-5">
                    <h3 className="font-semibold text-[21px] -mt-1.5 text-slate-800 line-clamp-2 group-hover:text-violet-700 transition-colors">
                      {item.festivalName || title}
                    </h3>
                    
                    <p className="text-gray-500 text-[12px] mt-1 line-clamp-2">
                      {item.description || `Beautiful templates for ${category}`}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-medium text-violet-600 bg-violet-100 px-3 py-1 rounded-full">
                        {category}
                      </span>
                      <span className="text-slate-400 cursor-pointer text-[10px]">Explore →</span>
                    </div>
                  </div> */}
                </div>
              );
            })
          ) : (
            // Placeholder Cards jab koi festival na ho
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="min-w-[280px] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm"
              >
                <div className="h-56 bg-slate-100 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No templates yet</span>
                </div>
                <div className="p-5">
                  <div className="h-5 bg-slate-100 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-full mb-4" />
                  <div className="h-8 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Centered Scroll Indicator */}
      {isScrollable && (
        <div className="flex justify-center mt-3">
          <div className="w-16 h-1 bg-slate-200 rounded-full relative">
            <div
              className="h-full bg-[#F11C6B] rounded-full absolute left-0 top-0 transition-all duration-75"
              style={{
                width: '30%',
                left: `${scrollProgress * 0.7}%`
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Sliders;
