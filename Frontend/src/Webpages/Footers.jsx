
import React from "react";
import { Link, useLocation } from "react-router-dom";
import imm4Logo from "../assets/iimagicanew.png";


export default function Footer() {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const isAuthenticated = !!token;
  const isHomePage = location.pathname === "/" || location.pathname === "";

  if (isAuthenticated && !isHomePage) {
    return null;
  }

  const handleScrollToTop = () => {
    window.scrollTo(0, 0);
  };

  return (
    <footer className="relative bg-white border-t border-gray-200 overflow-hidden">

      {/* TOP GRADIENT DIVIDER */}
      <div
  className="h-[3px] w-full"
  style={{
    background: "linear-gradient(90deg, #FF4D4D, #E84D8A, #B14DC2, #6B4DE0)"
  }}
></div>

      {/* Decorative blobs */}
      <div className="absolute w-[140px] h-[140px] md:w-64 md:h-64 bg-pink-200 rounded-full blur-3xl opacity-30 -top-20 -left-20"></div>
      <div className="absolute w-[140px] h-[140px] md:w-72 md:h-72 bg-blue-200 rounded-full blur-3xl opacity-30 bottom-0 right-0"></div>

      <div className="max-w-7xl mx-auto px-6 py-4 md:py-8 relative z-10">

        <div className="grid md:grid-cols-3 gap-8 md:gap-14">

          {/* Logo + Description */}
          <div>
            <img
              src={imm4Logo}
              alt="Imagica"
             className="mb-4 md:mb-6 w-[90px] h-[62px] md:w-[120px] md:h-[78px] lg:w-[150px] lg:h-[100px] object-cover"
            />

            <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-sm">
              Empowering creativity with smart, ready-to-use digital
              designs that help you stand out and grow.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6 relative inline-block">
              Quick Links
              <span className="absolute left-0 -bottom-2 w-10 h-[2px] bg-pink-500"></span>
            </h3>

            <ul className="space-y-2 md:space-y-4 text-sm md:text-base text-gray-700">

              <li>
  <Link
    to="/services/our-services"
    onClick={handleScrollToTop}
    className="hover:text-orange-500 hover:translate-x-1 transition block"
  >
    Services
  </Link>
</li>
              <li>
  <Link
    to="/work"
    onClick={handleScrollToTop}
    className="hover:text-orange-500 hover:translate-x-1 transition block"
  >
    Work
  </Link>
</li>

              <li>
  <Link
    to="/contact"
    onClick={handleScrollToTop}
    className="hover:text-orange-500 hover:translate-x-1 transition block"
  >
    Contact
  </Link>
</li>

             <li>
    <Link
      to="/pricing"
      onClick={handleScrollToTop}
      className="hover:text-orange-500 hover:translate-x-1 transition block">
      Pricing
    </Link>
  </li>


         <li>
    <Link
      to="/user-support"
      onClick={handleScrollToTop}
      className="hover:text-orange-500 hover:translate-x-1 transition block">
      Help & Support
    </Link>
  </li>


             {/* <li className="transition cursor-pointer hover:text-orange-500 hover:translate-x-1">
  <Link to="/privacy-policy">
    Privacy Policy
  </Link>
</li>

              <li className="transition cursor-pointer hover:text-orange-500 hover:translate-x-1">
  <Link to="/terms-conditions">
    Terms & Conditions
  </Link>
</li>


          <li className="transition cursor-pointer hover:text-orange-500 hover:translate-x-1">
  <Link to="/refund-policy">
    Refund Policy 
  </Link>
</li> */}

            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6 relative inline-block">
              Contact
              <span className="absolute left-0 -bottom-2 w-10 h-[2px] bg-pink-500"></span>
            </h3>

            <p className="text-gray-700 mb-2">
              Phone: +91 8435204953
            </p>

            <p className="text-gray-700 mb-8">
              Email: iimagica.samprakshi@gmail.com
            </p>

            {/* Social Icons */}
            {/* Social Icons */}
<div className="flex gap-4">

  {/* Facebook */}
  <a
    // href="https://facebook.com"
    target="_blank"
    rel="noopener noreferrer"
    className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center hover:scale-110 hover:shadow-lg transition"
  >
    <img
      src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg"
      alt="facebook"
      className="w-5 h-5 invert"
    />
  </a>

  {/* Twitter / X */}
  <a
    // href="https://x.com"
    target="_blank"
    rel="noopener noreferrer"
    className="w-11 h-11 rounded-full bg-black flex items-center justify-center hover:scale-110 hover:shadow-lg transition"
  >
    <img
      src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/x.svg"
      alt="twitter"
      className="w-5 h-5 invert"
    />
  </a>

  {/* Instagram */}
  <a
    // href="https://instagram.com"
    target="_blank"
    rel="noopener noreferrer"
    className="w-11 h-11 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 flex items-center justify-center hover:scale-110 hover:shadow-lg transition"
  >
    <img
      src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg"
      alt="instagram"
      className="w-5 h-5 invert"
    />
  </a>

  {/* LinkedIn */}
  <a
    // href="https://linkedin.com"
    target="_blank"
    rel="noopener noreferrer"
    className="w-11 h-11 rounded-full bg-blue-700 flex items-center justify-center hover:scale-110 hover:shadow-lg transition"
  >
    <img
      src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg"
      alt="linkedin"
      className="w-5 h-5 invert"
    />
  </a>

</div>
          </div>

        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-200 py-6 text-center text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} iimagica. All Rights Reserved.
        <span className="mx-2">|</span>
        <Link
          to="/privacy-policy"
          onClick={handleScrollToTop}
          className="hover:text-orange-500 cursor-pointer transition"
        >
          Privacy Policy
        </Link>
        <span className="mx-2">|</span>
        <Link
          to="/terms-and-conditions"
          onClick={handleScrollToTop}
          className="hover:text-orange-500 cursor-pointer transition"
        >
          Terms & Conditions
        </Link>
        <span className="mx-2">|</span>
        <Link
          to="/refund-policy"
          onClick={handleScrollToTop}
          className="hover:text-orange-500 cursor-pointer transition"
        >
          Refund Policy
        </Link>
      </div>

    </footer>
  );
}
