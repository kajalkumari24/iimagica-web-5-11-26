
import React, { useState, useEffect, useRef } from "react";
import Login1 from "../assets/loginimg2.png";
import Select from "../assets/loginimg4.png";
import Download from "../assets/downloadimg1.png"; // Make sure these paths are correct relative to ShowCase.jsx



const FloatingBlob = ({ style }) => (
 <div
    className="absolute rounded-full opacity-15 filter blur-none"
    style={{ ...style }}
  />
);
export default function ShowCase() {
    const [visible, setVisible] = useState(false);
const sectionRef = useRef(null);
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
      } else {
        setVisible(false);
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
   <section
ref={sectionRef}
className="py-24 md:py-32 bg-white relative overflow-hidden"
>
        {/* Decorative blobs */}
{/* Decorative blobs */}
<div className="absolute rounded-full w-[140px] h-[140px] md:w-[180px] md:h-[180px] top-[30px] left-[60px]" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", filter: "blur(0px)", opacity: 0.19 }} />

<div className="absolute rounded-full w-[110px] h-[110px] top-[80px] right-[80px]" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", filter: "blur(0px)", opacity: 0.19 }} />

<div className="absolute rounded-full w-[90px] h-[90px] bottom-[80px] left-[40%]" style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", filter: "blur(0px)", opacity: 0.19 }} />

<div className="absolute rounded-full w-[140px] h-[140px] bottom-[40px] right-[40px]" style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", filter: "blur(0px)", opacity: 0.19 }} />

      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 md:mb-28">
          <h2 className="!text-[23px] lg:!text-[38px] font-[poppins] font-medium tracking-tight text-gray-900 uppercase">
            Our Work Progress
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-12 px-2 lg:px-8">

          {/* Card 1 */}
<div
className="relative bg-white rounded-[2rem] border border-gray-200 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:shadow-[#F11C6B]/10 hover:border-[#F11C6B]/10 transition-all duration-300 group mt-6 md:mt-0"
style={{
  opacity: visible ? 1 : 0,
  transform: visible ? "translateY(0px) scale(1)" : "translateY(80px) scale(0.95)",
  transition: "all 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.3s"
}}
>            
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-[#F53D82] rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-md ring-4 ring-white z-20">
              1
            </div>

             <div className="w-full aspect-[4/3] mb-10 relative flex items-center justify-center rounded-2xl overflow-hidden">

  <img
    src={Login1}
    alt="login"
    className="w-full h-full object-contain"
  />

</div>

            <h3 className="text-xl font-[poppins] font-medium tracking-tight text-gray-900 mb-4 uppercase">
              Login / Sign Up
            </h3>

            <p className="text-lg text-gray-600 leading-relaxed px-4">
              Login to iimagica with your Email & Contact Number
            </p>

          </div>


          {/* Card 2 */}
<div
className="relative bg-white rounded-[2rem] border border-gray-200 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:shadow-[#F11C6B]/10 hover:border-[#F11C6B]/10 transition-all duration-300 group mt-6 md:mt-0"
style={{
  opacity: visible ? 1 : 0,
  transform: visible ? "translateY(0px) scale(1)" : "translateY(80px) scale(0.95)",
  transition: "all 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.3s"
}}
>            
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-[#F53D82] rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-md ring-4 ring-white z-20">
              2
            </div>

        <div className="w-full aspect-[4/3] mb-10 relative flex items-center justify-center rounded-2xl overflow-hidden">

  <img
    src={Select}
    alt="select"
    className="w-full h-full object-contain"
  />

</div>

            <h3 className="text-xl font-[poppins] font-medium tracking-tight text-gray-900 mb-4 uppercase">
              Select Creatives
            </h3>

            <p className="text-lg text-gray-600 leading-relaxed px-4">
              We have a wide range of categories to choose best & suitable post
            </p>

          </div>


          {/* Card 3 */}
          <div
            className="relative bg-white rounded-[2rem] border border-gray-200 p-8 flex flex-col items-center text-center shadow-sm hover:shadow-xl hover:shadow-[#F11C6B]/10 hover:border-[#F11C6B]/10 transition-all duration-300 group mt-8 md:mt-0"
            style={{
  opacity: visible ? 1 : 0,
  transform: visible ? "translateY(0px) scale(1)" : "translateY(80px) scale(0.95)",
  transition: "all 1.4s cubic-bezier(0.22, 1, 0.36, 1) 0.3s"
}}
          >

            <div className="absolute -top-6 -left-6 w-12 h-12 bg-[#F53D82] rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-md ring-4 ring-white z-20">
              3
            </div>

            <div className="w-full aspect-[4/3] mb-10 relative flex items-center justify-center rounded-2xl overflow-hidden">

  <img
    src={Download}
    alt="download"
    className="w-full h-full object-contain"
  />

</div>

            <h3 className="text-xl font-[poppins] font-medium tracking-tight text-gray-900 mb-4 uppercase">
              Download & Share
            </h3>

            <p className="text-lg text-gray-600 leading-relaxed px-4">
              Download and share on all your social media / digital platforms
            </p>

          </div>

        </div>
      </div>
    </section>
  );
}