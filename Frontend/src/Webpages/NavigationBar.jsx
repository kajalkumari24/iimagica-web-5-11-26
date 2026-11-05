import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { ensureUserSession } from "../utils/sessionAuth";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import imm4Logo from "../assets/iimagicanew.png";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuth, setIsAuth] = useState(false);
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [showMobilePopup, setShowMobilePopup] = useState(false);
  const isHomePage = location.pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const sessionOk = await ensureUserSession();
        if (mounted) setIsAuth(sessionOk);
      } catch {
        if (mounted) setIsAuth(false);
      }
    };
    checkAuth();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLinkClick = (targetPath) => {
    setIsHamburgerOpen(false);
    setOpenDropdowns({});
    // Only clear homeScrollY when navigating AWAY from home, not when going to home
    const goingToHome = targetPath === "/home" || targetPath === "/";
    if (!goingToHome) {
      sessionStorage.removeItem("homeScrollY");
      window.scrollTo(0, 0);
    }
  };

  const isMobileOrTablet = () => {
    return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    );
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    handleLinkClick("/LoginPage");
    navigate("/LoginPage");
  };

  const toggleDropdown = (menu) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const closePopup = () => {
    setShowMobilePopup(false);
  };

  return (
    <>
    <header className={`fixed top-0 left-0 z-50 w-full border-b border-[rgba(27,25,30,0.18)] transition-all duration-300 ${isScrolled ? 'bg-white/50 backdrop-blur-md' : 'bg-white'}`}>
      <nav className="flex h-20 w-full items-center justify-between px-4 md:px-8 lg:px-6 relative">
        <Link
          to="/"
          className="flex items-center"
          onClick={() => {
            sessionStorage.setItem("bypassRedirect", "true");
            handleLinkClick("/");
          }}
        >
          <img
            className="h-12 w-[70px] md:h-[72px] md:w-[100px] object-cover"
            src={imm4Logo}
            alt="Imagica Logo"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-10 md:flex">
          <Link to={isAuth ? "/home" : "/"} className="text-[17px] font-poppins font-medium text-orange-500 transition hover:text-orange-500" onClick={() => handleLinkClick("/home")}>
            Home
          </Link>
          
          <div className="relative group">
            <Link to="services/our-services" className="text-[17px] font-poppins font-medium text-gray-800 transition hover:text-orange-500 flex items-center gap-1" onClick={() => handleLinkClick("/services")}>
              Services 
            </Link>
            <div className="absolute top-full left-0 pt-4 w-56 hidden group-hover:block z-50">
              
            </div>
          </div>
          
          <Link to="/pricing" className="text-[17px] font-poppins font-medium text-gray-800 transition hover:text-orange-500" onClick={() => handleLinkClick("/pricing")}>
            Pricing
          </Link>
          
          <Link to="/about" className="text-[17px] font-poppins font-medium text-gray-800 transition hover:text-orange-500" onClick={() => handleLinkClick("/about")}>
            About
          </Link>

          <Link to="/blogs" className="text-[17px] font-poppins font-medium text-gray-800 transition hover:text-orange-500" onClick={() => handleLinkClick("/blogs")}>
            Blog
          </Link>
          
          <div className="relative group">
            <Link to="/contact" className="text-[17px] font-poppins font-medium text-gray-800 transition hover:text-orange-500 flex items-center gap-1" onClick={() => handleLinkClick("/contact")}>
              Contact 
            </Link>
            <div className="absolute top-full left-0 pt-4 w-48 hidden group-hover:block z-50">
            
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center">
          {isAuth ? (
            <button onClick={() => { handleLinkClick("/home"); navigate("/home"); }} className="rounded-lg px-4 py-2 font-sans text-[19px] font-semibold text-gray-800 transition hover:bg-gray-100 hover:text-orange-600">
              Account
            </button>
          ) : (
            <button onClick={handleLoginClick} className="rounded-lg px-4 py-2 text-[19px] font-sans font-semibold text-gray-800 transition hover:bg-gray-100 hover:text-orange-600 border border-transparent">
              Login
            </button>
          )}
        </div>

        {/* Hamburger Icon */}
        <div className="md:hidden flex items-center">
           <button onClick={() => setIsHamburgerOpen(!isHamburgerOpen)} className="text-gray-800 p-2">
             {isHamburgerOpen ? <CloseIcon /> : <MenuIcon />}
           </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isHamburgerOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 flex flex-col px-6 py-6 gap-4 shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto">
           <Link to={isAuth ? "/home" : "/"} onClick={() => handleLinkClick("/home")} className="text-xl font-medium text-gray-800">Home</Link>

           <div className="flex flex-col gap-3">
             <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleDropdown("services")}>
               <span className="text-xl font-medium text-gray-800">Services</span>
               <ExpandMoreIcon className={`transition-transform text-gray-500 ${openDropdowns.services ? "rotate-180" : ""}`} />
             </div>
             {openDropdowns.services && (
               <div className="flex flex-col gap-3 pl-4 border-l-2 border-orange-100 ml-2 mt-1">
                  <NavLink to="/services/banners" onClick={() => handleLinkClick("/services")} className="text-lg text-gray-600">Banners</NavLink>
                  <NavLink to="/services/logos" onClick={() => handleLinkClick("/services")} className="text-lg text-gray-600">Logo Creation</NavLink>
                  <Link to="/services/website" onClick={() => handleLinkClick("/services")} className="text-lg text-gray-600">Website Templates</Link>
                  <Link to="/services/visiting-card" onClick={() => handleLinkClick("/services")} className="text-lg text-gray-600">Visiting Cards</Link>
                  <Link to="/services/digital-card" onClick={() => handleLinkClick("/services")} className="text-lg text-gray-600">Digital Cards</Link>
                  <Link to="/services/templates" onClick={() => handleLinkClick("/services")} className="text-lg text-gray-600">Templates</Link>
               </div>
             )}
           </div>

           <Link to="/pricing" onClick={() => handleLinkClick("/pricing")} className="text-xl font-medium text-gray-800">Pricing</Link>

           <Link to="/about" onClick={() => handleLinkClick("/about")} className="text-xl font-medium text-gray-800">About</Link>

           <Link to="/blogs" onClick={() => handleLinkClick("/blogs")} className="text-xl font-medium text-gray-800">Blog</Link>

           <div className="flex flex-col gap-3">
             <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleDropdown("contact")}>
               <span className="text-xl font-medium text-gray-800">Contact</span>
               <ExpandMoreIcon className={`transition-transform text-gray-500 ${openDropdowns.contact ? "rotate-180" : ""}`} />
             </div>
             {openDropdowns.contact && (
               <div className="flex flex-col gap-3 pl-4 border-l-2 border-orange-100 ml-2 mt-1">
                  <Link to="/contact" onClick={() => handleLinkClick("/contact")} className="text-lg text-gray-600">Customer Support</Link>
               </div>
             )}
           </div>

           <div className="mt-4 pt-4 border-t border-gray-100">
             {isAuth ? (
               <button onClick={() => { handleLinkClick("/home"); navigate("/home"); }} className="w-full text-center bg-gradient-to-br from-[#7C6FF7] to-[#C86DD7] hover:shadow-[0_12px_32px_rgba(124,111,247,0.45)] hover:-translate-y-[2px] transition-all duration-300 text-white text-xl font-semibold py-3 rounded-xl">Account</button>
             ) : (
               <button onClick={handleLoginClick} className="w-full text-center bg-gradient-to-br from-[#7C6FF7] to-[#C86DD7] hover:shadow-[0_12px_32px_rgba(124,111,247,0.45)] hover:-translate-y-[2px] transition-all duration-300 text-white text-xl font-semibold py-3 rounded-xl">Login</button>
             )}
           </div>
        </div>
      )}

      {/* Mobile App Popup */}
      {/* showMobilePopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(0,0,0,0.5)] backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm mx-4 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Our App!</h3>
            <p className="text-gray-600 mb-6">Use our mobile app for a smoother experience.</p>
            <a
              href="https://play.google.com/store/apps/details?id=com.infinity.imagica"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-orange-600 to-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all"
            >
              👉 Download from Play Store
            </a>
            <button
              className="mt-4 text-gray-500 hover:text-gray-800 font-medium"
              onClick={closePopup}
            >
              Close
            </button>
          </div>
        </div>
        ) */}
    </header>
    {/* Spacer Div: Ye div Navbar ke barabar ki jagah rok lega taaki content na chhupe */}
    {!isHomePage && <div className="h-20 w-full shrink-0"></div>}
    </>
  );
}