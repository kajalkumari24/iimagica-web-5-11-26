import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../url";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

// Import Slide Images
import banners1 from "../../assets/banners1.png";
import bannersimg from "../../assets/bannersimg.png";
import Web_Templates from "../../assets/Web_Templates.png";
import first1 from "../../assets/first1.png";

const sliderImages = [banners1, bannersimg, Web_Templates, first1];

const Blob = ({ className, style }) => (
  <div
    className={`absolute rounded-full ${className}`}
    style={style}
  />
);

export default function Banners() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showCarousel, setShowCarousel] = useState(false);
  const [blink, setBlink] = useState(true);
  const [bannersData, setBannersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let blinkCount = 0;
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
      blinkCount++;
      if (blinkCount >= 2) {
        clearInterval(interval);
        setBlink(true);
        setShowCarousel(true);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);



  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setLoading(true);
        const [bannerRes, profileRes] = await Promise.allSettled([
          axios.get(`${BASE_URL}/api/design-library/banners`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/profiles/me`, { withCredentials: true }),
        ]);

        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value.data?.profile || profileRes.value.data || null);
        }
        const data = bannerRes.status === "fulfilled" ? (bannerRes.value.data?.data || bannerRes.value.data || []) : [];
        setBannersData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleBuyNow = (item) => {
    if (!profile) {
      toast.info("Please log in to buy a design.");
      navigate("/LoginPage", { state: { returnUrl: location.pathname } });
      return;
    }

    const phoneNumber = "918435204953";

    const userDetails = `*User Details:*\nName: ${profile.name || "N/A"}\nEmail: ${profile.email || "N/A"
      }\nMobile: ${profile.mobile || "N/A"}`;

    const designDetails = `*Design to Buy:*\nTitle: "${item.title || "Banner"}"\nCategory: "${item.category || "General"
      }"\nPrice: ₹${item.price || "0"}\nImage URL: ${getImageUrl(item.imageUrl)}`;

    const message = `Hello, I want to buy a banner design.\n\n${userDetails}\n\n${designDetails}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="w-full bg-white">
      <div className="service-hero min-h-screen relative overflow-hidden flex flex-col items-center justify-start bg-white pt-10 pb-12 px-6">
        <Blob
          className="banner-blob-1 w-[200px] h-[200px] top-10 left-10 animate-[float_12s_ease-in-out_infinite]"
          style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }}
        />
        <Blob
          className="banner-blob-2 w-[220px] h-[220px] top-3 right-20 animate-[float_14s_ease-in-out_infinite]"
          style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }}
        />
        <Blob
          className="banner-blob-3 w-[180px] h-[180px] bottom-20 left-150 animate-[float_10s_ease-in-out_infinite]"
          style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }}
        />
        <Blob
          className="banner-blob-4 w-[220px] h-[220px] bottom-10 right-10 animate-[float_16s_ease-in-out_infinite]"
          style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }}
        />

        {/* Title positioned at top 10% on screen / with top padding */}
        <h1
          className="service-heading font-poppins relative z-10 text-center text-4xl md:text-5xl lg:text-7xl  font-semibold pb-6 transition-opacity duration-200 mt-3"
          style={{ opacity: blink ? 1 : 0 }}
        >
          <span className="relative inline-block pb-2 overflow-hidden">
            <span
              className="
                bg-[linear-gradient(135deg,#EFA076_0%,#F66D2B_30%,#EF2F85_100%)] 
                bg-[length:200%_200%]
                bg-clip-text text-transparent
                animate-[gradientMove_6s_linear_infinite]
              "
            >
              Banners
            </span>
          </span>
        </h1>

        {/* Two-Column Grid */}
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10 py-6 lg:-mt-[22px]">
          {/* Left Column: Text Content */}
          <div className="flex flex-col items-start text-left space-y-8">
            {/* <div className="text-sm md:text-base font-bold tracking-widest uppercase">
              <span className="bg-gradient-to-r from-[#F66D2B] to-[#EF2F85] bg-clip-text text-transparent">
                Designed to Represent Built to Impress
              </span>
            </div> */}

            <h2 className="text-3xl md:text-6xl font-poppins font-semibold text-gray-900 leading-tight">
              <span className="block">Stunning Banners</span>
              <span className="block lg:mt-[7px] bg-gradient-to-r from-[#F66D2B] to-[#EF2F85] bg-clip-text text-transparent">
                Boost Visibility
              </span>
            </h2>

            <p className="text-gray-600 font-poppins text-sm md:text-base leading-relaxed max-w-lg">
              Make a statement with professional banner designs tailored for your promotional campaigns, social media, events, and offline marketing. Explore a wide collection of high-quality banner templates designed to enhance your brand visibility and communicate your message effectively. Our impactful graphics help increase engagement, attract attention, and support better marketing results across both digital and print platforms
            </p>

            <button
              onClick={() => {
                const target = document.getElementById("product-grid-section");
                if (target) {
                  target.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-[#F10D64] to-[#F56930] hover:opacity-90 text-white font-semibold rounded-lg transition-all font-poppins shadow-[0_4px_14px_rgba(241,13,100,0.3)] hover:scale-[1.02] cursor-pointer"
            >
              Explore Banner Collection
            </button>
          </div>

          {/* Right Column: Rotating Images Slideshow */}
          <div className="flex justify-center items-center relative w-full h-[280px] sm:h-[350px] md:h-[400px] z-10">
            <div className="relative w-full max-w-[450px] aspect-[4/3] flex items-center justify-center overflow-hidden hover:scale-[1.01] transition-transform duration-300">
              <img
                src={bannersimg}
                alt="Banner Showcase"
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>

      {showCarousel && (
        <>
          {/* Slogan Banner */}
          <div className="w-full max-w-7xl mx-auto px-6 mb-8 mt-12 relative z-10 text-center">
            <h2 className="text-2xl md:text-4xl font-poppins font-extrabold pb-2 bg-gradient-to-r from-[#F66D2B] to-[#EF2F85] bg-clip-text text-transparent">
              Big Presence Bigger Impact Every Time
            </h2>
            <p className="text-gray-500 font-poppins text-xs sm:text-sm md:text-base font-medium max-w-2xl mx-auto mt-2">
              Promote your business with graphics that stand out from the crowd and reach your target audience.
            </p>
          </div>

          {/* Grid Section */}
          <div id="product-grid-section" className="service-grid-wrap relative z-10 w-full max-w-8xl mx-auto py-8 px-4 sm:px-6 lg:px-12">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F10D64]"></div>
              </div>
            ) : bannersData.length === 0 ? (
              <div className="text-center py-20 text-gray-500 text-lg">
                No banners found.
              </div>
            ) : (
              <div className="service-banner-grid grid gap-8 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
                {bannersData.map((item, index) => (
                  <div
                    key={item._id || index}
                    onClick={() => setSelectedItem(item)}
                    className="service-banner-card group w-full max-w-[340px] mx-auto bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] overflow-hidden flex flex-col cursor-pointer"
                  >
                    <div className="service-banner-image w-full h-48 sm:h-56 md:h-60 lg:h-60 p-2 flex items-center justify-center bg-gray-50/50 overflow-hidden">
                      <img
                        src={getImageUrl(item.imageUrl || "")}
                        alt={item.title || "Banner"}
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>

                    <div className="service-banner-card-body p-4 border-t border-gray-100 flex flex-col justify-between bg-white flex-grow">
                      <div>
                        <h3 className="service-banner-title text-base font-bold text-gray-900 truncate" title={item.title}>
                          {item.title || "Untitled Banner"}
                        </h3>
                        <p className="service-banner-category text-sm text-gray-500 mt-1 truncate" title={item.category}>
                          {item.category || "General"}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="service-banner-price text-lg font-black text-gray-900">
                          ₹{item.price ? Number(item.price).toLocaleString("en-IN") : "0"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyNow(item);
                          }}
                          className="service-banner-buy px-4 py-2 bg-gradient-to-r from-[#F10D64] to-[#F56930] hover:opacity-90 text-[rgb(255,255,255)] text-xs font-semibold rounded-xl transition-all shadow-[0_2px_8px_rgba(241,13,100,0.2)] cursor-pointer"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Preview Modal */}
          {selectedItem && (
            <div 
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 md:p-6 transition-all duration-300 animate-[fadeIn_0.2s_ease-out]"
              onClick={() => setSelectedItem(null)}
            >
              <div 
                className="bg-white w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative grid grid-cols-1 md:grid-cols-2 animate-[scaleUp_0.25s_ease-out]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Left Side: Image & Actions */}
                <div className="p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
                  <div>
                    <div className="w-full aspect-[4/3] rounded-2xl bg-white border border-gray-100 p-4 flex items-center justify-center overflow-hidden mb-6 shadow-sm">
                      <img
                        src={getImageUrl(selectedItem.imageUrl || "")}
                        alt={selectedItem.title || "Banner Preview"}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">
                      {selectedItem.title || "Untitled Banner"}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 font-poppins mt-1">
                      {selectedItem.category || "General"}
                    </p>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between border-t border-gray-200/60 pt-4">
                      <span className="text-sm font-medium text-gray-500">Price</span>
                      <span className="text-2xl font-black text-gray-900 font-poppins">
                        ₹{selectedItem.price ? Number(selectedItem.price).toLocaleString("en-IN") : "0"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleBuyNow(selectedItem)}
                      className="w-full mt-4 py-3.5 bg-gradient-to-r from-[#F10D64] to-[#F56930] hover:opacity-90 text-white font-bold rounded-2xl transition-all shadow-[0_4px_14px_rgba(241,13,100,0.3)] text-center cursor-pointer font-poppins text-sm"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>

                {/* Right Side: Description */}
                <div className="p-6 md:p-8 flex flex-col justify-start relative bg-white">
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  <h4 className="text-lg font-bold text-gray-900 font-poppins border-b border-gray-100 pb-3 mb-4 mt-2">
                    Product Details
                  </h4>
                  <div className="text-gray-600 font-poppins text-sm md:text-base leading-relaxed overflow-y-auto max-h-[250px] md:max-h-[380px] pr-2">
                    {selectedItem.description ? (
                      <p className="whitespace-pre-line text-left">{selectedItem.description}</p>
                    ) : (
                      <p className="text-gray-400 italic text-left">No description available for this design. Contact us if you have any questions.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
  @keyframes scaleUp {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes gradientMove {
    0% { background-position: 200% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .animate-scroll {
    animation: scroll 25s linear infinite;
  }

  @keyframes waveMove {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }

  @media (max-width: 768px) {
    .service-hero { min-height: 520px !important; }
    .service-heading {
      font-size: 2.45rem !important;
      font-weight: 600 !important;
      margin-bottom: 1.5rem !important;
      padding-bottom: 0.5rem !important;
    }
    .service-carousel-wrap {
      height: 160px !important;
      margin-top: -3rem !important;
    }
    .service-grid-wrap {
      margin-top: 1rem !important;
      padding-top: 0.5rem !important;
      position: relative;
    }
    .service-banner-grid {
      gap: 1rem !important;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
      justify-items: center;
    }
    .service-banner-card {
      max-width: 285px !important;
      border-radius: 1rem !important;
    }
    .service-banner-image {
      height: 9.5rem !important;
      padding: 0.375rem !important;
    }
    .service-banner-card-body {
      padding: 0.75rem !important;
    }
    .service-banner-title {
      font-size: 0.875rem !important;
    }
    .service-banner-category {
      font-size: 0.75rem !important;
      margin-top: 0.125rem !important;
    }
    .service-banner-price {
      font-size: 0.95rem !important;
    }
    .service-banner-buy {
      padding: 0.375rem 0.75rem !important;
      font-size: 0.7rem !important;
      border-radius: 0.625rem !important;
    }
    .banner-blob-1 {
      width: 80px !important;
      height: 80px !important;
      top: 20px !important;
      left: 10px !important;
    }
    .banner-blob-2 {
      width: 75px !important;
      height: 75px !important;
      top: 90px !important;
      right: 15px !important;
    }
    .banner-blob-3 {
      width: 70px !important;
      height: 70px !important;
      bottom: 120px !important;
      left: 15px !important;
    }
    .banner-blob-4 {
      width: 85px !important;
      height: 85px !important;
      bottom: 30px !important;
      right: 10px !important;
    }
  }
`}</style>
    </div>
  );
}
