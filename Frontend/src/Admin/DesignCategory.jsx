import React, { useEffect, useMemo, useState } from "react";
import adminApi from "../utils/adminApi";
import styles from "./designCategory.module.css";
import ConfirmModal from "./components/ConfirmModal";

const MODULE_OPTIONS = [
  { value: "banner", label: "Banners" },
  { value: "logo", label: "Logos" },
  { value: "website", label: "Websites" },
  { value: "visiting-card", label: "Visiting Cards" },
  { value: "digital-card", label: "Digital Cards" },
  { value: "template", label: "Templates" },
];

const getModuleLabel = (value = "") =>
  MODULE_OPTIONS.find((item) => item.value === value)?.label || value;

const DesignCategory = () => {
  const [module, setModule] = useState("banner");
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editName, setEditName] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredCategories = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => String(cat?.name || "").toLowerCase().includes(q));
  }, [categories, searchTerm]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminApi.get(`/api/design-categories?module=${module}`);
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch categories.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [module]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setError("Category name cannot be empty.");
      return;
    }

    clearMessages();
    setSubmitting(true);
    try {
      const res = await adminApi.post(`/api/design-categories`, {
        name: trimmedName,
        module,
      });
      setCategories((prev) => [res.data?.data, ...prev]);
      setNewCategoryName("");
      setSuccess(`Category "${res.data?.data?.name}" added successfully.`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add category.");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (category) => {
    clearMessages();
    setEditTarget(category);
    setEditName(category?.name || "");
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditName("");
    setIsEditOpen(false);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;

      if (deleteModalOpen) {
        closeDeleteModal();
        return;
      }

      if (isEditOpen) {
        closeEditModal();
      }
    };

    const hasOpenModal = deleteModalOpen || isEditOpen;
    if (hasOpenModal) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deleteModalOpen, isEditOpen, deleteLoading]);

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    const trimmedName = editName.trim();
    if (!trimmedName || !editTarget?._id) {
      setError("Please provide category name.");
      return;
    }

    clearMessages();
    setEditSaving(true);
    try {
      const res = await adminApi.put(`/api/design-categories/${editTarget._id}`, {
        name: trimmedName,
        module,
      });
      const updated = res.data?.data;
      setCategories((prev) => prev.map((cat) => (cat._id === updated._id ? updated : cat)));
      setSuccess(`Category "${updated?.name}" updated successfully.`);
      closeEditModal();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update category.");
    } finally {
      setEditSaving(false);
    }
  };

  const requestDeleteCategory = (category) => {
    clearMessages();
    setDeleteTarget(category);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?._id) return;
    setDeleteLoading(true);
    clearMessages();
    try {
      await adminApi.delete(`/api/design-categories/${deleteTarget._id}`);
      setCategories((prev) => prev.filter((cat) => cat._id !== deleteTarget._id));
      setSuccess(`Category "${deleteTarget?.name}" deleted successfully.`);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete category.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.heroCard}>
        <div className={styles.heroTop}>
          <div>
            <h1 className={styles.pageTitle}>Manage Design Categories</h1>
            <p className={styles.subtitle}>
              Add, edit, and delete module-wise categories used in design uploads.
            </p>
          </div>
          <div className={styles.statsChip}>{categories.length} categories</div>
        </div>

        <form onSubmit={handleAddCategory} className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="moduleSelect">Select Module</label>
            <select
              id="moduleSelect"
              value={module}
              onChange={(e) => setModule(e.target.value)}
              className={styles.field}
            >
              {MODULE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="categoryName">New Category Name</label>
            <input
              id="categoryName"
              type="text"
              onChange={(e) => setNewCategoryName(e.target.value)}
              value={newCategoryName}
              placeholder="e.g. Social Media Posts"
              className={styles.field}
            />
          </div>

          <button type="submit" disabled={submitting} className={styles.addBtn}>
            {submitting ? "Adding..." : "Add Category"}
          </button>
        </form>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}
      {success ? <div className={styles.success}>{success}</div> : null}

      {loading ? (
        <div className={styles.loading}>Loading categories...</div>
      ) : filteredCategories.length === 0 ? (
        <div className={styles.emptyState}>
          No categories found for {getModuleLabel(module)}.
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredCategories.map((cat) => (
            <article key={cat._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{cat.name}</h3>
                <span className={styles.badge}>{getModuleLabel(cat.module)}</span>
              </div>
              <p className={styles.meta}>
                Created: {new Date(cat.createdAt).toLocaleDateString("en-IN")}
              </p>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => openEditModal(cat)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => requestDeleteCategory(cat)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isEditOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h2>Edit Category</h2>
            <p className={styles.modalSub}>
              Module: <strong>{getModuleLabel(module)}</strong>
            </p>
            <form onSubmit={handleUpdateCategory} className={styles.modalForm}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Category name"
                className={styles.field}
                autoFocus
              />
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeEditModal}
                  disabled={editSaving}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={editSaving}>
                  {editSaving ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Design Category"
        message={`Are you sure you want to delete "${deleteTarget?.name || ""}"?`}
        confirmLabel={deleteLoading ? "Deleting..." : "Delete"}
        cancelLabel="Cancel"
        onCancel={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        confirmBtnClass="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default DesignCategory;
