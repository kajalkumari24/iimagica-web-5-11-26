import React from 'react';

const CheckoutSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-7 animate-pulse">
      {/* Left Card Skeleton */}
      <section className="bg-white rounded-xl md:rounded-2xl p-5 md:p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-7 pb-4 md:pb-6 border-b-2 border-gray-100">
          <div className="w-[45px] h-[45px] md:w-[60px] md:h-[60px] bg-gray-200 rounded-lg md:rounded-xl"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>

        <div className="mb-4 md:mb-7 p-3 md:p-5 bg-gray-100 rounded-lg md:rounded-xl">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
        </div>

        <div className="flex flex-col gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-5 h-5 bg-gray-200 rounded-full mt-1 flex-shrink-0"></div>
              <div className="h-5 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </section>

      {/* Right Card Skeleton */}
      <section className="bg-white rounded-xl md:rounded-2xl p-5 md:p-8 shadow-sm border border-gray-100">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-5"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="h-12 bg-gray-300 rounded-lg mt-8"></div>
        <div className="h-12 bg-gray-200 rounded-lg mt-4"></div>
      </section>
    </div>
  );
};

export default CheckoutSkeleton;