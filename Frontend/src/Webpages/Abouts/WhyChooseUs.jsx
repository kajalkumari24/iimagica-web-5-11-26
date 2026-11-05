



import React, { useState, useEffect, useRef } from "react";

const features = [
  {
    title: "Personalized for Every Occasion",
    desc: "Create frames for good morning, good night, birthdays, anniversaries, festivals, and all your special moments effortlessly.",
  },
  {
    title: "Profession & Passion Focused",
    desc: "Design professional-looking frames for your work or showcase your hobbies and passions with creative templates.",
  },
  {
    title: "Event & Festival Ready",
    desc: "Celebrate festivals, corporate events, and social gatherings with ready-to-use and customizable frames.",
  },
  {
    title: "Logos & Visiting Cards",
    desc: "Easily create and brand your logos and visiting cards with stylish and professional designs that you like.",
  },
];

import firstImg from "../../assets/first1.png";
import secondImg from "../../assets/second.png";
import thirdImg from "../../assets/third1.png";
import fourthImg from "../../assets/thirdimg.png";

const images = [firstImg, secondImg, thirdImg, fourthImg];

export default function WhyChooseUs() {
  // const [visibleCards, setVisibleCards] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const sectionRef = useRef(null);
  const [startAnimation, setStartAnimation] = useState(false);


  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStartAnimation(true);
        } else {
          setStartAnimation(false);
          setActiveIndex(0);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);



  useEffect(() => {
  if (!startAnimation) return;

  const interval = setInterval(() => {
    setActiveIndex((prev) => (prev + 1) % features.length);
  }, 5000);

  return () => clearInterval(interval);
}, [startAnimation]);

  return (
    <section
  ref={sectionRef}
  className="bg-white min-h-screen py-16 px-4 md:px-10 relative overflow-hidden"
>
      {/* 🔥 BLOBS */}
      <div className="absolute rounded-full w-[80px] h-[80px] md:w-[180px] md:h-[180px] top-[23px] md:top-[30px] left-[10px] md:left-[60px] animate-blob" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }} />
      <div className="absolute rounded-full w-[75px] h-[75px] md:w-[150px] md:h-[150px] top-[100px] md:top-[80px] right-[15px] md:right-[80px] animate-blob animation-delay-2000" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }} />
      <div className="absolute rounded-full w-[70px] h-[70px] md:w-[140px] md:h-[140px] bottom-[150px] md:bottom-[80px] left-[15px] md:left-[0%] animate-blob animation-delay-4000" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }} />
      <div className="absolute rounded-full w-[85px] h-[85px] md:w-[140px] md:h-[140px] bottom-[30px] md:bottom-[40px] right-[20px] md:right-[40px] animate-blob animation-delay-6000" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }} />

      {/* 🔥 BLOB ANIMATION */}
      <style>{`
        @keyframes blob {
         
        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animation-delay-6000 { animation-delay: 6s; }
      `}</style>

      {/* Heading */}
      <div className="text-center max-w-2xl  mx-auto relative z-10">
        <h2 className="text-3xl md:text-5xl font-semibold text-[#070a10]">
          Why Choose Us?
        </h2>
        <p className="mt-3 text-gray-600 text-sm md:text-lg ">
          "Designed for creators and businesses to save time, look professional, and grow smarter."
        </p>
      </div>

      {/* Content */}
      <div className="-mt-10 flex flex-col lg:flex-row items-center gap-2 md:gap-10 lg:gap-16 max-w-6xl mx-auto relative z-10">
        

<div className="w-full lg:w-[75%]  flex justify-center overflow-hidden">
  <div className="
    relative w-full 
    max-w-[520px] sm:max-w-lg md:max-w-xl lg:max-w-3xl
    h-[280px] sm:h-[380px] md:h-[440px] lg:h-[650px]
  ">

    {images.map((img, index) => (
      <img
        key={index}
        src={img}
                loading="lazy"
                decoding="async"
        alt=""
        className={`
          absolute top-0 left-0 w-full h-full object-contain rounded-xl 
          transition-all duration-1000 ease-in-out   
          ${index === activeIndex
            ? "opacity-100 translate-x-0"
            : "opacity-0 -translate-x-8"}
        `}
        style={
          img === thirdImg
            ? {
                width: "75%",
                height: "75%",
                top: "7.5%",
                left: "7.5%",
              }
            : {}
        }
      />
    ))}

  </div>
</div>


        {/* Cards */}
        <div className="w-full  lg:w-2/3 flex flex-col gap-6">
          {features.map((item, index) => (
            <div
              key={index}
              className={`border border-gray-300 rounded-xl p-2 md:p-3 bg-white shadow-sm hover:shadow-md max-h-[70px] md:max-h-[90px] overflow-hidden
                transition-all duration-700
                ${index === activeIndex
  ? "border-orange-500 bg-orange-50 scale-[1.03]"
  : "border-gray-300 opacity-70"}`}
              style={{ transitionDelay: `${index * 500}ms` }}
            >
              <h3 className="text-sm md:text-base font-medium text-[#1f2a44]">
                {item.title}
              </h3>
              <p className="mt-1 text-gray-600 text-xs md:text-sm leading-snug line-clamp-2 md:line-clamp-none">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}