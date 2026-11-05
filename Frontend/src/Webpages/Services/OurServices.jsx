import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Import images
import card2Image from "../../assets/bannersimg.png";
import logosImage from "../../assets/logoimg.png";
import websiteImage from "../../assets/websiteimage.png";
import visitingCardImage from "../../assets/visitingcard.png";
import TemplateImage from "../../assets/template.png";
import BusinessImage from  "../../assets/digitalcard.png"

const FloatingBlob = ({ style }) => (
  <div
    className="absolute rounded-full opacity-12 blur-sm"
    style={{ ...style }}
  />
);

const ServicesSection = () => {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);




  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect(); // ✅ stop observing
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);
  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-10 bg-gray-50 border-y border-gray-100 relative overflow-hidden"
    >
      <style>{`
@keyframes floatCard {
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

@keyframes floatBlob {
  0%,100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
`}</style>
      {/* Blob 1 */}
      <div
        className="absolute rounded-full animate-[floatBlob_6s_ease-in-out_infinite] w-24 h-24 md:w-[180px] md:h-[180px] top-10 md:top-[40px] left-4 md:left-[60px]"
        style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }}
      />

      {/* Blob 2 */}
      <div
        className="absolute rounded-full animate-[floatBlob_7s_ease-in-out_infinite] w-20 h-20 md:w-[120px] md:h-[120px] top-24 md:top-[120px] right-4 md:right-[80px]"
        style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }}
      />

      {/* Blob 3 */}
      <div
        className="absolute rounded-full animate-[floatBlob_5s_ease-in-out_infinite] w-16 h-16 md:w-[100px] md:h-[100px] bottom-10 md:bottom-[20px] left-10 md:left-[40%]"
        style={{ background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)", opacity: 0.19 }}
      />

      {/* Blob 4 */}
      <div
        className="absolute rounded-full animate-[floatBlob_8s_ease-in-out_infinite] w-24 h-24 md:w-[140px] md:h-[140px] bottom-10 md:bottom-[40px] right-10 md:right-[60px]"
        style={{ background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)", opacity: 0.19 }}
      />
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-14">
          <h2 className="!text-[28px] md:!text-4xl lg:!text-5xl font-[poppins] font-medium tracking-tight text-gray-900 mb-4 md:mb-6">
            Our Services
          </h2>
          <p className="text-lg md:text-xl text-gray-600">
            From websites to branding, we cover all your digital needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">

          {/* Service Card 1 */}
          <div onClick={() =>
            navigate("/services/logos", {
              state: { order: "logo" }
            })
          }


            className="bg-white rounded-3xl cursor-pointer overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col group"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0px)" : "translateY(40px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <div style={{ animation: "floatCard 6s ease-in-out infinite" }}></div>
            <div className="w-full h-56 md:h-64 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 relative flex items-center justify-center p-6 md:p-8 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.15] bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="relative z-10 w-32 h-32 rounded-full bg-white shadow-xl flex items-center justify-center p-4 transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500">
                <img
                  src={logosImage}
                  alt="Logo abstract"
                  className="w-full h-full object-cover rounded-full mix-blend-multiply opacity-90"
                />
                <div className="absolute bottom-[-24px] text-center w-full text-gray-400 font-medium tracking-widest text-xs uppercase">
                  YourLogo
                </div>
              </div>
            </div>
            <div className="p-8 md:p-10 flex flex-col items-center text-center flex-grow bg-white relative z-20">
              <h3 className="text-xl md:text-2xl font-[poppins] font-medium text-gray-900 mb-3 md:mb-4 tracking-tight">
                ServiceLogo
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Modern, responsive & fast websites built with love
              </p>
            </div>
          </div>

          {/* Service Card 2 */}
          <div onClick={() =>
            navigate("/services/website", {
              state: { order: "template" }
            })
          }
            className="bg-white cursor-pointer rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col group"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0px)" : "translateY(40px)",
              transition: "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s",
            }}
          >
            <div className="w-full h-56 md:h-64 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 relative flex items-center justify-center p-6 md:p-8 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.15] bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="relative z-10 w-48 h-32 rounded-xl bg-white shadow-xl flex items-center justify-center p-1 transform group-hover:scale-105 group-hover:rotate-1 transition-transform duration-500">
                <img
                  src={websiteImage}
                  alt="Website Template"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="p-8 md:p-10 flex flex-col items-center text-center flex-grow bg-white relative z-20">
              <h3 className="text-xl md:text-2xl font-[poppins] font-medium text-gray-900 mb-3 md:mb-4 tracking-tight">
                Website Template
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Creative, eye-catching designs for strong branding
              </p>
            </div>
          </div>

          {/* Service Card 3 */}
          <div onClick={() =>
            navigate("/services/visiting-card", {
              state: { order: "visiting" }
            })
          }
            className="bg-white cursor-pointer rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col group"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0px)" : "translateY(40px)",
              transition: "opacity 0.6s ease 1s, transform 0.6s ease 1s",
            }}
          >
            <div className="w-full h-56 md:h-64 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 relative flex items-center justify-center p-6 md:p-8 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.15] bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="absolute w-40 h-24 bg-white rounded-lg shadow-lg border border-gray-100 p-3 transform rotate-[15deg] translate-x-4 -translate-y-4 group-hover:rotate-[20deg] group-hover:translate-x-6 transition-all duration-500 overflow-hidden">
                  <div className="w-full h-full bg-gray-50 rounded flex flex-col justify-between p-2">
                    <div className="w-1/3 h-1 bg-gray-200 rounded"></div>
                    <div className="flex justify-between items-end">
                      <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
                      <div className="w-1/4 h-2 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute w-40 h-24 bg-[#1a1333] rounded-lg shadow-xl border border-gray-800 p-2 transform -rotate-[5deg] -translate-x-2 translate-y-2 group-hover:-rotate-[10deg] group-hover:-translate-x-4 transition-all duration-500 overflow-hidden flex items-center justify-center">
                  <div className="relative w-full h-full">
                    <img
                      src={visitingCardImage}
                      alt="Visiting Card preview"
                      className="absolute inset-0 w-full h-full object-cover "
                    />
                    {/* <div className="absolute bottom-2 left-2 right-2 text-center text-[#ffcc00] text-[10px] font-semibold uppercase tracking-wider z-10">
                      Company
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 md:p-10 flex flex-col items-center text-center flex-grow bg-white relative z-20">
              <h3 className="text-xl md:text-2xl font-[poppins] font-medium text-gray-900 mb-3 md:mb-4 tracking-tight">
                Visiting Cards
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Clean, professional cards to make your first impression count
              </p>
            </div>
          </div>

          {/* Service Card 1 */}
          {/* <div onClick={() =>
  navigate("/services/banner", {
    state: { order: "logo" }
  })
}
          
  
className="bg-white rounded-3xl cursor-pointer overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col group"
style={{
  opacity: visible ? 1 : 0,
  transform: visible ? "translateY(0px)" : "translateY(40px)",
  transition: "opacity 0.6s ease, transform 0.6s ease",
}}
>
  <div style={{ animation: "floatCard 6s ease-in-out infinite" }}></div>
            <div className="w-full h-56 md:h-64 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 relative flex items-center justify-center p-6 md:p-8 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.15] bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="relative z-10 w-32 h-32 rounded-full bg-white shadow-xl flex items-center justify-center p-4 transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=200&q=80"
                  alt="Logo abstract"
                  className="w-full h-full object-cover rounded-full mix-blend-multiply opacity-90"
                />
                <div className="absolute bottom-[-24px] text-center w-full text-gray-400 font-medium tracking-widest text-xs uppercase">
                  YourLogo
                </div>
              </div>
            </div>
            <div className="p-8 md:p-10 flex flex-col items-center text-center flex-grow bg-white relative z-20">
              <h3 className="text-xl md:text-2xl font-[poppins] font-medium text-gray-900 mb-3 md:mb-4 tracking-tight">
                Banners
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Modern, responsive & fast websites built with love
              </p>
            </div>
          </div> */}

          <div
            onClick={() =>
              navigate("/services/banners", {
                state: { order: "logo" }
              })
            }
            className="bg-white rounded-3xl cursor-pointer overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col group"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0px)" : "translateY(40px)",
              transition: "opacity 0.6s ease, transform 0.6s ease",
            }}
          >
            <div style={{ animation: "floatCard 6s ease-in-out infinite" }}></div>

            {/* 🔥 IMAGE SECTION */}
            <div className="w-full h-56 md:h-64 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 relative flex items-center justify-center p-6 md:p-8 overflow-hidden">

              {/* Background Banner Style Image */}
              <div className="absolute inset-0 opacity-[0.15] bg-[url('https://images.unsplash.com/photo-1559027615-cd4628902d4a?q=80&w=1200&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>

              {/* Main Banner Preview */}
              <div className="relative z-10 w-48 h-32 rounded-xl bg-white shadow-xl flex items-center justify-center p-1 transform group-hover:scale-105 group-hover:rotate-1 transition-transform duration-500">
                <img
                  src={card2Image}
                  alt="Banner design"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

            </div>

            {/* 🔥 CONTENT */}
            <div className="p-8 md:p-10 flex flex-col items-center text-center flex-grow bg-white relative z-20">
              <h3 className="text-xl md:text-2xl font-[poppins] font-medium text-gray-900 mb-3 md:mb-4 tracking-tight">
                Banners
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Eye-catching banners for ads, social media & promotions
              </p>
            </div>
          </div>

          {/* Service Card 2 */}
          <div onClick={() =>
            navigate("/services/digital-card", {
              state: { order: "template" }
            })
          }
            className="bg-white rounded-3xl cursor-pointer overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col group"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0px)" : "translateY(40px)",
              transition: "opacity 0.6s ease 0.5s, transform 0.6s ease 0.5s",
            }}
          >
            <div className="w-full h-56 md:h-64 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 relative flex items-center justify-center p-6 md:p-8 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.15] bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="relative z-10 w-48 h-32 rounded-xl bg-white shadow-xl flex items-center justify-center p-0 transform group-hover:scale-105 group-hover:rotate-1 transition-transform duration-500">
                <img
                  src={BusinessImage}
                  alt="Digital Card design"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="p-8 md:p-10 flex flex-col items-center text-center flex-grow bg-white relative z-20">
              <h3 className="text-xl md:text-2xl font-[poppins] font-medium text-gray-900 mb-3 md:mb-4 tracking-tight">
                Digital Cards
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Creative, eye-catching designs for strong branding
              </p>
            </div>
          </div>

          {/* Service Card 3 */}
          <div onClick={() =>
            navigate("/services/templates", {
              state: { order: "visiting" }
            })
          }
            className="bg-white cursor-pointer rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col group"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0px)" : "translateY(40px)",
              transition: "opacity 0.6s ease 1s, transform 0.6s ease 1s",
            }}
          >
            <div className="w-full h-56 md:h-64 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 relative flex items-center justify-center p-6 md:p-8 overflow-hidden">
              <div className="absolute inset-0 opacity-[0.15] bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
              <div className="relative z-10 w-48 h-32 rounded-xl bg-white shadow-xl flex items-center justify-center p-1 transform group-hover:scale-105 group-hover:rotate-1 transition-transform duration-500">
                <img
                  src={TemplateImage}
                  alt="Template design"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="p-8 md:p-10 flex flex-col items-center text-center flex-grow bg-white relative z-20">
              <h3 className="text-xl md:text-2xl font-[poppins] font-medium text-gray-900 mb-3 md:mb-4 tracking-tight">
                Templates
              </h3>
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Clean, professional cards to make your first impression count
              </p>
            </div>
          </div>
        </div>



      </div>

    </section>
  );
};

export default ServicesSection;
