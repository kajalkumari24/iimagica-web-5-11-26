import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function CTASection() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const sectionRef = useRef(null);

  const handleContactClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };


  // 👇 Scroll trigger (same as your working cards)
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        } else {
          setVisible(false); // allow re-animation
        }
      },
      { threshold: 0.25 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (

    
    <div
      ref={sectionRef}
      className="min-h-screen bg-slate-50 flex items-center justify-center p-8 relative overflow-hidden"
    >
      {/* Blobs */}
      <div className="absolute top-8 left-8 w-[140px] h-[140px] md:w-48 md:h-48 rounded-full" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }} />
      <div className="absolute top-16 right-12 w-[140px] h-[140px] md:w-40 md:h-40 rounded-full" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }} />
      <div className="absolute bottom-12 left-[-5%] md:left-[35%] w-28 h-28 md:w-36 md:h-36 rounded-full" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }} />
      <div className="absolute bottom-4 md:bottom-8 right-[-5%] md:right-8 w-32 h-32 md:w-44 md:h-44 rounded-full" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }} />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-3xl rounded-2xl overflow-hidden shadow-lg transition-all duration-700"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.08), 0 25px 50px -12px rgba(0,0,0,0.1)",

          // 👇 ANIMATION (same feel as your cards)
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0px) scale(1)"
            : "translateY(80px) scale(0.95)",
        }}
      >
        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.015) 3px, rgba(0,0,0,0.015) 4px)",
          }}
        />

        {/* Glow line */}
        <div
          className="absolute top-0 left-1/4 right-1/4 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)",
          }}
        />

        {/* Content */}
        <div className="relative px-16 py-20 flex flex-col items-center text-center gap-6">
          <h2
            className="text-4xl font-extrabold text-gray-900 leading-tight tracking-tight"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Ready to Transform Your
            <br />
            Business?
          </h2>

          <p className="text-gray-600 text-base font-light tracking-wide">
            Let's create something amazing together!
          </p>

          <div className="h-6" />

          {/* Button */}
          <Link to="/contact" onClick={handleContactClick}>
            <button
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              className="px-10 py-4 rounded-full cursor-pointer font-semibold text-white text-sm md:text-[16px] tracking-wide transition-all duration-300"
              style={{
                background: hovered ? "#FF9559" : "#FF7A30",
              }}
            >
              Contact Us
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
