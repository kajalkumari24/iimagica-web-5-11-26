import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../url";
import Image15 from "../assets/Image15.png";
import { getAuthToken } from "../utils/auth";
import { 
  MdSupportAgent, 
  MdAutoAwesome, 
  MdForum, 
  MdCall, 
  MdMail, 
  MdLocationOn,
  MdSmartphone,
  MdAndroid,
  MdPhoneIphone
} from "react-icons/md";

export default function ContactSection() {
  const [visible1, setVisible1] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [visible3, setVisible3] = useState(false);
  
  const sectionRef1 = useRef(null);
  const sectionRef2 = useRef(null);
  const sectionRef3 = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [buttonHovered, setButtonHovered] = useState(false);

  const blobAnimation = `
  @keyframes floatBlobContact {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-15px) scale(1.02); }
  }
  `;

  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [errors, setErrors] = useState({});

  // 🔥 Scroll animation for all 3 sections in order
  useEffect(() => {
    const observer1 = new IntersectionObserver(
      ([entry]) => {
        setVisible1(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    if (sectionRef1.current) observer1.observe(sectionRef1.current);

    const observer2 = new IntersectionObserver(
      ([entry]) => {
        setVisible2(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );
    if (sectionRef2.current) observer2.observe(sectionRef2.current);

    const observer3 = new IntersectionObserver(
      ([entry]) => {
        setVisible3(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );
    if (sectionRef3.current) observer3.observe(sectionRef3.current);

    return () => {
      observer1.disconnect();
      observer2.disconnect();
      observer3.disconnect();
    };
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    let newErrors = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Invalid email";
    if (!form.message.trim()) newErrors.message = "Message is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    if (loading) return;

    setLoading(true);

    try {
      const token = getAuthToken();
      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      await axios.post(`${BASE_URL}/api/contact`, form, { headers });

      alert("✅ Message Sent Successfully!");

      setForm({
        name: "",
        email: "",
        message: "",
      });

      setErrors({});
    } catch (error) {
      console.error(error);
      alert("❌ Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      {/* 🔥 Animation */}
      <style>{blobAnimation}</style>

      {/* SECTION 1: Contact Information (Now at the very top) */}
      <section
        ref={sectionRef1}
        className="py-24 bg-white px-6 relative overflow-hidden"
      >
        {/* 🔥 BLOBS for Section 1 */}
        <div
          className="absolute w-[150px] h-[150px] md:w-[220px] md:h-[220px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)",
            opacity: 0.12,
            top: "10%",
            left: "-5%",
            animation: visible1 ? "floatBlobContact 9s ease-in-out infinite" : "none",
          }}
        />
        <div
          className="absolute w-[120px] h-[120px] md:w-[180px] md:h-[180px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)",
            opacity: 0.12,
            bottom: "10%",
            right: "-5%",
            animation: visible1 ? "floatBlobContact 11s ease-in-out infinite" : "none",
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Header Block */}
          <div
            className="text-center max-w-3xl mx-auto mb-16 transition-all duration-1000"
            style={{
              opacity: visible1 ? 1 : 0,
              transform: visible1 ? "translateY(0)" : "translateY(50px)",
            }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-900 mb-6 font-[poppins]">
              Contact Us
            </h2>

            <p className="text-gray-700 text-[16px] sm:text-[18px] whitespace-nowrap font-poppins leading-relaxed max-w-3xl mx-auto text-center w-full">
              Whether you need help with your subscription, have questions about our digital products.            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Phone Card */}
            <div
              className="bg-white border border-gray-300 rounded-2xl p-10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{
                opacity: visible1 ? 1 : 0,
                transform: visible1 ? "translateY(0)" : "translateY(60px)",
                transition: "all 0.8s ease 0.1s",
              }}
            >
              <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF7A30] flex items-center justify-center mb-8">
                <MdCall className="text-3xl" />
              </div>

              <h3 className="text-2xl sm:text-2xl font-semibold text-gray-900 mb-4 font-[poppins]">
                Call Support
              </h3>

              <p className="text-gray-600 font-poppins leading-relaxed mb-8 text-[15px]">
                Speak directly with our support team for subscription assistance, account queries, technical guidance, and help using IImagica's features and digital products.
              </p>

              <p className="text-lg mb-9 sm:text-xl font-poppins font-semibold text-[#FF7A30]">
                +91 8435204953
              </p>

              {/* <p className="text-xl sm:text-xl font-poppins font-semibold text-[#FF7A30] mb-4">
                +91 8839665594
              </p> */}

              <p className="text-gray-500 font-poppins text-[14px]">
                Monday – Saturday<br />
                9:00 AM – 7:00 PM (IST)
              </p>
            </div>

            {/* Email Card */}
            <div
              className="bg-white border border-gray-300 rounded-2xl p-10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{
                opacity: visible1 ? 1 : 0,
                transform: visible1 ? "translateY(0)" : "translateY(60px)",
                transition: "all 0.8s ease 0.2s",
              }}
            >
              <div className="w-16 h-16 rounded-full bg-pink-50 text-[#f10d64] flex items-center justify-center mb-8">
                <MdMail className="text-3xl" />
              </div>

              <h3 className="text-2xl sm:text-2xl font-semibold text-gray-900 mb-4 font-[poppins]">
                Email Us
              </h3>

              <p className="text-gray-600 font-poppins leading-relaxed mb-8 text-[15px]">
                Have a detailed question about our platform, subscriptions,
                digital products, or business collaboration?
                Send us an email and we'll respond as quickly as possible.
              </p>

              <p className="text-[17px] sm:text-lg font-poppins font-semibold text-[#f10d64] break-all mb-7">
                iimagica.samprakshi@gmail.com
              </p>

              <p className="text-gray-500 font-poppins text-sm mt-3">
                Average response within 24 hours
              </p>
            </div>

            {/* Download App */}
            <div
              className="bg-white border border-gray-300 rounded-2xl p-10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{
                opacity: visible1 ? 1 : 0,
                transform: visible1 ? "translateY(0)" : "translateY(60px)",
                transition: "all 0.8s ease 0.3s",
              }}
            >
              <div className="w-16 h-16 rounded-full bg-orange-50 text-[#FF7A30] flex items-center justify-center mb-8">
                <MdSmartphone className="text-3xl" />
              </div>

              <h3 className="text-2xl sm:text-2xl font-semibold text-gray-900 mb-4 font-[poppins]">
                Download Our App
              </h3>

              <p className="text-gray-600 font-poppins leading-relaxed mb-8 text-[15px]">
                Experience IImagica on your mobile. Create personalized festival posts, branding templates, social media frames, and digital products anytime, anywhere.
              </p>

              <div className="space-y-3">
                <a
                  href="#"
                  className="flex items-center gap-3 font-poppins font-semibold text-[18px] text-gray-900 hover:text-[#FF7A30] transition-colors"
                >
                  <MdAndroid className="text-xl font-poppins text-[#FF7A30]" />
                  Google Play Store
                </a>

                <a
                  href="#"
                  className="flex items-center gap-3 font-poppins font-semibold text-[18px] text-gray-900 hover:text-[#FF7A30] transition-colors"
                >
                  <MdPhoneIphone className="text-xl font-poppins text-[#FF7A30]" />
                  Apple App Store
                </a>
              </div>

              <p className="text-gray-500 font-poppins text-sm mt-6">
                Download the iimagica App 
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 2: Why Connect With Us Section */}
      <section
        ref={sectionRef2}
        className="py-24 bg-white px-6 relative overflow-hidden border-t border-gray-100/50"
      >
        {/* 🔥 BLOBS for Section 2 */}
        <div
          className="absolute w-[150px] h-[150px] md:w-[220px] md:h-[220px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)",
            opacity: 0.12,
            top: "10%",
            left: "-5%",
            animation: visible2
              ? "floatBlobContact 9s ease-in-out infinite"
              : "none",
          }}
        />
        <div
          className="absolute w-[120px] h-[120px] md:w-[180px] md:h-[180px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)",
            opacity: 0.12,
            bottom: "10%",
            right: "-5%",
            animation: visible2
              ? "floatBlobContact 11s ease-in-out infinite"
              : "none",
          }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Header block */}
          <div
            className="max-w-3xl mx-auto text-center mb-16 transition-all duration-1000"
            style={{
              opacity: visible2 ? 1 : 0,
              transform: visible2 ? "translateY(0)" : "translateY(50px)",
            }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-gray-900 mb-6 font-[poppins]">
              Why Connect With Us?
            </h2>

            <p className="text-gray-600 text-[16px] font-poppins sm:text-[17px] leading-relaxed max-w-2xl mx-auto">
              At iimagica, we are committed to helping businesses, professionals, and organizations build a strong digital presence with ease.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <div
              className="bg-white p-8 rounded-2xl border border-gray-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{
                opacity: visible2 ? 1 : 0,
                transform: visible2 ? "translateY(0)" : "translateY(60px)",
                transition: "all 0.8s ease 0.1s",
              }}
            >
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-[#FF7A30]">
                <MdSupportAgent className="text-2xl" />
              </div>

              <h3 className="font-semibold text-gray-900 text-lg mb-3 font-[poppins]">
                Dedicated Customer Support
              </h3>

              <p className="text-gray-600 font-poppins text-[15px] leading-relaxed">
                Our support team is available to assist you with account setup, subscriptions, template usage, digital downloads, and any technical questions to ensure a smooth experience.
              </p>
            </div>

            {/* Card 2 */}
            <div
              className="bg-white p-8 rounded-2xl border border-gray-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{
                opacity: visible2 ? 1 : 0,
                transform: visible2 ? "translateY(0)" : "translateY(60px)",
                transition: "all 0.8s ease 0.2s",
              }}
            >
              <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center mb-6 text-[#f10d64]">
                <MdAutoAwesome className="text-2xl" />
              </div>

              <h3 className="font-semibold text-gray-900 text-lg mb-3 font-[poppins]">
                Expert Product Guidance
              </h3>

              <p className="text-gray-600 font-poppins text-[15px] leading-relaxed">
                Need help selecting the right subscription, digital template, logo, or branding solution? Our experts can help you choose the best option based on your professional or business needs.
              </p>
            </div>

            {/* Card 3 */}
            <div
              className="bg-white p-8 rounded-2xl border border-gray-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{
                opacity: visible2 ? 1 : 0,
                transform: visible2 ? "translateY(0)" : "translateY(60px)",
                transition: "all 0.8s ease 0.3s",
              }}
            >
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-[#FF7A30]">
                <MdForum className="text-2xl" />
              </div>

              <h3 className="font-semibold text-gray-900 text-lg mb-3 font-[poppins]">
                Fast & Reliable Communication
              </h3>

              <p className="text-gray-600 font-poppins text-[15px] leading-relaxed">
                We value every customer inquiry and strive to respond quickly with accurate information. Your feedback and suggestions also help us improve iimagica and deliver better digital branding solutions.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 3: Contact Form Section (Now at the bottom) */}
      <section
        ref={sectionRef3}
        className="min-h-screen bg-white flex items-center justify-center px-6 py-16 relative overflow-hidden border-t border-gray-100/50"
      >
        {/* 🔥 BLOBS for Section 3 */}
        <div
          className="absolute w-[130px] h-[130px] md:w-[214px] md:h-[214px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)",
            opacity: 0.19,
            top: "40px",
            left: "40px",
            animation: visible3
              ? "floatBlobContact 8s ease-in-out infinite"
              : "none",
          }}
        />
        <div
          className="absolute w-[130px] h-[130px] md:w-[182px] md:h-[182px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)",
            opacity: 0.19,
            top: "80px",
            right: "80px",
            animation: visible3
              ? "floatBlobContact 10s ease-in-out infinite"
              : "none",
          }}
        />
        <div
          className="absolute w-[130px] h-[130px] md:w-[166px] md:h-[166px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, #FF9E66 0%, #FF7A30 100%)",
            opacity: 0.19,
            bottom: "80px",
            left: "35%",
            animation: visible3
              ? "floatBlobContact 7s ease-in-out infinite"
              : "none",
          }}
        />
        <div
          className="absolute w-[130px] h-[130px] md:w-[198px] md:h-[198px] rounded-full z-0"
          style={{
            background: "radial-gradient(circle, #FF6EB5 0%, #f10d64 100%)",
            opacity: 0.19,
            bottom: "40px",
            right: "40px",
            animation: visible3
              ? "floatBlobContact 9s ease-in-out infinite"
              : "none",
          }}
        />

        {/* 🔥 MAIN CONTENT */}
        <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10">

          {/* LEFT - IMAGE */}
          <div
            className="w-full h-[250px] md:h-[400px] rounded-2xl overflow-hidden"
            style={{
              opacity: visible3 ? 1 : 0,
              transform: visible3
                ? "translateX(0px)"
                : "translateX(-80px)",
              transition: "all 1s ease",
            }}
          >
            <img
              src={Image15}
              alt="Contact Illustration"
              className="w-full h-full object-cover shadow-lg"
            />
          </div>

          {/* RIGHT - FORM */}
          <div
            style={{
              opacity: visible3 ? 1 : 0,
              transform: visible3
                ? "translateX(0px)"
                : "translateX(80px)",
              transition: "all 1s ease 0.2s",
            }}
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2 text-center md:text-left">
              Get in Touch
            </h2>

            <p className="text-gray-700 font-poppins mb-6 text-base text-center md:text-left">
              Ready to create something impactful? Let’s connect 🤝
            </p>

            <div className="max-w-md mx-auto md:mx-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name}</p>
                  )}
                </div>

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Your Email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                  )}
                </div>

                <div>
                  <textarea
                    name="message"
                    placeholder="Your Message"
                    rows="4"
                    value={form.message}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg text-black bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm">{errors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  onMouseEnter={() => setButtonHovered(true)}
                  onMouseLeave={() => setButtonHovered(false)}
                  className="w-full py-3 rounded-xl cursor-pointer font-semibold text-white hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
                  style={{
                    background: buttonHovered ? "#FF9559" : "#FF7A30"
                  }}
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}