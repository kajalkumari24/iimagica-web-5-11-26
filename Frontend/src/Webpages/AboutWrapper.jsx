import React, { useEffect } from "react";
import Introduction from "./Abouts/Introduction";
import MissionVision from "./Abouts/MissionVision";
import Work from "./Abouts/Work";
import WhyChooseUs from "./Abouts/WhyChooseUs";

export default function AboutWrapper() {
  // Page load hone par upar scroll karne ke liye
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col w-full bg-white">
      <Introduction />
      <MissionVision />
      <div className="py-14">
        <Work />
      </div>
      <WhyChooseUs />
    </div>
  );
}