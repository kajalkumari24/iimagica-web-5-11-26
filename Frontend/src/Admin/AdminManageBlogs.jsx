import React, { useEffect, useState } from "react";
import adminApi from "../utils/adminApi";
import { BASE_URL } from "../url";

const initialForm = {
  title: "",
  excerpt: "",
  content: "",
  featuredImage: "",
  category: "",
  tags: "",
  author: "Ethan Caldwell",
  status: "draft",
  isFeatured: false,
  isTrending: false,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
};

export default function AdminManageBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [sections, setSections] = useState([]);
  
  // Inline category creation
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catSaving, setCatSaving] = useState(false);

  // Pagination & Search
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reorder feature
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [isReorderSaving, setIsReorderSaving] = useState(false);

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const res = await adminApi.get("/api/blog-categories");
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  // Fetch blogs (including drafts)
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      let url = `/api/blogs?status=all&page=${page}&limit=10&search=${encodeURIComponent(search)}`;
      if (isReorderMode) {
        url = `/api/blogs?status=all&page=1&limit=1000`;
      }
      const res = await adminApi.get(url);
      if (res.data?.success) {
        setBlogs(res.data.data || []);
        setTotalPages(isReorderMode ? 1 : (res.data.pagination?.totalPages || 1));
      }
    } catch (err) {
      console.error("Failed to load blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchBlogs();
  }, [page, search, isReorderMode]);

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    const updatedBlogs = [...blogs];
    const [draggedItem] = updatedBlogs.splice(sourceIndex, 1);
    updatedBlogs.splice(targetIndex, 0, draggedItem);
    setBlogs(updatedBlogs);
  };

  const handleSaveOrder = async () => {
    setIsReorderSaving(true);
    try {
      const orderedIds = blogs.map((b) => b._id);
      const res = await adminApi.put("/api/admin/blogs/reorder", { orderedIds });
      if (res.data?.success) {
        alert("Blogs order saved successfully!");
        setIsReorderMode(false);
        setPage(1);
        fetchBlogs();
      }
    } catch (err) {
      console.error("Failed to save order:", err);
      alert(err.response?.data?.message || "Failed to save order");
    } finally {
      setIsReorderSaving(false);
    }
  };

  const handleCancelReorder = () => {
    setIsReorderMode(false);
    setPage(1);
    fetchBlogs();
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle image upload to Multer
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    setUploadingImage(true);
    try {
      const res = await adminApi.post("/api/admin/blogs/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data?.success) {
        setForm((prev) => ({
          ...prev,
          featuredImage: res.data.url,
        }));
        alert("Image uploaded successfully!");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  // Create inline category
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCatSaving(true);
    try {
      const res = await adminApi.post("/api/admin/blog-categories", {
        name: newCatName,
        description: `${newCatName} articles`,
      });
      if (res.data?.success) {
        await fetchCategories();
        setForm((prev) => ({ ...prev, category: res.data.data._id }));
        setNewCatName("");
        setShowNewCatInput(false);
        alert("Category created successfully!");
      }
    } catch (err) {
      console.error("Create category error:", err);
      alert(err.response?.data?.message || "Failed to create category");
    } finally {
      setCatSaving(false);
    }
  };

  const handleEdit = (blog) => {
    setEditingId(blog._id);
    setForm({
      title: blog.title || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      featuredImage: blog.featuredImage || "",
      category: blog.category?._id || "",
      tags: blog.tags ? blog.tags.join(", ") : "",
      author: blog.author || "Ethan Caldwell",
      status: blog.status || "draft",
      isFeatured: !!blog.isFeatured,
      isTrending: !!blog.isTrending,
      seoTitle: blog.seoTitle || "",
      seoDescription: blog.seoDescription || "",
      seoKeywords: blog.seoKeywords ? blog.seoKeywords.join(", ") : "",
    });
    setSections(blog.sections || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog post?")) return;
    try {
      const res = await adminApi.delete(`/api/admin/blogs/${id}`);
      if (res.data?.success) {
        alert("Blog deleted successfully!");
        fetchBlogs();
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert(err.response?.data?.message || "Failed to delete blog");
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await adminApi.patch(`/api/admin/blogs/${id}/status`);
      if (res.data?.success) {
        fetchBlogs();
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      alert(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert("Title is required");
    if (!form.category) return alert("Please select a category");
    if (!form.content.trim()) return alert("Content is required");

    setSaving(true);
    try {
      // Process comma tags to arrays
      const tagsArray = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const seoKeywordsArray = form.seoKeywords
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        ...form,
        tags: tagsArray,
        seoKeywords: seoKeywordsArray,
        sections: sections.filter((s) => s.heading.trim() || s.content.trim()),
      };

      if (editingId) {
        const res = await adminApi.put(`/api/admin/blogs/${editingId}`, payload);
        if (res.data?.success) {
          alert("Blog updated successfully!");
          setEditingId(null);
          setForm(initialForm);
          setSections([]);
          fetchBlogs();
        }
      } else {
        const res = await adminApi.post("/api/admin/blogs", payload);
        if (res.data?.success) {
          alert("Blog created successfully!");
          setForm(initialForm);
          setSections([]);
          fetchBlogs();
        }
      }
    } catch (err) {
      console.error("Save error:", err);
      alert(err.response?.data?.message || "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const absoluteImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${BASE_URL}${url}`;
  };

  return (
    <div className="p-6 font-poppins text-black">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Blog Management</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FORM CARD (1/3 width or 3-column span on medium) */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm p-6 border border-gray-200/80 h-fit">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {editingId ? "Edit Blog Post" : "Add New Blog Post"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="Enter blog title"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500 bg-white"
                  required
                />
              </div>

              {/* Sub paragraph heading (Excerpt) */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sub Heading (Excerpt)</label>
                <textarea
                  name="excerpt"
                  value={form.excerpt}
                  onChange={handleInputChange}
                  placeholder="Brief summary paragraph"
                  rows="2"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500 bg-white"
                />
              </div>

              {/* Content Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description (Content) *</label>
                <textarea
                  name="content"
                  value={form.content}
                  onChange={handleInputChange}
                  placeholder="Main content details"
                  rows="6"
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500 bg-white"
                  required
                />
              </div>

              {/* Additional Sections */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Additional Sections</p>
                  <button
                    type="button"
                    onClick={() => setSections([...sections, { heading: "", content: "" }])}
                    className="text-xs text-orange-500 font-semibold hover:underline"
                  >
                    + Add Section
                  </button>
                </div>

                <div className="space-y-3">
                  {sections.map((section, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-3 rounded-lg border border-gray-200/50 relative space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-gray-400 uppercase">Section #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = sections.filter((_, sIdx) => sIdx !== idx);
                            setSections(updated);
                          }}
                          className="text-[10px] text-red-500 hover:underline font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Section Heading"
                        value={section.heading}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx].heading = e.target.value;
                          setSections(updated);
                        }}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500 bg-white"
                      />
                      <textarea
                        placeholder="Section Content"
                        value={section.content}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[idx].content = e.target.value;
                          setSections(updated);
                        }}
                        rows="3"
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500 bg-white"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-gray-600">Category *</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCatInput(!showNewCatInput)}
                    className="text-[11px] text-orange-500 font-semibold hover:underline"
                  >
                    {showNewCatInput ? "Cancel" : "+ Add New"}
                  </button>
                </div>

                {showNewCatInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-grow text-xs border border-gray-300 rounded-lg p-2 outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={catSaving}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 rounded-lg font-medium"
                    >
                      {catSaving ? "..." : "Save"}
                    </button>
                  </div>
                ) : (
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-orange-500 bg-white"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Featured Image</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-[#FF7A30] hover:file:bg-orange-100"
                  />
                  {uploadingImage && <p className="text-[10px] text-orange-500">Uploading file...</p>}
                  <input
                    type="text"
                    name="featuredImage"
                    value={form.featuredImage}
                    onChange={handleInputChange}
                    placeholder="Or enter image URL manually"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none bg-white"
                  />
                </div>
                {form.featuredImage && (
                  <div className="mt-2 rounded-lg border border-gray-200 overflow-hidden aspect-video bg-gray-50">
                    <img
                      src={absoluteImageUrl(form.featuredImage)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Tags & Author */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tags</label>
                  <input
                    type="text"
                    name="tags"
                    value={form.tags}
                    onChange={handleInputChange}
                    placeholder="tech, travel"
                    className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Author</label>
                  <input
                    type="text"
                    name="author"
                    value={form.author}
                    onChange={handleInputChange}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none bg-white"
                  />
                </div>
              </div>

              {/* Status and Flags */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="w-full text-sm border border-gray-300 rounded-lg p-2 outline-none bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div className="flex flex-col justify-center gap-1.5 pl-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={form.isFeatured}
                      onChange={handleInputChange}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isTrending"
                      checked={form.isTrending}
                      onChange={handleInputChange}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    Trending
                  </label>
                </div>
              </div>

              {/* SEO Dropdown details */}
              <div className="border-t border-gray-100 pt-4 mt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">SEO Settings</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    name="seoTitle"
                    value={form.seoTitle}
                    onChange={handleInputChange}
                    placeholder="SEO Title (optional)"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none bg-white"
                  />
                  <input
                    type="text"
                    name="seoDescription"
                    value={form.seoDescription}
                    onChange={handleInputChange}
                    placeholder="SEO Description (optional)"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none bg-white"
                  />
                  <input
                    type="text"
                    name="seoKeywords"
                    value={form.seoKeywords}
                    onChange={handleInputChange}
                    placeholder="SEO Keywords (comma separated)"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none bg-white"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-grow bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl shadow-sm text-sm"
                >
                  {saving ? "Saving..." : editingId ? "Update Post" : "Publish Post"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setForm(initialForm);
                    }}
                    className="bg-gray-100 hover:bg-gray-250 text-gray-600 font-semibold px-4 rounded-xl text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* LIST CARD (2/3 width) */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-200/80 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 font-poppins">
              <div className="flex items-center gap-3 font-poppins">
                <h2 className="text-lg font-bold text-gray-800 font-poppins">Existing Blog Posts</h2>
                {isReorderMode && (
                  <span className="bg-orange-100 text-orange-600 text-xs px-2.5 py-1 rounded-full font-bold uppercase animate-pulse font-poppins">
                    Reorder Mode
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto font-poppins">
                {isReorderMode ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveOrder}
                      disabled={isReorderSaving}
                      className="px-4 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-colors font-poppins"
                    >
                      {isReorderSaving ? "Saving..." : "Save Order"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelReorder}
                      disabled={isReorderSaving}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-150 hover:bg-gray-200 rounded-lg shadow-sm transition-colors font-poppins"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsReorderMode(true)}
                      className="px-4 py-2 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors shrink-0 font-poppins"
                    >
                      ↕ Reorder Posts
                    </button>
                    <input
                      type="text"
                      placeholder="Search blogs..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="w-full sm:w-64 text-sm border border-gray-300 rounded-lg p-2 outline-none focus:border-orange-500 bg-white font-poppins"
                    />
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <p className="text-gray-500 text-sm py-8 text-center animate-pulse font-poppins">Loading posts...</p>
            ) : blogs.length === 0 ? (
              <p className="text-gray-500 text-sm py-8 text-center border border-dashed rounded-xl border-gray-200 font-poppins">
                No blog posts found. Add your first post!
              </p>
            ) : (
              <div className="overflow-x-auto font-poppins">
                <table className="w-full text-left text-sm border-collapse font-poppins">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-semibold text-xs uppercase bg-gray-50/50 font-poppins">
                      {isReorderMode && <th className="py-3 px-4 w-10 text-center font-poppins">Move</th>}
                      <th className="py-3 px-4 font-poppins">Post Info</th>
                      <th className="py-3 px-4 font-poppins">Category</th>
                      <th className="py-3 px-4 text-center font-poppins">Views</th>
                      <th className="py-3 px-4 text-center font-poppins">Status</th>
                      <th className="py-3 px-4 text-right font-poppins">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="font-poppins">
                    {blogs.map((blog, index) => (
                      <tr
                        key={blog._id}
                        draggable={isReorderMode}
                        onDragStart={isReorderMode ? (e) => handleDragStart(e, index) : undefined}
                        onDragOver={isReorderMode ? handleDragOver : undefined}
                        onDrop={isReorderMode ? (e) => handleDrop(e, index) : undefined}
                        className={`border-b border-gray-100 hover:bg-slate-50/60 transition-colors font-poppins ${
                          isReorderMode ? "cursor-move select-none bg-orange-50/10 hover:bg-orange-50/20" : ""
                        }`}
                      >
                        {isReorderMode && (
                          <td className="py-3.5 px-4 text-orange-400 text-center cursor-move font-semibold text-base font-poppins select-none">
                            ☰
                          </td>
                        )}
                        <td className="py-3.5 px-4 max-w-xs font-poppins">
                          <div className="flex items-center gap-3 font-poppins">
                            <img
                              src={absoluteImageUrl(blog.featuredImage)}
                              alt=""
                              className="w-10 h-10 rounded object-cover shrink-0 border border-gray-100"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&auto=format&fit=crop";
                              }}
                            />
                            <div className="truncate font-poppins">
                              <span className="font-bold text-gray-800 block truncate font-poppins" title={blog.title}>
                                {blog.title}
                              </span>
                              <span className="text-[10px] text-gray-400 font-light block font-poppins">
                                By {blog.author} • {blog.readTime} min read
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-poppins">
                          <span className="text-gray-600 font-medium font-poppins">
                            {blog.category?.name || "Uncategorized"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-gray-500 font-semibold font-poppins">
                          {blog.views}
                        </td>
                        <td className="py-3.5 px-4 text-center font-poppins">
                          <button
                            onClick={() => !isReorderMode && handleToggleStatus(blog._id)}
                            disabled={isReorderMode}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all font-poppins ${
                              isReorderMode ? "opacity-60 cursor-not-allowed" : "hover:scale-105"
                            } ${
                              blog.status === "published"
                                ? "bg-green-50 text-green-600 border border-green-200"
                                : "bg-gray-100 text-gray-600 border border-gray-200"
                            }`}
                          >
                            {blog.status}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right font-poppins">
                          <div className="flex justify-end gap-2 font-poppins">
                            <button
                              onClick={() => handleEdit(blog)}
                              disabled={isReorderMode}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors font-poppins ${
                                isReorderMode
                                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                                  : "text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/60"
                              }`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(blog._id)}
                              disabled={isReorderMode}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors font-poppins ${
                                isReorderMode
                                  ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                                  : "text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/60"
                              }`}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!isReorderMode && totalPages > 1 && (
              <div className="flex justify-center items-center gap-1.5 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-xs text-gray-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
