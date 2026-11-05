 import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import { BASE_URL } from '../../url';


import { ChevronLeft, ChevronRight } from "lucide-react";



const ThisWeekEvents = ({ festivals, onEventClick }) => {
  const [slides, setSlides] = useState([]);
  const scrollRef = useRef(null);
  const [current, setCurrent] = useState(0);

  const upcomingEvents = festivals
    .filter(f => {
      if (!f?.festivalDate) return false;
      const d = new Date(f.festivalDate);
      d.setHours(0, 0, 0, 0);
      const start = new Date(); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(end.getDate() + 6);
      return d >= start && d <= end;
    })
    .sort((a, b) => new Date(a.festivalDate) - new Date(b.festivalDate));

     // Auto-slide for the mobile image slider
   // 🔥 API se slides lana
useEffect(() => {
  const fetchSlides = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/home-slides/public`);

      // console.log("🔥 SLIDES DATA:", res.data); 

      setSlides(res.data || []);
    } catch (err) {
      console.error("Slide API error:", err);
    }
  };

  fetchSlides();
}, []);


// 🔥 Auto slider (slides ke basis pe)
useEffect(() => {
  if (slides.length === 0) return;

  const interval = setInterval(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, 3000);

  return () => clearInterval(interval);
}, [slides]);

    

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -290 : 290, behavior: 'smooth' });
    }
  };

if (upcomingEvents.length === 0 && slides.length === 0) return null;
  return (
    <div className="mb-10 -mt-4">
      <div className="flex items-center justify-end mb-4 px-1">
       <div className="flex gap-2">
    <button 
      onClick={() => scroll('left')} 
      className="w-9 h-9 flex items-center justify-center bg-white border border-slate-300 rounded-full hover:bg-slate-100 transition-colors"
    >
      <ChevronLeft className="w-5 h-5 text-slate-900" />
    </button>
    
    <button 
      onClick={() => scroll('right')} 
      className="w-9 h-9 flex items-center justify-center bg-white border border-slate-300 rounded-full hover:bg-slate-100 transition-colors"
    >
      <ChevronRight className="w-5 h-5 text-slate-900" />
    </button>
  </div>
      </div>
          <div 
  ref={scrollRef} 
  className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory 
             scrollbar-none -ms-overflow-style-none"
  style={{
    scrollbarWidth: 'none',           // Firefox
    msOverflowStyle: 'none'           // IE & Edge
  }}
>
        {upcomingEvents.map((event, index) => {
          const imageUrl = event.images?.[0]?.url || event.images?.[0] || 
                          "https://via.placeholder.com/300x180?text=No+Image";

          return (
            <div
              key={event._id || event.festivalName}
              onClick={() => onEventClick(event)}
              className=" w-[180px] sm:w-[200px] md:w-[255px] flex-shrink-0 bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-2xl transition-all snap-start cursor-pointer group"
            >
             <div className="relative">
  <img
    src={imageUrl}
    alt={event.festivalName}
    loading={index < 4 ? "eager" : "lazy"}
    fetchpriority={index < 4 ? "high" : "auto"}
    decoding="async"
    className="w-full h-40 object-cover transition-all duration-500 opacity-0 md:opacity-100 group-hover:scale-105"
    onLoad={(e) => e.target.classList.remove('opacity-0')}
    onError={(e) => e.target.classList.remove('opacity-0')}
  />

  {/* View Overlay like CategoryPage */}
  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
    <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
      View
    </div>
  </div>

  {/* 🔥 Date Badge */}
  {event.festivalDate && (
    <div className="absolute top-2 left-2.5 bg-white/90 backdrop-blur-sm border-gray-200  text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
      {new Date(event.festivalDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      })}
    </div>
  )}
</div>
              <div className="p-2.5">
                <h4 className="text-[13px] sm:text-base font-semibold -mt-0.5 text-slate-800 line-clamp-2">{event.festivalName}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(event.festivalDate).toLocaleDateString('en-IN', { 
                    day: 'numeric', month: 'short', year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {/* 🔥 Bottom Preview Images */}
     {/* 🔥 Static Full Width Image Row */}
<div className="mt-6 w-full">

  {/* 🔥 DESKTOP GRID */}
  {/*
  <div className="hidden sm:grid grid-cols-3 gap-3">
   {slides.map((slide, i) => (
  <div key={i} className="w-full h-full object-cover">
    {slide.type === "video" ? (
      <video
        src={slide.imageUrl}
        className="w-full h-36 rounded-xl object-cover"
        autoPlay
        muted
        loop
      />
    ) : (
      <img
        src={slide.imageUrl}
        className="w-full h-36 rounded-xl object-cover"
      />
    )}
  </div>
))}
  </div>
  */}

  {/* 🔥 MOBILE SLIDER */}
 <div className="sm:hidden">
  <div className="relative overflow-hidden rounded-xl">
    <div
      className="flex transition-transform duration-300 w-full"
      style={{ transform: `translateX(-${current * 100}%)` }}
    >
      {slides.map((slide , i) => (
        <div key={i} className="min-w-full flex-shrink-0 h-[80px] sm:h-24 rounded-xl overflow-hidden">
          <img 
            src={slide.imageUrl} 
            className="w-full h-full object-cover" 
            loading={i === 0 ? "eager" : "lazy"}
            fetchpriority={i === 0 ? "high" : "auto"}
            decoding="async"
          />
        </div>
      ))}
    </div>
  </div>

  {/* DOTS */}
  <div className="flex justify-center mt-3 gap-2">
    {slides.map((_, i) => (
      <div
        key={i}
        onClick={() => setCurrent(i)}
        className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${
          current === i ? "bg-violet-600 w-4" : "bg-slate-300"
        }`}
      />
    ))}
  </div>
</div>

</div>

<div className="mt-8 flex justify-center">
  {slides.length > 0 && (
    <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-lg border border-slate-100/60 transition-shadow hover:shadow-xl">

      {/* 🔥 SLIDING BIG IMAGE */}
      {slides[current]?.type === "video" ? (
        <video
          src={slides[current]?.imageUrl}
          className="w-full h-[130px] sm:h-[280px] md:h-[360px] lg:h-[420px] object-cover"
          autoPlay
          muted
          loop
        />
      ) : (
        <img
          src={slides[current]?.imageUrl}
          className="w-full h-[130px] sm:h-[100px] md:h-[160px] lg:h-[220px] object-cover"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
      )}

    </div>
  )}
</div>
    </div>
  );
};

export default ThisWeekEvents;
