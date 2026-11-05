import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../url";
import {
  MdLocationOn,
  MdOpenInNew,
  MdLaptop,
  MdTravelExplore,
  MdPalette,
  MdBusiness,
  MdTrendingUp,
  MdWhatshot,
  MdRocketLaunch,
  MdAnnouncement,
  MdNavigateNext,
  MdNavigateBefore,
} from "react-icons/md";
import {
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
} from "react-icons/fa";

// Category Icon Map
const categoryIconMap = {
  technology: <MdLaptop />,
  travel: <MdTravelExplore />,
  design: <MdPalette />,
  business: <MdBusiness />,
  management: <MdTrendingUp />,
  trends: <MdWhatshot />,
  startups: <MdRocketLaunch />,
  news: <MdAnnouncement />,
};

// Default icon if not matched
const getCategoryIcon = (slug) => {
  return categoryIconMap[slug.toLowerCase()] || <MdAnnouncement />;
};

const absoluteImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url}`;
};

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/blog-categories`);
        if (response.data?.success) {
          setCategories(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Featured Blogs
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/blogs/latest?limit=3`);
        if (response.data?.success) {
          setFeaturedBlogs(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch featured blogs:", err);
      }
    };
    fetchFeatured();
  }, []);

  // Fetch Blogs list (triggered by category, search, page changes)
  useEffect(() => {
    const fetchBlogs = async () => {
      setLoading(true);
      try {
        let url = `${BASE_URL}/api/blogs?page=${currentPage}&limit=6`;
        if (activeCategory !== "all") {
          url += `&category=${activeCategory}`;
        }
        if (searchQuery.trim() !== "") {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }

        const response = await axios.get(url);
        if (response.data?.success) {
          setBlogs(response.data.data);
          setTotalPages(response.data.pagination?.totalPages || 1);
        }
      } catch (err) {
        console.error("Failed to fetch blogs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [activeCategory, searchQuery, currentPage]);

  const handleCategoryClick = (categorySlug) => {
    setActiveCategory(categorySlug);
    setCurrentPage(1); // reset to first page
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // reset to first page
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Next Featured Slide
  useEffect(() => {
    if (featuredBlogs.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev + 1) % featuredBlogs.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredBlogs]);

  return (
    <div className="min-h-screen bg-white pt-10 pb-16 font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* --- HEADER --- */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl  md:text-5xl font-poppins font-semibold text-gray-800 tracking-wide leading-tight">
            <span className="block mb-2 font-poppins">
              Inspiring <span className="text-[#FF7A30] font-poppins">Insights</span>: Ideas for
            </span>
            <span className="block font-poppins">
              Digital Growth and Success
            </span>
          </h1>
          <p className="mt-8 text-lg text-gray-500 font-light leading-relaxed font-poppins">
            Discover expert insights, practical tips, and the latest trends in branding, design, marketing, and technology to build a stronger digital presence.
          </p>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="max-w-md mx-auto mb-8 font-poppins">
          <div className="relative">
            <input
              type="text"
              placeholder="Search blogs by title, tags, or content..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-4 pr-10 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white shadow-sm transition-all text-sm text-black font-poppins"
            />
            <span className="absolute right-4 top-3.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {/* --- TOP CATEGORIES PILL LIST --- */}
        <div className="mb-14 text-center font-poppins">
          {/* <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
            Explore Trending Topics
          </p> */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleCategoryClick("all")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm font-poppins ${activeCategory === "all"
                  ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-orange-500/20"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
            >
              All Topics
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-sm font-poppins ${activeCategory === cat.slug
                    ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-orange-500/20"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
              >
                <span className="text-base font-poppins">{getCategoryIcon(cat.slug)}</span>
                <span className="font-poppins">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* --- MAIN GRID LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT: Blog Post Cards list (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {loading ? (
              // Skeleton Loader
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
                {[1, 2, 4, 5].map((i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm h-96">
                    <div className="bg-gray-200 rounded-xl h-48 w-full mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-5/6 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : blogs.length === 0 ? (
              // Empty State
              <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm font-poppins">
                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 font-poppins">No blog posts found</h3>
                <p className="mt-2 text-sm text-gray-500 font-poppins">We couldn't find any published blogs matching your filters.</p>
              </div>
            ) : (
              // Post Grid
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-poppins">
                {blogs.map((blog) => (
                  <article
                    key={blog._id}
                    className="group bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col h-full font-poppins"
                  >
                    {/* Card Image */}
                    <div className="relative overflow-hidden aspect-video">
                      <img
                        src={absoluteImageUrl(blog.featuredImage) || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop"}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Category Badge overlay */}
                      <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[10px] tracking-wider font-semibold text-gray-900 px-3 py-1.5 rounded-full uppercase shadow-sm font-poppins">
                        {blog.category?.name || "General"}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex flex-col flex-grow font-poppins">
                      <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 font-poppins">
                        <span className="font-medium text-orange-500 font-poppins">{blog.author}</span>
                        <span>•</span>
                        <span className="font-poppins">
                          {blog.publishedAt
                            ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                            : "Draft"}
                        </span>
                        <span>•</span>
                        <span className="font-poppins">{blog.readTime} min read</span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-900 leading-snug group-hover:text-orange-500 transition-colors mb-3 font-poppins">
                        <Link to={`/blogs/${blog.slug}`} className="font-poppins">{blog.title}</Link>
                      </h3>

                      <p className="text-sm text-gray-500 leading-relaxed font-light line-clamp-3 mb-4 font-poppins">
                        {blog.excerpt}
                      </p>

                      <div className="mt-auto pt-4 flex flex-wrap gap-1.5 font-poppins">
                        {blog.tags?.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-50 text-[10px] font-medium text-gray-500 px-2.5 py-1 rounded-md border border-slate-100 font-poppins"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* --- PAGINATION CONTROL --- */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8 font-poppins">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed hover:bg-gray-50 shadow-sm transition-all font-poppins"
                >
                  <MdNavigateBefore className="text-xl" />
                </button>

                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all font-poppins ${currentPage === pageNum
                          ? "bg-orange-500 text-white shadow-md shadow-orange-500/25"
                          : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center p-2 rounded-lg border border-gray-200 bg-white text-gray-600 disabled:opacity-50 disabled:bg-gray-50 disabled:cursor-not-allowed hover:bg-gray-50 shadow-sm transition-all font-poppins"
                >
                  <MdNavigateNext className="text-xl" />
                </button>
              </div>
            )}

          </div>

          {/* RIGHT: Sidebar widgets (1/3 width) */}
          <div className="flex flex-col gap-8 font-poppins">

            {/* --- WIDGET 1: ABOUT AUTHOR --- */}
            <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm font-poppins">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4 font-poppins">
                About
              </p>

              <div className="flex items-center gap-4 mb-4 font-poppins">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop"
                  alt="Ethan Caldwell"
                  className="w-14 h-14 rounded-full object-cover border-2 border-orange-100"
                />
                <div className="font-poppins">
                  <h4 className="font-semibold text-gray-900 text-base leading-tight font-poppins">Ethan Caldwell</h4>
                  <p className="text-[10px] font-semibold text-orange-500 uppercase tracking-wider font-poppins">Digital Growth Expert</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 leading-relaxed font-light mb-4 font-poppins">
                Ethan Caldwell shares thoughtful insights and practical tips on digital growth, design, and creative success. His work explores the intersections of technology and business growth, offering readers unique perspectives.
              </p>

              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-5 font-poppins">
                <MdLocationOn className="text-[#FF7A30]" />
                <span className="font-poppins">Paris, France</span>
              </div>

              {/* Social links */}
              <div className="flex gap-3 text-gray-400 font-poppins">
                <a href="#" className="hover:text-[#FF7A30] transition-colors"><FaTwitter className="text-lg" /></a>
                <a href="#" className="hover:text-[#FF7A30] transition-colors"><FaFacebook className="text-lg" /></a>
                <a href="#" className="hover:text-[#FF7A30] transition-colors"><FaInstagram className="text-lg" /></a>
                <a href="#" className="hover:text-[#FF7A30] transition-colors"><FaLinkedin className="text-lg" /></a>
              </div>
            </div>

            {/* --- WIDGET 2: FEATURED SLIDER --- */}
            {featuredBlogs.length > 0 && (
              <div className="bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm flex flex-col h-80 relative group font-poppins">
                <img
                  src={absoluteImageUrl(featuredBlogs[currentFeaturedIndex].featuredImage) || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop"}
                  alt={featuredBlogs[currentFeaturedIndex].title}
                  className="w-full h-full object-cover"
                />
                {/* Overlay card details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex flex-col justify-end font-poppins">
                  <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-widest mb-1.5 font-poppins">
                    Featured Post
                  </span>

                  <span className="text-[9px] text-white/80 uppercase tracking-wider mb-2 font-poppins">
                    {featuredBlogs[currentFeaturedIndex].category?.name}
                  </span>

                  <h4 className="text-lg font-semibold text-white leading-snug mb-3 line-clamp-2 font-poppins">
                    <Link to={`/blogs/${featuredBlogs[currentFeaturedIndex].slug}`} className="font-poppins">
                      {featuredBlogs[currentFeaturedIndex].title}
                    </Link>
                  </h4>

                  <div className="flex items-center gap-1.5 text-[10px] text-white/70 font-poppins">
                    <span className="font-poppins">{featuredBlogs[currentFeaturedIndex].author}</span>
                    <span>•</span>
                    <span className="font-poppins">
                      {new Date(featuredBlogs[currentFeaturedIndex].publishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Dots indicator */}
                {featuredBlogs.length > 1 && (
                  <div className="absolute top-4 right-4 flex gap-1.5 font-poppins">
                    {featuredBlogs.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentFeaturedIndex(idx)}
                        className={`h-1.5 w-1.5 rounded-full transition-all font-poppins ${currentFeaturedIndex === idx ? "bg-orange-500 w-3" : "bg-white/50 hover:bg-white"
                          }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* --- WIDGET 5: CREATING --- */}
            <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-sm font-poppins">
              <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-4 font-poppins">
                Creating
              </p>

              <div className="space-y-4 font-poppins">
                {[
                  { title: "Inspiring Insights", desc: "Discover expert insights, practical tips, and the latest trends in branding, design, marketing, and technology to build a stronger digital presence." },
                  { title: "Latest Tech Gadgets", desc: "Explore the newest and most innovative technology products hitting the market, from smart devices to cutting-edge tools." },
                  { title: "Trends For 2024", desc: "A look ahead at the emerging trends that will shape the world in 2024, from lifestyle shifts to groundbreaking innovations." },
                ].map((item, idx) => (
                  <div key={idx} className="group border-b border-slate-100 pb-3 last:border-0 last:pb-0 font-poppins">
                    <a href="#" className="flex items-center gap-1 text-xs font-semibold text-gray-900 group-hover:text-orange-500 transition-colors font-poppins">
                      <span className="font-poppins">{item.title}</span>
                      <MdOpenInNew className="text-[10px] text-slate-400 group-hover:text-orange-500 font-poppins" />
                    </a>
                    <p className="text-[10px] text-gray-400 font-light mt-1 leading-relaxed font-poppins">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
