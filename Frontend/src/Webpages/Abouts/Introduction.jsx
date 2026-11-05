
import React, { useEffect, useRef, useState } from "react";
import Intro from "../../assets/intro.png";
import Intro2 from "../../assets/intro2.jpg";

export default function Introduction() {
  const [visible1, setVisible1] = useState(false);
  const sectionRef1 = useRef(null);
  const [visible2, setVisible2] = useState(false);
  const sectionRef2 = useRef(null);

  // Scroll triggers for Section 1
  useEffect(() => {
    const observer1 = new IntersectionObserver(
      ([entry]) => {
        setVisible1(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (sectionRef1.current) observer1.observe(sectionRef1.current);

    return () => {
      observer1.disconnect();
    };
  }, []);

  // Scroll triggers for Section 2
  useEffect(() => {
    const observer2 = new IntersectionObserver(
      ([entry]) => {
        setVisible2(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (sectionRef2.current) observer2.observe(sectionRef2.current);

    return () => {
      observer2.disconnect();
    };
  }, []);

  // 🔥 Preload both intro images for fast LCP/FCP
  useEffect(() => {
    const img1 = new Image();
    img1.src = Intro;
    const img2 = new Image();
    img2.src = Intro2;
  }, []);

  return (
    <div className="w-full flex flex-col">
      {/* 🔥 Blob Animation Keyframes */}
      <style>{`
        @keyframes floatBlob {
          0% { transform: translate(0px, 0px) scale(1); }
          25% { transform: translate(10px, -15px) scale(1.03); }
          50% { transform: translate(-10px, 10px) scale(0.97); }
          75% { transform: translate(5px, -5px) scale(1.01); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>

      {/* SECTION 1: Original Introduction Section (~85vh) */}
      <section
        ref={sectionRef1}
        className="min-h-[85vh] flex items-center bg-white px-6 py-10 relative overflow-hidden"
      >
        {/* 🔥 BLOBS for Section 1 */}
        <div
          className="absolute w-56 h-56 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)",
            opacity: 0.19,
            top: "40px",
            left: "40px",
            animation: visible1 ? "floatBlob 30s ease-in-out infinite" : "none",
          }}
        />

        <div
          className="absolute w-40 h-40 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)",
            opacity: 0.19,
            top: "80px",
            right: "80px",
            animation: visible1 ? "floatBlob 28s ease-in-out infinite" : "none",
          }}
        />

        <div
          className="absolute w-36 h-36 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)",
            opacity: 0.19,
            bottom: "80px",
            left: "35%",
            animation: visible1 ? "floatBlob 32s ease-in-out infinite" : "none",
          }}
        />

        <div
          className="absolute w-48 h-48 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)",
            opacity: 0.19,
            bottom: "40px",
            right: "40px",
            animation: visible1 ? "floatBlob 35s ease-in-out infinite" : "none",
          }}
        />

        {/* 🔥 MAIN CONTENT (Section 1) */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 mt-4 md:mt-6 items-center w-full relative z-10">
          {/* LEFT SIDE */}
          <div className="w-full animate-fade-in">
            <img
              src={Intro}
              alt="Introduction"
              fetchPriority="high"
              decoding="async"
              className="w-full h-[250px] sm:h-[280px] md:h-[360px] object-cover rounded-2xl shadow-md"
            />
          </div>
          {/* RIGHT SIDE */}
          <div className="text-left">
            <h2 className="text-6xl text-gray-900 mb-6 font-[poppins] font-medium">
              Introduction
            </h2>

            <p className="text-gray-700 text-[17px] font-sans leading-relaxed mb-5">
              iimagica is a subscription-based digital branding platform designed for businesses, professionals, creators, and organizations. Our platform helps users create personalized social media posts, festival greetings, promotional designs, WhatsApp status images, and business branding creatives in just a few clicks.
            </p>

            <p className="text-gray-700 text-[17px] font-sans leading-relaxed mb-6">
              Whether you are a doctor, lawyer, engineer, teacher, politician, entrepreneur, or business owner, iimagica helps you maintain a professional online presence with ready-made customizable templates. Easily share festival greetings, business announcements, promotional campaigns, and important updates without design expertise. With regularly updated templates and an intuitive user experience, you can create high-quality visuals that strengthen your brand identity.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: Analytical Overview Section (~85vh) */}
      <section
        ref={sectionRef2}
        className="min-h-[85vh] flex items-center bg-white px-6 py-10 relative overflow-hidden"
      >
        {/* 🔥 BLOBS for Section 2 */}
        <div
          className="absolute w-56 h-56 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)",
            opacity: 0.19,
            top: "40px",
            left: "40px",
            animation: visible2 ? "floatBlob 30s ease-in-out infinite" : "none",
          }}
        />

        <div
          className="absolute w-40 h-40 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)",
            opacity: 0.19,
            top: "80px",
            right: "80px",
            animation: visible2 ? "floatBlob 28s ease-in-out infinite" : "none",
          }}
        />

        <div
          className="absolute w-36 h-36 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)",
            opacity: 0.19,
            bottom: "80px",
            left: "35%",
            animation: visible2 ? "floatBlob 32s ease-in-out infinite" : "none",
          }}
        />

        <div
          className="absolute w-48 h-48 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)",
            opacity: 0.19,
            bottom: "40px",
            right: "40px",
            animation: visible2 ? "floatBlob 35s ease-in-out infinite" : "none",
          }}
        />

        {/* 🔥 MAIN CONTENT (Section 2) */}
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 mt-4 md:mt-6 items-center w-full relative z-10">
          {/* LEFT SIDE: Two analytical paragraphs */}
          <div className="text-left flex flex-col justify-center">
            <p className="text-gray-700 text-[17px] font-sans leading-relaxed mb-5">
              Through an analytical lens, iimagica serves as a strategic catalyst for digital branding, simplifying what was once a complex, costly design process. By offering a curated library of subscription-based templates, the platform effectively democratizes digital outreach. This enables users to deploy high-impact visuals instantly, streamlining their content production pipeline and ensuring their brand remains active across all major social media channels.
            </p>

            <p className="text-gray-700 text-[17px] font-sans leading-relaxed mb-6">
              Furthermore, the platform's versatile framework serves a broad spectrum of industries, from healthcare and legal professionals to entrepreneurs and creators. By focusing on rapid customization and ease of use, iimagica removes technical friction, enabling users to focus on authentic community engagement. This consistent flow of personalized content fosters deeper client relationships and builds a recognizable brand identity in today’s competitive digital ecosystem.
            </p>
          </div>

          {/* RIGHT SIDE: intro2 image */}
          <div className="w-full animate-fade-in">
            <img
              src={Intro2}
              alt="Analytical Overview"
              loading="lazy"
              decoding="async"
              className="w-full h-[250px] sm:h-[280px] md:h-[360px] object-cover rounded-2xl shadow-md"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

