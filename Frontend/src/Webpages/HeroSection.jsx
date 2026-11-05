import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated } from "../utils/auth";
import imm4Logo from "../assets/imm4.png";
import "./HeroSection.css";

import img2 from "../assets/img2.png";
import Web_Templates from "../assets/Web_Templates.png";
import Visiting_Card from "../assets/Visiting-Card.png";
import Logo_Templates from "../assets/Logo_Templates.png";
import img4 from "../assets/img4.png";

const items = [
  { text: "Website Templates", img: Web_Templates },
  { text: "Visiting Cards", img: Visiting_Card },
  { text: "Logos", img: Logo_Templates },
  { text: "Posters", img: img4 },
  { text: "Frames", img: img2 },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Preload all slider images in the background for low speed internet
  useEffect(() => {
    items.forEach((item) => {
      const img = new Image();
      img.src = item.img;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleBrowseTemplates = () => {
    if (isAuthenticated()) {
      window.scrollTo(0, 0);
      navigate("/home");
      return;
    }

    navigate("/LoginPage", { state: { returnUrl: "/home" } });
  };

  // ... (rest of the component remains unchanged)
  return (
    <div ref={sectionRef} className="hero-section">
      <div className="blob-a blob blob-1" />
      <div className="blob-b blob blob-2" />
      <div className="blob-c blob blob-3" />
      <div className="blob-d blob blob-4" />
      <div className="blob-a blob blob-5" />
      <div className="blob-b blob blob-6" />

      <div className="hero-body">
        <div>
          <div className={`${isVisible ? "anim-up-1" : "opacity-0"} hero-banner mt-[5px] md:mt-0 !py-2 !px-3 md:!py-1.5 md:!px-4`}>
            <span className="hero-banner-text !text-[8px] md:!text-[11px] !leading-tight">New designs weekly</span>
          </div>

          <h1 className={`${isVisible ? "start-anim" : ""} hero-headline`}>
            <span className="word-anim">
              <span>Discover</span>{" "}
              <br className="mobile-headline-break" />
              <span className="hero-headline-gradient pb-0.5">Ready-to-Use</span>
              <br />
              <span className="text-slider pb-0.5">
                <span key={items[index].text} className="text-slide">
                  {items[index].text}&nbsp;
                </span>
              </span>
              <br />
              <span className="hero-headline-gradient-italic -mt-45 pb-0.5">
                iimagica&nbsp;
              </span>
            </span>
          </h1>

          <p className={`${isVisible ? "anim-up-3" : "opacity-0"} hero-paragraph-1`}>
            Access a curated collection of posters, banners, and templates designed by professionals.
          </p>
          <p className={`${isVisible ? "anim-up-3" : "opacity-0"} hero-paragraph-2`}>
            New designs added weekly to help your brand stay fresh.
          </p>

          <div className={`${isVisible ? "anim-up-4" : "opacity-0"} hero-buttons`}>
            <button className="hero-btn hero-btn-primary" onClick={handleBrowseTemplates}>
              Browse Templates
            </button>
            <Link
              to="/pricing"
              className="hero-btn hero-btn-secondary !py-[10px] sm:!py-[12px] md:!py-[17px]"
              onClick={() => window.scrollTo(0, 0)}
            >
              See Pricing
            </Link>
          </div>

          <div className={`${isVisible ? "anim-up-4" : "opacity-0"} hero-stats`}>
            {[["500+", "Templates"], ["10K+", "Users"], ["Weekly", "Updates"]].map(([n, l]) => (
              <div key={l}>
                <div className="hero-stat-number">{n}</div>
                <div className="hero-stat-label">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${isVisible ? "anim-right" : "opacity-0"} hero-cards-container`}>
          <div className="floating-wrapper">
            <div className="float-main">
              <img
                src={items[index].img}
                alt={items[index].text}
                draggable={false}
                fetchpriority="high"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
