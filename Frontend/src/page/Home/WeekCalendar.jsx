import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WeekCalendar = ({ festivals, onFullCalendarClick }) => {
  const navigate = useNavigate();
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (e) => {
    const { scrollLeft, scrollWidth, clientWidth } = e.target;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress((scrollLeft / maxScroll) * 100);
    }
  };

  return (
    <div className="mb-12">
      <div className="flex justify-between items-center mt-1 mb-4 px-1">
        <h2 className="text-[22px] md:text-2xl font-semibold text-slate-800">Weekly Events</h2>
        <button 
          onClick={onFullCalendarClick} 
          className="px-5 py-1 bg-white border border-slate-300 hover:border-[#F11C6B] rounded-full text-xs md:text-sm font-poppins font-medium text-slate-800 transition-all cursor-pointer"
        >
          Full Calendar
        </button>
      </div>

      <div 
        className="flex md:grid md:grid-cols-7 gap-2 md:gap-3 px-3 md:px-0 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onScroll={handleScroll}
      >
        {Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i);
          const dayFestivals = festivals.filter(f => {
            const fDate = new Date(f.festivalDate);
            return fDate.toDateString() === date.toDateString();
          });

          const hasEvent = dayFestivals.length > 0;

          return (
           <div
  key={i}
  onClick={() => {
    if (hasEvent) {
      const targetCategory = dayFestivals[0].linkedCategory || dayFestivals[0].festivalName;
      if (targetCategory) {
        navigate(`/category/${encodeURIComponent(targetCategory)}`);
      }
    }
  }}
          className={`flex-shrink-0 w-[calc(20%-6px)] md:w-auto snap-start bg-white relative border rounded-xl md:rounded-2xl p-1 md:p-2 py-1 md:py-2 text-center transition-all hover:shadow-md min-h-[50px] md:min-h-[82px] overflow-hidden ${hasEvent ? 'cursor-pointer' : ''}
    ${hasEvent ? 'border-[#fca6c5] shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
>
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F10D64] to-[#F56930] rounded-b-2xl"></div>
          <div className="text-[6px] md:text-[10px] font-semibold text-slate-700 mt-0.5 md:mt-1 mb-0.5 md:mb-2">
    {date.toLocaleDateString("en-US", { weekday: "short" })}
  </div>

          <div className="text-base md:text-2xl font-bold text-slate-800 mb-0 md:mb-1">
    {date.getDate()}
  </div>

  {hasEvent ? (
            <div className="flex flex-col items-center gap-0.5 md:gap-1">
              <div className="text-[7px] md:text-[9px] font-bold px-1.5 md:px-2 py-[1px] md:py-0.5 bg-rose-50 rounded-full inline-block text-[#F11C6B]">
        {dayFestivals.length} Event{dayFestivals.length > 1 ? 's' : ''}
      </div>
              <div className="text-[7px] md:text-[9px] text-[#F11C6B] leading-tight line-clamp-2 px-1">
        {dayFestivals.map((festival) => festival.festivalName || festival.name).filter(Boolean).join(', ')}
      </div>
    </div>
  ) : (
            <div className="text-[8px] md:text-[10px] text-slate-500">No Event</div>
  )}
</div>
          );
        })}
      </div>

      {/* Custom Scroll Indicator for Mobile */}
      <div className="md:hidden flex justify-center mt-1.5">
        <div className="w-[20%] h-[2px] bg-slate-200 rounded-full relative overflow-hidden">
          <div 
            className="absolute top-0 bottom-0 bg-[#F11C6B] rounded-full transition-all duration-75"
            style={{ width: '40%', left: `${scrollProgress * 0.6}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default WeekCalendar;
