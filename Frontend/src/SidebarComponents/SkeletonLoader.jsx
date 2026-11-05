import React from "react";
import Header from "../page/Header/Header";

const SkeletonLoader = () => {
  return (
    <div className="bg-[#FAFAFA] min-h-screen pb-12 antialiased overflow-x-hidden w-full">
      <Header />
      <div className="h-20 md:h-24 w-full shrink-0"></div>

      <main className="max-w-[1300px] mx-auto animate-pulse px-4 lg:px-0 mt-3">
        {/* Header row: Title and Button */}
        <div className="flex flex-row justify-between items-center mb-10 gap-5 lg:my-3">
          <div>
            <div className="h-9 w-48 bg-gray-300 rounded-md mb-3"></div>
            <div className="h-5 w-96 bg-gray-200 rounded-md hidden sm:block"></div>
          </div>
          <div className="h-10 w-36 bg-gray-300 rounded-xl flex-shrink-0"></div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start w-full gap-6">
          {/* Left: Avatar & Upload Controls */}
          <aside className="w-full lg:w-[280px] flex-shrink-0 flex flex-col gap-6">
            <div className="bg-white/80 rounded-2xl border border-gray-100 p-7 shadow-sm flex flex-col items-center">
              <div className="w-48 h-48 rounded-3xl bg-gray-200 mb-6"></div>
              <div className="w-24 h-3 bg-gray-200 rounded mb-2"></div>
              <div className="w-32 h-3 bg-gray-200 rounded mb-7"></div>
              <div className="w-full flex flex-col gap-3.5 mb-7">
                <div className="h-11 w-full bg-gray-200 rounded-xl"></div>
                <div className="h-11 w-full bg-gray-200 rounded-xl"></div>
                <div className="h-11 w-full bg-gray-200 rounded-xl"></div>
              </div>
              <div className="w-32 h-6 bg-gray-200 rounded"></div>
            </div>
          </aside>

          {/* Center: Personal Info */}
          <section className="w-full lg:w-[600px] flex-shrink-0 min-h-[160px] bg-white/80 rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-7 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
              <div className="w-48 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="p-7 flex flex-col gap-6">
              <div>
                <div className="w-20 h-4 bg-gray-200 rounded mb-2.5"></div>
                <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="w-48 h-6 bg-gray-200 rounded"></div>
                <div className="w-64 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="w-16 h-4 bg-gray-200 rounded mb-2.5"></div>
                  <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
                </div>
                <div>
                  <div className="w-16 h-4 bg-gray-200 rounded mb-2.5"></div>
                  <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
                </div>
              </div>
              <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-5">
                <div className="w-16 h-4 bg-gray-200 rounded mb-2.5"></div>
                <div className="h-11 w-full bg-gray-200 rounded-xl mb-3"></div>
                <div className="w-24 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="w-16 h-4 bg-gray-200 rounded mb-2.5"></div>
                  <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
                </div>
                <div>
                  <div className="w-16 h-4 bg-gray-200 rounded mb-2.5"></div>
                  <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
                </div>
              </div>
              <div>
                <div className="w-20 h-4 bg-gray-200 rounded mb-2.5"></div>
                <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
              </div>
            </div>
          </section>

          {/* Right: Location */}
          <div className="w-full lg:w-[300px] flex-shrink-0">
            <div className="bg-white/80 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-6 min-h-[450px]">
              <div className="flex items-center gap-3 border-b border-gray-100 px-7 py-5">
                <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
                <div className="w-32 h-5 bg-gray-200 rounded"></div>
              </div>
              <div className="flex flex-col gap-6 px-7 pb-7 mt-2">
                <div>
                  <div className="w-16 h-4 bg-gray-200 rounded mb-2.5"></div>
                  <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
                </div>
                <div>
                  <div className="w-16 h-4 bg-gray-200 rounded mb-2.5"></div>
                  <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Profile Type & Social Links */}
        <div className="flex flex-col lg:flex-row gap-6 mt-8 mb-12">
          <section className="bg-white/80 border border-gray-100 w-full lg:w-1/2 rounded-2xl shadow-sm">
            <div className="px-7 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
              <div className="w-32 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="p-7 flex flex-col gap-6">
              <div>
                <div className="w-32 h-4 bg-gray-200 rounded mb-2.5"></div>
                <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
              </div>
              <div>
                <div className="w-32 h-4 bg-gray-200 rounded mb-2.5"></div>
                <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
              </div>
              <div className="w-48 h-6 bg-gray-200 rounded"></div>
              <div>
                <div className="w-32 h-4 bg-gray-200 rounded mb-2.5"></div>
                <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
              </div>
              <div className="w-48 h-6 bg-gray-200 rounded"></div>
            </div>
          </section>
          
          <section className="bg-white/80 border border-gray-100 w-full lg:w-1/2 rounded-2xl shadow-sm">
            <div className="px-7 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gray-200"></div>
              <div className="w-32 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="p-7 flex flex-col gap-6">
              <div>
                <div className="w-24 h-4 bg-gray-200 rounded mb-2.5"></div>
                <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
              </div>
              <div className="w-40 h-6 bg-gray-200 rounded"></div>
              <div>
                <div className="w-24 h-4 bg-gray-200 rounded mb-2.5"></div>
                <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
              </div>
              <div className="w-40 h-6 bg-gray-200 rounded"></div>
              <div>
                <div className="w-24 h-4 bg-gray-200 rounded mb-2.5"></div>
                <div className="h-11 w-full bg-gray-100 rounded-xl"></div>
              </div>
              <div className="w-40 h-6 bg-gray-200 rounded"></div>
            </div>
          </section>
        </div>
        
        <div className="flex justify-center pb-12">
          <div className="w-[280px] md:w-[350px] lg:w-[400px] h-12 md:h-14 bg-gray-300 rounded-xl"></div>
        </div>
      </main>
    </div>
  );
};

export default SkeletonLoader;
