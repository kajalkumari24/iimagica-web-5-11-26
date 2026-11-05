import React, { useEffect, useMemo, useState } from "react";
import adminApi from "../utils/adminApi";
import { BASE_URL } from "../url";
import styles from "./ManageHomeSlides.module.css";
import adminStyles from "./AdminHome.module.css";
import ConfirmModal from "./components/ConfirmModal";

const toAbsolute = (url = "") => {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${BASE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

const initialForm = {
  title: "",
  subtitle: "",
  order: 0,
  isActive: true,
  imageFile: null,
};

function ManageHomeSlides() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const editingSlide = useMemo(
    () => slides.find((s) => s._id === editingId) || null,
    [slides, editingId]
  );

  const fetchSlides = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get("/api/home-slides/admin");
      setSlides(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load home slides");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const closeConfirmModal = () => {
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (confirmOpen) closeConfirmModal();
    };

    if (confirmOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmOpen]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const onChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === "file") {
      setForm((prev) => ({ ...prev, imageFile: files?.[0] || null }));
      return;
    }
    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onEdit = (slide) => {
    setEditingId(slide._id);
    setForm({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      order: Number(slide.order || 0),
      isActive: Boolean(slide.isActive),
      imageFile: null,
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!editingId && !form.imageFile) {
      setError("Please choose an image");
      return;
    }

    try {
      setSaving(true);
      const fd = new FormData();
      fd.append("title", form.title || "");
      fd.append("subtitle", form.subtitle || "");
      fd.append("order", String(Number(form.order || 0)));
      fd.append("isActive", String(Boolean(form.isActive)));
      if (form.imageFile) fd.append("image", form.imageFile);

      if (editingId) {
        await adminApi.put(`/api/home-slides/${editingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Home slide updated");
      } else {
        await adminApi.post("/api/home-slides", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSuccess("Home slide created");
      }

      resetForm();
      await fetchSlides();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save home slide");
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (slide) => {
    setConfirmTarget(slide);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    if (!confirmTarget?._id) return;
    setError("");
    setSuccess("");
    try {
      await adminApi.delete(`/api/home-slides/${confirmTarget._id}`);
      if (editingId === confirmTarget._id) resetForm();
      setSuccess("Home slide deleted");
      await fetchSlides();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete home slide");
    } finally {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={adminStyles.dashboardHeader}>
        <div>
          <div className={adminStyles.activeTitle}>Home Slider</div>
        </div>
      </div>

      <form className={styles.formCard} onSubmit={submit}>
        <div className={styles.formGrid}>
          <label>
            Title
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Optional heading"
            />
          </label>
          <label>
            Subtitle
            <input
              name="subtitle"
              value={form.subtitle}
              onChange={onChange}
              placeholder="Optional short text"
            />
          </label>
          <label>
            Order
            <input
              type="number"
              name="order"
              value={form.order}
              onChange={onChange}
              min={0}
            />
          </label>
          <label className={styles.switchRow}>
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={onChange}
            />
            Active
          </label>
          <label className={styles.fileLabel}>
            Image {editingId ? "(optional while editing)" : "(required)"}
            <input type="file" accept="image/*" name="imageFile" onChange={onChange} />
          </label>
        </div>

        <div className={styles.actions}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Slide" : "Add Slide"}
          </button>
          {editingId && (
            <button type="button" className={styles.ghostBtn} onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>

        {editingSlide?.imageUrl && (
          <div className={styles.previewWrap}>
            <img src={toAbsolute(editingSlide.imageUrl)} alt="Editing slide" />
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
      </form>

      <div className={styles.listCard}>
        <h3>Slides ({slides.length})</h3>
        {loading ? (
          <p>Loading slides...</p>
        ) : slides.length === 0 ? (
          <p>No slides added yet.</p>
        ) : (
          <div className={styles.grid}>
            {slides.map((slide) => (
              <div key={slide._id} className={styles.item}>
                <img src={toAbsolute(slide.imageUrl)} alt={slide.title || "Home slide"} />
                <div className={styles.itemMeta}>
                  <strong>{slide.title || "Untitled"}</strong>
                  <span>{slide.subtitle || "-"}</span>
                  <span>Order: {Number(slide.order || 0)}</span>
                  <span>Status: {slide.isActive ? "Active" : "Inactive"}</span>
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => onEdit(slide)}>Edit</button>
                  <button className={styles.deleteBtn} onClick={() => requestDelete(slide)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Delete Home Slide"
        message={`Delete "${confirmTarget?.title || "this slide"}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={closeConfirmModal}
        onConfirm={doDelete}
      />
    </div>
  );
}

export default ManageHomeSlides;

