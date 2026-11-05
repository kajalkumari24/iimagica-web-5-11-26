import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { BASE_URL } from "../../url";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import card3 from "../../assets/card3.png";
import card7 from "../../assets/card7.png";
import card4 from "../../assets/card4.png";
import card5 from "../../assets/card5.png";
import card6 from "../../assets/card6.png";
import card2 from "../../assets/card2.png";
import card8 from "../../assets/card8.png";
import card1 from "../../assets/card1.png";
import bgVideo from "../../assets/video.mp4";
import visitingCardImage from "../../assets/visitingcard.png";

const Blob = ({ className, style }) => (
  <div
    className={`absolute rounded-full ${className}`}
    style={style}
  />
);

export default function VisitingCards() {
  const navigate = useNavigate();
  const location = useLocation();
  const [textIndex, setTextIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [blink, setBlink] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const videoRef = useRef(null);
  const [cardsData, setCardsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);



  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const texts = [
    "Creative designs that represent your brand",
    "Make your business stand out beautifully",
    "Professional visuals for every need",
    "Build a strong brand identity easily",
  ];

  const cards = [
    { title: "Fast Delivery", img1: card3, img2: card7 },
    { title: "Creative Design", img1: card4, img2: card5 },
    { title: "High Quality", img1: card6, img2: card2 },
    { title: "24/7 Support", img1: card8, img2: card1 },
  ];

  useEffect(() => {
    let blinkCount = 0;
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
      blinkCount++;
      if (blinkCount >= 2) {
        clearInterval(interval);
        setBlink(true);
        setShowContent(true);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showContent) return;

    const handleEnd = () => {
      setTimeout(() => {
        video.currentTime = 0;
        video.play();
      }, 4000);
    };

    video.addEventListener("ended", handleEnd);
    return () => video.removeEventListener("ended", handleEnd);
  }, [showContent]);

  useEffect(() => {
    if (!showContent) return undefined;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTextIndex((prev) => (prev + 1) % texts.length);
        setFade(true);
      }, 500);
    }, 4000);

    return () => clearInterval(interval);
  }, [showContent, texts.length]);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        const [cardRes, profileRes] = await Promise.allSettled([
          axios.get(`${BASE_URL}/api/design-library/visitingCards`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/profiles/me`, { withCredentials: true }),
        ]);

        if (profileRes.status === "fulfilled") {
          setProfile(profileRes.value.data?.profile || profileRes.value.data || null);
        }
        const data = cardRes.status === "fulfilled" ? (cardRes.value.data?.data || cardRes.value.data || []) : [];
        setCardsData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching visiting cards:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
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

    const designDetails = `*Design to Buy:*\nTitle: "${item.title || "Visiting Card"}"\nCategory: "${item.category || "General"
      }"\nPrice: ₹${item.price || "0"}\nImage URL: ${getImageUrl(item.imageUrl)}`;

    const message = `Hello, I want to buy a visiting card design.\n\n${userDetails}\n\n${designDetails}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="w-full bg-white">
      <div className="service-hero min-h-screen relative overflow-hidden flex flex-col items-center justify-start bg-white pt-10 pb-12 px-6">
        <Blob className="vc-blob-1 w-[180px] h-[180px] top-10 left-10 animate-[float_12s_ease-in-out_infinite]" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }} />
        <Blob className="vc-blob-2 w-[220px] h-[220px] top-20 right-10 animate-[float_14s_ease-in-out_infinite]" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }} />
        <Blob className="vc-blob-3 w-[160px] h-[160px] bottom-10 left-20 animate-[float_10s_ease-in-out_infinite]" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }} />
        <Blob className="vc-blob-4 w-[200px] h-[200px] bottom-10 right-10 animate-[float_16s_ease-in-out_infinite]" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }} />

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
              Visiting Cards
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
              <span className="block">Premium Cards</span>
              <span className="block lg:mt-[7px] bg-gradient-to-r from-[#F66D2B] to-[#EF2F85] bg-clip-text text-transparent">
                That Respect.
              </span>
            </h2>

            <p className="text-gray-600 font-poppins text-sm md:text-base leading-relaxed max-w-lg">
              Your visiting card represents your professional identity and leaves a lasting first impression. At iimagica, choose from a wide collection of standard, modern, and creative visiting card templates tailored for different professions and businesses. Browse professionally designed layouts that enhance your brand image and download high-quality cards ready for digital or print use.
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
              Explore Visiting Cards
            </button>
          </div>

          {/* Right Column: Rotating Images Slideshow */}
          <div className="flex justify-center items-center relative w-full h-[280px] sm:h-[350px] md:h-[400px] z-10">
            <div className="relative w-full max-w-[450px] aspect-[4/3] flex items-center justify-center overflow-hidden hover:scale-[1.01] transition-transform duration-300">
              <img
                src={visitingCardImage}
                alt="Visiting Card Showcase"
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </div>

      {showContent && (
        <>
          <div className="service-video-wrap w-full mb-20 mt-6 px-4 sm:px-6 lg:px-10 z-20">
            <div className="relative w-full h-[260px] md:h-[340px] lg:h-[480px] shadow-2xl">
              <video
                ref={videoRef}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                src={bgVideo}
                autoPlay
                muted
                playsInline
              />

              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
              <div className="absolute top-0 left-0 w-full h-[22%] bg-gradient-to-b from-black/70 to-transparent z-10" />

              <div className="absolute top-5 left-6 text-white z-10">
                <h3 className="text-2xl md:text-4xl font-semibold">
                  Business Showcase
                </h3>
                <p className={`text-sm md:text-base mt-1 transition-opacity duration-500 ${fade ? "opacity-100" : "opacity-0"}`}>
                  {texts[textIndex]}
                </p>
              </div>

              <div className="absolute bottom-20 left-0 w-full hidden sm:flex justify-center translate-y-[35%] z-30">
                <div className="w-[90%] grid grid-cols-4 gap-4">
                  {cards.map((item, i) => (
                    <div key={i} className="group rounded-xl shadow-xl p-4 h-[180px] flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 perspective">
                        <div className="relative w-full h-full transition-transform duration-700 transform-style-preserve-3d group-hover:[transform:rotateY(180deg)]">
                          <div className="absolute inset-0 backface-hidden">
                            <img src={item.img1} className="w-full h-full object-cover" />
                          </div>

                          <div className="absolute inset-0 rotate-y-180 backface-hidden">
                            <img src={item.img2} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Slogan Banner */}
          <div className="w-full max-w-7xl mx-auto px-6 mb-8 mt-12 relative z-10 text-center">
            <h2 className="text-2xl md:text-4xl font-poppins font-extrabold pb-2 bg-gradient-to-r from-[#F66D2B] to-[#EF2F85] bg-clip-text text-transparent">
              Network in Style Connect with Confidence
            </h2>
            <p className="text-gray-500 font-poppins text-xs sm:text-sm md:text-base font-medium max-w-2xl mx-auto mt-2">
              Hand out cards that reflect your dedication, professionalism, and personal branding.
            </p>
          </div>

          <div id="product-grid-section" className="service-grid-wrap w-full max-w-8xl mx-auto py-16 px-2 sm:px-6 lg:px-8 z-20">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F10D64]"></div>
              </div>
            ) : cardsData.length === 0 ? (
              <div className="text-center py-20 text-gray-500 text-lg">
                No visiting cards found.
              </div>
            ) : (
              <div className="visiting-card-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 lg:py-6">
                {cardsData.map((item, index) => (
                  <div
                    key={item._id || index}
                    onClick={() => setSelectedItem(item)}
                    className="visiting-buy-card bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 lg:scale-110 lg:hover:scale-[1.15] lg:m-3 overflow-hidden flex flex-col cursor-pointer"
                  >
                    <div className="visiting-buy-image w-full aspect-[5/3] p-4 flex items-center justify-center bg-gray-50/50">
                      <img
                        src={getImageUrl(item.imageUrl || "")}
                        alt={item.title || "Visiting Card"}
                        className="max-w-full max-h-full object-contain drop-shadow-sm"
                        loading="lazy"
                      />
                    </div>

                    <div className="visiting-buy-body p-4 border-t border-gray-100 flex-grow flex flex-col justify-between bg-white">
                      <div>
                        <h3 className="visiting-buy-title text-base font-bold text-gray-900 truncate" title={item.title}>
                          {item.title || "Untitled Card"}
                        </h3>
                        <p className="visiting-buy-category text-xs font-medium text-gray-500 mt-1 truncate" title={item.category}>
                          {item.category || "General"}
                        </p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="visiting-buy-price text-lg font-black text-gray-900">
                          ₹{item.price ? Number(item.price).toLocaleString("en-IN") : "0"}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyNow(item);
                          }}
                          className="visiting-buy-button px-4 py-2 bg-gradient-to-r from-[#F10D64] to-[#F56930] hover:opacity-90 text-[rgb(255,255,255)] text-xs font-bold rounded-xl transition-all shadow-[0_2px_8px_rgba(241,13,100,0.2)] cursor-pointer"
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
                        alt={selectedItem.title || "Card Preview"}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 font-poppins">
                      {selectedItem.title || "Untitled Card"}
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

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .perspective { perspective: 1000px; }
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }

        @media (max-width: 768px) {
          .service-heading-wrap {
            margin-top: 6rem !important;
          }
          .service-heading {
            font-size: 2.25rem !important;
            margin-bottom: 0.75rem !important;
            padding-bottom: 0.5rem !important;
          }
          .service-video-wrap {
          margin-top: 2.5rem !important;
          margin-bottom: 4rem !important;
          }
          .service-grid-wrap {
          margin-top: 1rem !important;
          padding-top: 1.5rem !important;
          }
          .visiting-card-grid {
            gap: 1rem !important;
            justify-items: center;
          }
          .visiting-buy-card {
            max-width: 300px !important;
            border-radius: 1rem !important;
          }
          .visiting-buy-image {
            padding: 0.6rem !important;
            aspect-ratio: 1.45 / 1 !important;
          }
          .visiting-buy-body {
            padding: 0.75rem !important;
          }
          .visiting-buy-title {
            font-size: 0.875rem !important;
          }
          .visiting-buy-category {
            font-size: 0.7rem !important;
            margin-top: 0.125rem !important;
          }
          .visiting-buy-price {
            font-size: 0.95rem !important;
          }
          .visiting-buy-button {
            padding: 0.375rem 0.75rem !important;
            font-size: 0.7rem !important;
            border-radius: 0.625rem !important;
          }
          .vc-blob-1 {
            width: 88px !important;
            height: 88px !important;
            top: 28px !important;
            left: 14px !important;
          }
          .vc-blob-2 {
            width: 74px !important;
            height: 74px !important;
            top: 118px !important;
            right: 18px !important;
          }
          .vc-blob-3 {
            width: 78px !important;
            height: 78px !important;
            bottom: 150px !important;
            left: 18px !important;
          }
          .vc-blob-4 {
            width: 70px !important;
            height: 70px !important;
            bottom: 34px !important;
            right: 22px !important;
          }
        }
      `}</style>
    </div>
  );
}
