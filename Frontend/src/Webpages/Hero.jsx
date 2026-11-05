import React from "react";
import HeroSection from "./HeroSection"; // Import the new HeroSection component

// This component now acts as a wrapper for the new HeroSection UI
// This allows LandingPage.jsx to continue importing 'Hero' without changes
const Hero = () => {
  return (
    <HeroSection />
  );
};

export default Hero;
