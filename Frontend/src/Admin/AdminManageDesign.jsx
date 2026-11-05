import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import adminApi from "../utils/adminApi";
import styles from "./AdminManageDesign.module.css";
import { useNavigate } from "react-router-dom";

const ENDPOINT_BY_TYPE = {
  banner: "banners",
  website: "websites",
  logo: "logos",
  visitingCard: "visitingCards",
  digitalCard: "digitalCards",
  template: "templates",
};

const MODULE_BY_TYPE = {
  banner: "banner",
  website: "website",
  logo: "logo",
  visitingCard: "visiting-card",
  digitalCard: "digital-card",
  template: "template",
};

const LABEL_BY_TYPE = {
  banner: "Banner",
  website: "Website",
  logo: "Logo",
  visitingCard: "Visiting Card",
  digitalCard: "Digital Card",
  template: "Template",
};

function AdminManageDesign({ designType, pageTitle }) {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [designCategories, setDesignCategories] = useState([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "",
    price: "",
    description: "",
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileRef = useRef(null);
  const dragCounterRef = useRef(0);

  const endpoint = ENDPOINT_BY_TYPE[designType];
  const moduleKey = MODULE_BY_TYPE[designType];
  const typeLabel = LABEL_BY_TYPE[designType] || "Design";

  const availableCategoryNames = useMemo(
    () =>
      (designCategories || [])
        .map((cat) => String(cat?.name || "").trim())
        .filter(Boolean),
    [designCategories]
  );

  const fetchDesignCategories = useCallback(async () => {
    if (!moduleKey) return;
    try {
      const res = await adminApi.get(`/api/design-categories?module=${moduleKey}`);
      const categories = res.data?.data || [];
      setDesignCategories(categories);
    } catch (fetchErr) {
      console.error("Failed to fetch design categories:", fetchErr);
      setDesignCategories([]);
      setError("Failed to fetch design categories.");
    }
  }, [moduleKey]);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;
    try {
      setError("");
      const categoryQuery =
        selectedCategoryFilter && selectedCategoryFilter !== "all"
          ? `?category=${encodeURIComponent(selectedCategoryFilter)}`
          : "";
      const res = await adminApi.get(`/api/design-library/${endpoint}${categoryQuery}`);
      setData(res.data?.data || []);
    } catch (fetchErr) {
      console.error("Error fetching designs:", fetchErr);
      setError("Failed to load designs.");
      setData([]);
    }
  }, [endpoint, selectedCategoryFilter]);

  useEffect(() => {
    fetchDesignCategories();
  }, [fetchDesignCategories]);

  useEffect(() => {
    if (
      selectedCategoryFilter !== "all" &&
      !availableCategoryNames.includes(selectedCategoryFilter)
    ) {
      setSelectedCategoryFilter("all");
    }
  }, [availableCategoryNames, selectedCategoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!formOpen || isEditing) return;
    if (!form.category && availableCategoryNames.length > 0) {
      setForm((prev) => ({ ...prev, category: availableCategoryNames[0] }));
    }
  }, [formOpen, isEditing, form.category, availableCategoryNames]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (formOpen) resetForm();
    };

    if (formOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [formOpen]);

  const readFilePreview = (file) => {
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setForm((prev) => ({ ...prev, image: file }));
      readFilePreview(file);
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setError("");
    setSuccess("");
    setIsEditing(false);
    setEditingId(null);
    setForm({
      title: "",
      category: availableCategoryNames[0] || "",
      price: "",
      description: "",
      image: null,
    });
    setImagePreview(null);
    setFormOpen(true);
  };

  const resetForm = () => {
    setForm({
      title: "",
      category: "",
      price: "",
      description: "",
      image: null,
    });
    setImagePreview(null);
    setIsEditing(false);
    setEditingId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!endpoint || !moduleKey) return;

    if (!form.category.trim()) {
      setError("Please select a category.");
      return;
    }

    if (!availableCategoryNames.includes(form.category.trim())) {
      setError("Selected category is not in Design Categories for this module.");
      return;
    }

    if (!isEditing && !form.image) {
      setError("Please choose an image to upload.");
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("type", designType);
    fd.append("category", form.category.trim());
    fd.append("price", form.price === "" ? 0 : form.price);
    fd.append("description", form.description.trim());

    if (form.image) {
      fd.append("image", form.image);
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (isEditing && editingId) {
        await adminApi.put(`/api/design-library/update/${editingId}`, fd);
        setSuccess(`${typeLabel} updated successfully.`);
      } else {
        await adminApi.post("/api/design-library/add", fd);
        setSuccess(`${typeLabel} uploaded successfully.`);
      }

      resetForm();
      fetchData();
    } catch (submitErr) {
      console.error("Error saving design:", submitErr);
      setError(submitErr?.response?.data?.message || "Failed to save design.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setError("");
    setSuccess("");

    setForm({
      title: item.title || "",
      category: item.category || "",
      price: item.price ?? "",
      description: item.description || "",
      image: null,
    });
    setImagePreview(item.imageUrl || null);
    setIsEditing(true);
    setEditingId(item._id);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      setError("");
      setSuccess("");
      await adminApi.delete(`/api/design-library/delete/${id}`);
      setSuccess(`${typeLabel} deleted successfully.`);
      fetchData();
    } catch (deleteErr) {
      console.error("Error deleting item:", deleteErr);
      setError(deleteErr?.response?.data?.message || "Failed to delete design.");
    }
  };

  const handleQuickImagePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processQuickUploadFile(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const processQuickUploadFile = (file) => {
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be 10MB or less.");
      return;
    }

    openAddModal();
    setForm((prev) => ({ ...prev, image: file }));
    readFilePreview(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = Math.max(dragCounterRef.current - 1, 0);
    if (dragCounterRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    processQuickUploadFile(file);
  };

  const openQuickUploadDialog = () => {
    fileRef.current?.click();
  };

  const handleUploadBoxKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openQuickUploadDialog();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.heroPanel}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>{pageTitle}</h1>
            <p className={styles.subtitle}>
              {data.length} items total
              {selectedCategoryFilter !== "all" ? ` in "${selectedCategoryFilter}"` : ""}
            </p>
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.addBtn}
              onClick={openAddModal}
              disabled={availableCategoryNames.length === 0}
            >
              + Add New {typeLabel}
            </button>
          </div>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <p>Total {typeLabel}s</p>
            <h3>{data.length}</h3>
          </div>
          <div className={styles.statCard}>
            <p>Design Categories</p>
            <h3>{availableCategoryNames.length}</h3>
          </div>
          <div className={styles.statCard}>
            <p>Current Filter</p>
            <h3>{selectedCategoryFilter === "all" ? "All" : selectedCategoryFilter}</h3>
          </div>
        </div>
      </div>

      <div className={styles.filterBar}>
        <div className={styles.filterGroup}>
          <label htmlFor={`categoryFilter-${designType}`}>Filter Category</label>
          <select
            id={`categoryFilter-${designType}`}
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {availableCategoryNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className={styles.manageCategoryBtn}
          onClick={() => navigate("/admin/design-categories")}
        >
          Manage Categories
        </button>
      </div>

      <div className={styles.uploadArea}>
        <div
          className={`${styles.dragDropBox} ${isDragActive ? styles.dragActive : ""}`}
          role="button"
          tabIndex={0}
          onClick={openQuickUploadDialog}
          onKeyDown={handleUploadBoxKeyDown}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="Upload image"
        >
          <div className={styles.cloudIcon}>☁️</div>
          <h3>Drop your creatives here</h3>
          <p>
            Upload image to selected design category. If no category available, first add from
            Design Categories page.
          </p>
          <div className={styles.uploadLimits}>
            <span>Max 1 file from quick upload</span>
            <span>Max 10MB</span>
          </div>
          <button
            type="button"
            className={styles.browseBtn}
            onClick={(e) => {
              e.stopPropagation();
              openQuickUploadDialog();
            }}
          >
            Browse Files
          </button>
          <input
            type="file"
            ref={fileRef}
            onChange={handleQuickImagePick}
            style={{ display: "none" }}
            accept="image/*"
          />
        </div>
      </div>

      {error && <p className={`${styles.alert} ${styles.errorText}`}>{error}</p>}
      {success && <p className={`${styles.alert} ${styles.successText}`}>{success}</p>}
      {availableCategoryNames.length === 0 && (
        <p className={`${styles.alert} ${styles.warningText}`}>
          No design category found for this module. Add category from Design Categories first.
        </p>
      )}

      <div className={styles.imageGrid}>
        {data.map((item) => (
          <div key={item._id} className={styles.imageCard}>
            <div className={styles.imageContainer}>
              <img src={item.imageUrl} alt={item.title} />
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardInfo}>
                <h4>{item.title}</h4>
                <p className={styles.category}>Category: {item.category || "N/A"}</p>
                <p className={styles.price}>₹ {item.price ?? 0}</p>
              </div>

              <div className={styles.cardActions}>
                <button type="button" className={styles.editBtn} onClick={() => handleEdit(item)}>
                  Edit
                </button>
                <button type="button" className={styles.deleteBtn} onClick={() => handleDelete(item._id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <p className={styles.noData}>No {typeLabel.toLowerCase()} found for this filter.</p>
        )}
      </div>

      {formOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>
                {isEditing ? "Edit" : "Add New"} {typeLabel}
              </h2>
              <button type="button" className={styles.closeBtn} onClick={resetForm} title="Close">
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange} required>
                  <option value="">Select category</option>
                  {availableCategoryNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                  {form.category && !availableCategoryNames.includes(form.category) && (
                    <option value={form.category}>{form.category}</option>
                  )}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Price (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="price"
                  placeholder="Enter price"
                  value={form.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea
                  name="description"
                  placeholder="Short description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Image {isEditing && "(Leave empty to keep current)"}</label>
                <input type="file" accept="image/*" onChange={handleChange} />
                {imagePreview && (
                  <div className={styles.preview}>
                    <img src={imagePreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={resetForm}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading || availableCategoryNames.length === 0}
                >
                  {loading ? "Saving..." : isEditing ? "Update" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminManageDesign;
