import React, { useEffect, useRef, useState } from "react";

// Import images from src/assets
import whi1 from "../assets/slider1.png";
import whi2 from "../assets/slider2.png";
import whi3 from "../assets/slider3.png";
import whi4 from "../assets/slider4.png";
import backcirrcle from "../assets/backcircle5.jpeg";

// ✅ Floating blobs
const FloatingBlob = ({ className }) => (
  <div className={`absolute rounded-full opacity-10 ${className}`} />
);

export default function WhyUse() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [startAnimation, setStartAnimation] = useState(false);

  const sectionRef = useRef(null);
  const intervalRef = useRef(null);

 const steps = [
  {
    text: "Sign up or log in to your Iimagica account.",
    img: whi1,
    subText: "Create stunning visuals in seconds with our smart tools easily for every creative need.",
  },
  {
    text: "Browse through a wide range of creative categories.",
    img: whi2,
    subText: "Explore thousands of ready-to-use designs effortlessly across all categories for your creative projects.",
  },
  {
    text: "Select the design that fits your needs.",
    img: whi3,
    subText: "Pick the perfect template tailored to your content and style for best results.",
  },
  {
    text: "Download creatives instantly in high quality.",
    img: whi4,
    subText: "Get high-resolution creatives ready to share anywhere without quality loss across all platforms.",
  },
];

  // ✅ Preload all images in the background for low speed internet
  useEffect(() => {
    const imagesToPreload = [backcirrcle, whi1, whi2, whi3, whi4];
    imagesToPreload.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // ✅ 75% trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.75) {
          setStartAnimation(true);
        } else {
          setStartAnimation(false);
        }
      },
      { threshold: [0.75] }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  // ✅ Infinite loop
  useEffect(() => {
    if (!startAnimation) return;

    let index = 0;
    setActiveIndex(0);

    intervalRef.current = setInterval(() => {
      index = (index + 1) % steps.length;
      setActiveIndex(index);
    }, 4200);

    return () => clearInterval(intervalRef.current);
  }, [startAnimation]);

  return (
    <section
      ref={sectionRef}
      className="min-h-screen bg-white relative overflow-hidden py-24"
    >

      {/* ✅ BLOBS */}
      {/* <FloatingBlob className="w-44 h-44 bg-[#6C63FF] top-8 left-16" /> */}
      {/* <FloatingBlob className="w-50 h-50 bg-[#FF7BAC] top-20 right-20" /> */}
      {/* <FloatingBlob className="w-43 h-43 bg-[#6C63FF] bottom-20 left-[20%]" /> */}
      {/* <FloatingBlob className="w-36 h-36 bg-[#00C896] bottom-10 right-10" /> */}

      <div className="max-w-6xl -mt-12 mx-auto px-6">

        {/* ✅ HEADING */}
        <div className="text-center mb-10 sm:mb-14 md:mb-10 lg:mb-24">
          <h2 className="!text-[23px] sm:!text-4xl md:!text-4xl lg:!text-[40px]  font-sans font-semibold tracking-tight text-gray-900 uppercase">
            How To Use Iimagica
          </h2>
        </div>

        <div className="flex flex-col -mt-2 lg:flex-row gap-10 md:gap-12 lg:gap-18">

<div className="w-full lg:w-1/2 
  sticky lg:top-28 
  h-[300px] sm:h-[340px] md:h-[380px] lg:h-[500px] 
  flex items-center justify-center relative">

  {/* ✅ BACKGROUND CIRCLE */}
  <img
    src={backcirrcle}
    alt="circle"
    fetchpriority="high"
    decoding="async"
    className="
      absolute 
      w-[299px] sm:w-[420px] md:w-[380px] lg:w-[780px]
      top-[44%] lg:top-[40%]
      left-1/2 lg:left-1/3   /* ✅ mobile center, desktop original */
      -translate-x-1/2 -translate-y-1/2
      opacity-50 pointer-events-none -z-10
      saturate-[1.9]
    "
  />

  {/* ✅ FOREGROUND CONTAINER */}
  <div className="
    absolute 
    top-[44%] lg:top-[40%]
    left-1/2 lg:left-1/3   /* ✅ same logic */
    -translate-x-1/2 -translate-y-1/2 
    w-full h-full flex items-center justify-center
  ">

    {steps.map((step, i) => (
      <img
        key={i}
        src={step.img}
        alt={`Step ${i + 1}`}
        decoding="async"
        fetchpriority={i === 0 ? "high" : "auto"}
        className={`
          absolute 
          ${
            i < 3
              ? "w-[calc(61%-1px)] sm:w-[65%] md:w-[67%] lg:w-[76%] max-h-[calc(61%-1px)] sm:max-h-[69%] md:max-h-[71%] lg:max-w-[86%]"
              : "w-[calc(65%-1px)] sm:w-[69%] md:w-[71%] lg:w-[80%] max-h-[calc(65%-1px)] sm:max-h-[76%] md:max-h-[78%] lg:max-w-[90%]"
          }
    h-auto
          object-contain 
          brightness-110 contrast-110 saturate-110
          transition-all duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            activeIndex === i
              ? "opacity-100 translate-y-0 scale-100 z-10"
              : "opacity-0 translate-y-20 scale-95 z-0"
          }
        `}
      />
    ))}

  </div>
</div>

          {/* RIGHT TEXT */}
      <div className="
  w-full lg:w-1/2 
  space-y-6 sm:space-y-10 md:space-y-10 lg:space-y-14
  text-center lg:text-left  
">
  {steps.map((step, i) => (
    <div
      key={i}
      className={`
        transition-all duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)]
        ${
          activeIndex === i
            ? "opacity-100 translate-y-0"
                : "opacity-40 translate-y-0 md:translate-y-4"
        }
      `}
    >
      <p className="
        text-[13px] sm:text-[17px] md:text-[17px] lg:text-[21px] font-[poppins]
        font-medium  text-slate-900 leading-relaxed
      ">
        <span className="text-[#FF7A30] font-semibold mr-2">
          {`0${i + 1}.`}
        </span>
        {step.text}
      </p>

      {/* ✅ UNIQUE EXTRA TEXT */}
      <div
        className={`
          hidden lg:block overflow-hidden
          transition-all duration-[800ms] ease-in-out
          ${
            activeIndex === i
              ? "max-h-20 opacity-100 mt-3"
              : "max-h-0 opacity-0"
          }
        `}
      >
        <p className="text-[13px] lg:text-[15px] text-gray-600 leading-relaxed">
          {step.subText}
        </p>
      </div>

    </div>
  ))}
</div>
        </div>
      </div>
    </section>
  );
}
