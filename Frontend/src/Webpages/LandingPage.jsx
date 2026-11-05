import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { ensureUserSession } from "../utils/sessionAuth";
import NavigationBar from "./NavigationBar";
import Hero from './Hero';
import OurServices from "./Services/OurServices";
// import Services from "./Services";
import ShowCase from './ShowCase';
import WhyUse from './WhyUse';
// import CTAS from './CTAS';
import About from './About';
import Contact from './Contact';
import ReviewSection from '../components/ReviewSection';
// import Footer from './Footer';
import Footers from './Footers';
import ServicesCards from './Abouts/Work';

const LandingPage = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(() => {
    const isSessionAuth = sessionStorage.getItem("userAuthorized") === "true";
    const isLocalAuth = localStorage.getItem("isLoggedIn") === "true";
    const bypassRedirect = sessionStorage.getItem("bypassRedirect") === "true";
    return (isSessionAuth || isLocalAuth) && !bypassRedirect;
  });

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      // If we explicitly bypassed redirect (e.g. by clicking the logo), clear flag and skip
      if (sessionStorage.getItem("bypassRedirect") === "true") {
        sessionStorage.removeItem("bypassRedirect");
        if (mounted) {
          setChecking(false);
        }
        return;
      }

      // If session storage already knows we are authorized, redirect immediately
      if (sessionStorage.getItem("userAuthorized") === "true") {
        navigate("/home", { replace: true });
        return;
      }

      // Otherwise, if localStorage says we might be logged in, verify the session
      if (localStorage.getItem("isLoggedIn") === "true") {
        try {
          const sessionOk = await ensureUserSession();
          if (sessionOk && mounted) {
            navigate("/home", { replace: true });
            return;
          }
        } catch (err) {
          console.error("Auth check on landing page failed:", err);
        }
      }

      if (mounted) {
        setChecking(false);
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#F10D64]" />
      </div>
    );
  }

  return (
    <div>
      <NavigationBar />
      <Hero />
      <OurServices />
      {/* <Services/> */}
      <ShowCase />
      <WhyUse />
      <ServicesCards hideBanner={true} />
      {/* <CTAS/>  */}
      <About />
      <Contact />
      <ReviewSection showFormForEligible={false} />
      {/* <Footer/> */}
      <Footers />
    </div>
  );
};

export default LandingPage;