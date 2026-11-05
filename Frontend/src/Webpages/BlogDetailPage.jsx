import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../url";
import {
  MdArrowBack,
  MdAccessTime,
  MdOutlineRemoveRedEye,
  MdCalendarToday,
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
import { FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from "react-icons/fa";

const absoluteImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${BASE_URL}${url}`;
};

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);

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

  // Next Featured Slide
  useEffect(() => {
    if (featuredBlogs.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentFeaturedIndex((prev) => (prev + 1) % featuredBlogs.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredBlogs]);

  useEffect(() => {
    const fetchBlogDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${BASE_URL}/api/blogs/${slug}`);
        if (response.data?.success) {
          setBlog(response.data.data.blog);
          setRelated(response.data.data.related || []);
        } else {
          setError("Blog not found");
        }
      } catch (err) {
        console.error("Failed to fetch blog details:", err);
        setError("Error loading post. Please check connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchBlogDetails();
    window.scrollTo(0, 0);
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-28 pb-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-sm">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-slate-50/50 pt-28 pb-16 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-md w-full text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Post not found</h3>
          <p className="mt-2 text-sm text-gray-500">{error || "The post you are trying to view does not exist."}</p>
          <Link
            to="/blogs"
            className="mt-6 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-orange-500/25"
          >
            <MdArrowBack /> Back to Blogs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-4 pb-16 font-poppins">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Navigation breadcrumb */}
        <div className="mb-3">
          <Link to="/blogs" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#FF7A30] transition-colors font-poppins">
            <MdArrowBack className="text-base" /> Back to Blogs
          </Link>
        </div>

        {/* --- HERO TOP SECTION --- */}
        <div className="mb-6 font-poppins">
          <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider font-poppins flex flex-wrap items-center gap-3">
            <span>
              {blog.publishedAt
                ? new Date(blog.publishedAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Draft"}
            </span>
            <span>•</span>
            <span>by {blog.author}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MdOutlineRemoveRedEye className="text-orange-500 text-sm" /> {blog.views} views
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MdAccessTime className="text-orange-500 text-sm" /> {blog.readTime} min read
            </span>
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-[46px] font-semibold text-gray-900 leading-tight mb-4 font-poppins">
            {blog.title}
          </h1>
          {blog.excerpt && (
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed font-light mb-6 font-poppins">
              {blog.excerpt}
            </p>
          )}
        </div>

        {/* Hero Featured Image */}
        <div className="rounded-2xl overflow-hidden aspect-video mb-6 border border-gray-100 max-w-[55%] mx-auto">
          <img
            src={absoluteImageUrl(blog.featuredImage) || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop"}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Tags / Badges overlay style */}
        <div className="flex flex-wrap gap-2 mb-10">
          <span className="bg-orange-50 border border-orange-100 text-xs font-semibold text-[#FF7A30] px-3.5 py-1.5 rounded-full uppercase tracking-wider font-poppins">
            {blog.category?.name || "General"}
          </span>
          {blog.tags && blog.tags.map((tag, idx) => (
            <span
              key={idx}
              className="bg-slate-50 border border-slate-100 text-xs font-medium text-gray-500 px-3.5 py-1.5 rounded-full font-poppins"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* --- GRID TWO-COLUMN CONTENT & SIDEBAR --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
          
          {/* LEFT COLUMN: ARTICLE CONTENT */}
          <div className="lg:col-span-2 space-y-8 font-poppins">
            {/* Main content paragraphs */}
            <div className="prose max-w-none text-gray-700 leading-relaxed font-light text-sm sm:text-base space-y-6 font-poppins">
              {blog.content.split("\n").map((para, idx) => (
                <p key={idx} className="font-poppins">{para.trim()}</p>
              ))}
            </div>

            {/* Dynamic sections (heading + content) */}
            {blog.sections && blog.sections.length > 0 && (
              <div className="space-y-8 pt-4">
                {blog.sections.map((section, idx) => (
                  <div key={idx} className="space-y-4 font-poppins">
                    {section.heading && (
                      <h2 className="text-2xl font-semibold text-gray-900 leading-snug font-poppins">
                        {section.heading}
                      </h2>
                    )}
                    {section.content && (
                      <div className="text-gray-700 leading-relaxed font-light text-sm sm:text-base space-y-4 font-poppins">
                        {section.content.split("\n").map((para, pIdx) => (
                          <p key={pIdx} className="font-poppins">{para.trim()}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: SIDEBAR WIDGETS */}
          <div className="space-y-8 lg:col-span-1">
            
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

              <div className="flex items-center gap-3 text-gray-400 font-poppins">
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

                  <div className="flex items-center justify-between text-[10px] text-gray-300 font-poppins">
                    <span className="font-poppins">By {featuredBlogs[currentFeaturedIndex].author}</span>
                    <span className="font-poppins">
                      {featuredBlogs[currentFeaturedIndex].publishedAt && new Date(featuredBlogs[currentFeaturedIndex].publishedAt).toLocaleDateString("en-US", {
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


          </div>

        </div>

        {/* --- RELATED POSTS SECTION --- */}
        {related.length > 0 && (
          <div className="border-t border-gray-100 pt-10">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 font-poppins">
              Keep Reading from <span className="text-[#FF7A30] font-poppins">{blog.category?.name}</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((post) => (
                <Link
                  key={post._id}
                  to={`/blogs/${post.slug}`}
                  className="group bg-white border border-gray-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col h-full font-poppins"
                >
                  <div className="aspect-video relative overflow-hidden bg-slate-100 font-poppins">
                    <img
                      src={absoluteImageUrl(post.featuredImage) || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop"}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex flex-col flex-grow font-poppins">
                    <span className="text-[10px] font-semibold text-[#FF7A30] uppercase mb-1 font-poppins">
                      {post.readTime} min read
                    </span>
                    <h4 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-[#FF7A30] transition-colors line-clamp-2 font-poppins">
                      {post.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
