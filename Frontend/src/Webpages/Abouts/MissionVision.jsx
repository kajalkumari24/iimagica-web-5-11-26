



import React, { useEffect, useRef, useState } from "react";
import MissionImg from "../../assets/mission2.png";
import VisionImg from "../../assets/Vision.jpg";
import Vision1Img from "../../assets/vision1.png";
import CreationsImg from "../../assets/creations.png";
import ValuesImg from "../../assets/Values.jpg";
import WorkImg from "../../assets/ImageCreation.jpg";
import OurPurposeImg from "../../assets/ourpurpose.png";
import { Lightbulb, Rocket, Briefcase } from "lucide-react";

const data = [
  {
    title: "MISSION",
    desc: "To empower individuals, professionals, and organizations to create personalized digital content effortlessly with creativity, simplicity, and innovation.",
    img: MissionImg,
  },
  {
    title: "VISION",
    desc: "To become the leading platform for personalized digital branding, helping every user build a stronger and more engaging online presence.",
    img: VisionImg,
  },
  {
    title: "VALUES",
    desc: "We believe in creativity, quality, and simplicity, delivering reliable solutions that inspire trust and make digital branding accessible to everyone.",
    img: ValuesImg,
  },
];

export default function MissionVision() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const timelineRef = useRef(null);

  // 👇 Scroll trigger for original section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // 👇 Scroll trigger for timeline section
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setTimelineVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (timelineRef.current) observer.observe(timelineRef.current);
    return () => observer.disconnect();
  }, []);

  const timelineData = [
    {
      title: "Our Purpose",
      desc: "Our core purpose is to simplify digital expression, ensuring that any user can design and share impactful content without needing software training. We strive to provide the tools that turn brief thoughts into professional branding.",
      img: OurPurposeImg,
      icon: <Lightbulb className="w-5 h-5 text-white" />,
      iconBg: "bg-[#F1388A]",
    },
    {
      title: "Our Aspiration",
      desc: "We aspire to establish a global creative ecosystem where businesses of all sizes can maintain constant, high-quality touchpoints with their audience, leading the next wave of visual communication.",
      img: Vision1Img,
      icon: <Rocket className="w-5 h-5 text-white" />,
      iconBg: "bg-[#F77534]",
    },
    {
      title: "Our Creations",
      desc: "We design and build an extensive range of marketing templates, personalized greetings, and responsive layouts. Every asset is carefully optimized to look perfect on modern messaging platforms and social networks.",
      img: CreationsImg,
      icon: <Briefcase className="w-5 h-5 text-white" />,
      iconBg: "bg-[#F0A67D]",
    },
  ];

  return (
    <>
      <section
        ref={sectionRef}
        className="min-h-screen bg-white px-6 flex items-center relative overflow-hidden"
      >
        {/* 🔥 Blob Animation */}
        <style>{`
          @keyframes floatBlob {
            0% { transform: translate(0px, 0px) scale(1); }
            25% { transform: translate(10px, -15px) scale(1.03); }
            50% { transform: translate(-10px, 10px) scale(0.97); }
            75% { transform: translate(5px, -5px) scale(1.01); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
        `}</style>

        {/* 🔥 BLOBS */}
        <div
          className="absolute w-56 h-56 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)",
            opacity: 0.19,
            top: "40px",
            left: "40px",
            animation: visible ? "floatBlob 30s ease-in-out infinite" : "none",
          }}
        />

        <div
          className="absolute w-40 h-40 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)",
            opacity: 0.19,
            top: "80px",
            right: "80px",
            animation: visible ? "floatBlob 28s ease-in-out infinite" : "none",
          }}
        />

        <div
          className="absolute w-36 h-36 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)",
            opacity: 0.19,
            bottom: "80px",
            left: "35%",
            animation: visible ? "floatBlob 32s ease-in-out infinite" : "none",
          }}
        />

        <div
          className="absolute w-48 h-48 rounded-full"
          style={{
            background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)",
            opacity: 0.19,
            bottom: "40px",
            right: "40px",
            animation: visible ? "floatBlob 35s ease-in-out infinite" : "none",
          }}
        />

        {/* 🔥 CONTENT */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10">
          {/* 🔥 HEADING */}
          <div className="w-full text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-[30px] font-poppins tracking-wider sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900">
              Our Mission, Vision & Values
            </h2>

            <p className="text-gray-500 font-poppins mt-2 sm:mt-3 text-[13px] sm:text-base md:text-lg">
              The foundation that shapes everything we create
            </p>
          </div>

          {/* 🔥 GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-7 md:gap-9">
            {data.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg px-4 sm:px-5 py-4 sm:py-6 border-2 border-gray-100 text-center hover:shadow-xl transition duration-300 min-h-[342px] sm:min-h-[400px]"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0px)" : "translateY(60px)",
                  transition: `all 0.6s ease ${i * 0.3}s`,
                }}
              >
                {/* IMAGE */}
                <div className="w-full h-[209px] sm:h-[238px] md:h-[266px] flex items-center justify-center rounded-xl mb-4 sm:mb-5 overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>

                <h3 className="text-base sm:text-lg font-semibold font-poppins tracking-widest text-gray-800 mb-2 sm:mb-3">
                  {item.title}
                </h3>

                <p className="text-gray-800 font-poppins text-xs sm:text-[14px] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section
        ref={timelineRef}
        className="min-h-[100vh] flex items-center bg-white relative overflow-hidden py-10 md:py-12 px-6"
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10">

          {/* Timeline Wrapper */}
          <div className="relative">
            {/* Center line (only md and up) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-gray-200 hidden md:block" />

            <div className="space-y-10 md:space-y-12 relative">
              {timelineData.map((item, index) => {
                const isLeft = index % 2 === 0;
                return (
                  <div
                    key={index}
                    className={`flex flex-col md:flex-row items-center w-full ${
                      isLeft ? "md:flex-row" : "md:flex-row-reverse"
                    }`}
                    style={{
                      opacity: timelineVisible ? 1 : 0,
                      transform: timelineVisible
                        ? "translateY(0px)"
                        : "translateY(50px)",
                      transition: `all 0.8s ease ${index * 0.25}s`,
                    }}
                  >
                    {/* Text Side */}
                    <div
                      className={`w-full md:w-[45%] ${
                        isLeft ? "text-left md:text-right md:pr-8" : "text-left md:pl-8"
                      } mb-4 md:mb-0`}
                    >
                      <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 font-poppins">
                        {item.title}
                      </h3>
                      <p
                        className={`text-gray-600 font-poppins text-[13px] sm:text-sm leading-relaxed max-w-md ${
                          isLeft ? "md:ml-auto md:mr-0" : "md:ml-0 md:mr-auto"
                        }`}
                      >
                        {item.desc}
                      </p>
                    </div>

                    {/* Center Node */}
                    <div className="relative flex items-center justify-center w-full md:w-[10%] my-3 md:my-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg z-10 ${item.iconBg}`}
                      >
                        {item.icon}
                      </div>
                    </div>

                    {/* Image Side */}
                    <div
                      className={`w-full md:w-[45%] ${
                        isLeft ? "md:pl-8" : "md:pr-8"
                      } flex justify-center ${isLeft ? "md:justify-start" : "md:justify-end"}`}
                    >
                      <div className="bg-white p-3 rounded-2xl shadow-md border-2 border-gray-100 max-w-sm w-full transition-transform hover:scale-[1.02] duration-300 overflow-hidden">
                        <img
                          src={item.img}
                          alt={item.title}
                          className="w-full h-[120px] sm:h-[142px] object-cover rounded-xl"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}