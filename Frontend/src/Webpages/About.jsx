import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Import images from src/assets
// import image3 from "../assets/framesimg2.png";
import image4 from "../assets/images4.png";
import image11 from "../assets/aboutimg7.png";
import image2 from "../assets/framesimg1.png";
import image10 from "../assets/aboutimg18.png";
import image7 from "../assets/aboutimage3.png";
import image12 from "../assets/Image12.png";
import image13 from "../assets/Image13.png";

export default function IimagicaAbout() {
  const images = [

    image4,
    image11,
    image2,
    image10,
    image7,
  ];
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [downloadHovered, setDownloadHovered] = useState(false);
  const sectionRef = useRef(null);

  const fullText = `Imagica is a creative platform designed to help users easily create and share personalized images for social media, marketing, and personal use. With a wide range of templates, customization options, and an intuitive interface, Imagica empowers individuals and businesses to craft visually stunning content that stands out and engages their audience. Whether you're a creator, marketer, or just looking to add a personal touch to your photos, Imagica provides the tools you need to bring your ideas to life.`;

  // 👇 Preload images for low speed internet
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // 👇 Scroll/load animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  // 👇 Image slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div
      ref={sectionRef}
      className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-gradient-to-br from-[#F8F6FF] via-white to-[#FFF0F6]"
    >
      {/* BLOBS */}
      <div className="absolute w-[120px] h-[120px] lg:w-[180px] lg:h-[180px] rounded-full top-[30px] -left-[20px] lg:left-[60px]" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }} />
      <div className="absolute w-[80px] h-[80px] lg:w-[110px] lg:h-[110px] rounded-full top-[80px] -right-[20px] lg:right-[80px]" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }} />
      <div className="absolute w-[90px] h-[90px] rounded-full bottom-[80px] left-[40%]" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }} />
      <div className="absolute w-[100px] h-[100px] lg:w-[140px] lg:h-[140px] rounded-full bottom-[40px] -right-[20px] lg:right-[40px]" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }} />

      {/* MAIN GRID */}
      <div
        className={`max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center -space-y- relative z-10 transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
      >
        {/* TEXT */}
        <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
          {/* LABEL */}
          <div className="inline-flex items-center gap-2 bg-[#FFF2EB] rounded-full px-4 py-[6px] mb-6">
            <div className="w-2 h-2 rounded-full bg-[#FF7A30]" />
            <span className="text-[11px] font-poppins sm:text-[13px] font-semibold tracking-widest text-[#FF7A30] uppercase">
              About us
            </span>
          </div>

          {/* HEADING */}
          <h2 className="!text-[22px] sm:!text-[clamp(32px,4vw,52px)] font-bold font-serif text-[#1A1045] leading-[1.15] mb-5">
            About{" "}
            <span className="bg-[linear-gradient(135deg,#EE9B6F_0%,#F66520_30%,#EE247D_100%)] bg-clip-text text-transparent inline-block">
              iimagica
            </span>
          </h2>

          {/* DESCRIPTION - SINGLE PARAGRAPH */}
          <p
            className={`text-[15px] sm:text-[17px] font-sans leading-[1.85] text-[#4A4560] mb-4 lg:mb-[-18px] transition-opacity duration-700 ease-in-out ${visible ? "opacity-100" : "opacity-0 translate-y-5"
              }`}
          >
            {fullText}
          </p>

          {/* FOOTER */}
          <p className="text-[13px] text-[#8884A8] leading-relaxed mt-2 lg:mt-4 mb-6 lg:mb-4">
            Built for creators, businesses, and anyone who loves to customize
            moments. Try a template and make it yours.
          </p>

          {/* BUTTON */}
          <button
            onClick={() => navigate("/about")}
            className="px-8 py-3 cursor-pointer rounded-full border border-[#FFC3A3] text-[#FF7A30] font-semibold hover:bg-[#FFF2EB] transition-colors"
          >
            Learn more
          </button>
        </div>

        {/* IMAGE SIDE */}
        <div className="relative flex flex-col items-center order-1 lg:order-2">
          <div className="relative w-full max-w-[320px] h-[280px] sm:max-w-[400px] sm:h-[340px] lg:max-w-[500px] lg:h-[420px] mb-4 lg:mb-0">
            {images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt="about"
                fetchpriority={index === 0 ? "high" : "auto"}
                decoding="async"
                className={`absolute top-1/2 left-1/2 object-contain rounded-full -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 ${index === currentImage ? "opacity-100" : "opacity-0"
                  } ${img === image11 ? "w-[90%] h-[90%]" : img === image2 ? "w-[80%] h-[80%]" : "w-full h-full"
                  }`}
              />
            ))}
          </div>

          {/* DOWNLOAD BUTTON */}
          <button
            onMouseEnter={() => setDownloadHovered(true)}
            onMouseLeave={() => setDownloadHovered(false)}
            className="mb-[15px] px-8 py-3 rounded-full cursor-pointer text-white font-semibold shadow-lg hover:scale-105 transition-transform"
            style={{
              background: downloadHovered ? "#FF803C" : "#FF7A30",
            }}
          >
            <a href="https://play.google.com/store/apps/details?id=com.infinity.imagica" target="_blank" rel="noopener noreferrer">
              Download Now
            </a>
          </button>

          {/* STORE BUTTONS */}
          <div className="flex gap-4 mt-2">
            <a href="https://apps.apple.com/" target="_blank" rel="noopener noreferrer">
              <img
                src={image12}
                alt="App Store"
                loading="lazy"
                decoding="async"
                className="h-[40px] sm:h-[50px] cursor-pointer hover:opacity-80 transition-opacity"
              />
            </a>

            <a href="https://play.google.com/store/apps/details?id=com.infinity.imagica" target="_blank" rel="noopener noreferrer">
              <img
                src={image13}
                alt="Play Store"
                loading="lazy"
                decoding="async"
                className="h-[40px] sm:h-[50px] cursor-pointer hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}