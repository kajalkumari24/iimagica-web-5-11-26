import React, { useEffect, useMemo, useState } from "react";
import styles from "./ManageCalendar.module.css";
import adminStyles from "./AdminHome.module.css";
import adminApi from "../utils/adminApi";
import ConfirmModal from "./components/ConfirmModal";

const EVENT_TYPES = [
  { value: "festival", label: "Festival" },
  { value: "birthday", label: "Birthday" },
  { value: "jayanti", label: "Jayanti" },
  { value: "event", label: "Event" },
];

function ManageCalendar() {
  const [events, setEvents] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editId, setEditId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, target: null });
  const [form, setForm] = useState({
    name: "",
    eventType: "festival",
    festivalDate: "",
    linkedCategory: "",
    description: "",
    imageFile: null,
    imageUrl: "",
  });

  const eventTypeMap = useMemo(
    () => EVENT_TYPES.reduce((acc, cur) => ({ ...acc, [cur.value]: cur.label }), {}),
    []
  );
  const categoryOptions = useMemo(() => {
    const merged = [...allCategories];
    if (form.linkedCategory && !merged.includes(form.linkedCategory)) {
      merged.push(form.linkedCategory);
    }
    return [...new Set(merged.map((x) => String(x).trim()).filter(Boolean))];
  }, [allCategories, form.linkedCategory]);

  const fetchData = async () => {
    setLoading(true);
    setError("");

    try {
      const [festivalRes, categoryRes] = await Promise.all([
        adminApi.get("/api/festivals"),
        adminApi.get("/api/categories/public"),
      ]);

      // festivals
      setEvents(festivalRes.data || []);

      // categories
      const categoryData = Array.isArray(categoryRes.data)
        ? categoryRes.data
        : [];

      const allNames = categoryData.map((cat) => cat.name).filter(Boolean);

      setAllCategories([...new Set(allNames)]);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const closeDeleteModal = () => {
    setConfirmDelete({ open: false, target: null });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "Escape") return;
      if (confirmDelete.open) closeDeleteModal();
    };

    if (confirmDelete.open) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmDelete.open]);

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: "",
      eventType: "festival",
      festivalDate: "",
      linkedCategory: "",
      description: "",
      imageFile: null,
    });
  };

  const onChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imageFile") {
      setForm((prev) => ({ ...prev, imageFile: files?.[0] || null }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const uploadEventImage = async (categoryName, calendarEventId, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("category", categoryName);
    if (calendarEventId) fd.append("calendarEventId", calendarEventId);
    fd.append("images", file);
    await adminApi.post("/api/images/upload", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.name.trim()) return setError("Event title is required");
    if (!form.festivalDate) return setError("Event date is required");
    if (!form.linkedCategory.trim()) return setError("Please select linked image category");

    try {
      setSaving(true);

      // 🔥 FormData use करो
      const formData = new FormData();

      formData.append("festivalname", form.name.trim());
      formData.append("festivaldate", form.festivalDate);
      formData.append("linkedCategory", form.linkedCategory.trim());
      formData.append("description", form.description.trim());

      // 🔥 IMPORTANT (image)
      if (form.imageFile) {
        formData.append("image", form.imageFile);
      }

      if (editId) {
        await adminApi.put(`/api/festivals/${editId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setSuccess("Festival updated");
      } else {
        await adminApi.post("/api/festivals", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setSuccess("Festival created");
      }

      resetForm();
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save festival");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (item) => {
    setEditId(item._id);
    setForm({
      name: item.festivalName || "",
      eventType: item.eventType || "festival",
      festivalDate: item.festivalDate ? new Date(item.festivalDate).toISOString().slice(0, 10) : "",
      linkedCategory: item.linkedCategory || "",
      description: item.description || "",
      imageFile: null,
      imageUrl: item?.images?.[0]?.url || "",
    });
    setSuccess("");
    setError("");
  };

  const onDelete = async () => {
    const target = confirmDelete.target;
    if (!target) return;
    setConfirmDelete({ open: false, target: null });
    setError("");
    setSuccess("");
    try {
      // await adminApi.delete(`/api/categories/${target._id}`);
      await adminApi.delete(`/api/festivals/${target._id}`);
      setSuccess("Calendar event deleted");
      if (editId === target._id) resetForm();
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete calendar event");
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
        <div>
          <div className={adminStyles.activeTitle} style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            Manage Calendar
          </div>
          <div className={styles.subtitle}>
            Add event/festival/birthday/jayanti by date and map it to an image category.
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{editId ? "Edit Calendar Event" : "Add Calendar Event"}</h3>
            <form className={styles.form} onSubmit={onSubmit}>
              <label className={styles.label}>
                Event Title
                <input
                  className={styles.input}
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  placeholder="e.g. Gudi Padwa"
                />
              </label>

              <label className={styles.label}>
                Event Type
                <select className={styles.input} name="eventType" value={form.eventType} onChange={onChange}>
                  {EVENT_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.label}>
                Event Date
                <input
                  type="date"
                  className={styles.input}
                  name="festivalDate"
                  value={form.festivalDate}
                  onChange={onChange}
                />
              </label>

              <label className={styles.label}>
                Linked Image Category
                <select
                  className={styles.input}
                  name="linkedCategory"
                  value={form.linkedCategory}
                  onChange={onChange}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.label}>
                Description
                <textarea
                  className={styles.textarea}
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder="Optional details"
                />
              </label>

              <label className={styles.label}>
                Event Image (Optional)
                <input
                  type="file"
                  accept="image/*"
                  className={styles.input}
                  name="imageFile"
                  onChange={onChange}
                />
                {form.imageFile && <span className={styles.fileHint}>{form.imageFile.name}</span>}
              </label>
              {form.imageUrl && !form.imageFile && (
                <div style={{ marginBottom: "10px" }}>
                  <img
                    src={form.imageUrl}
                    alt="event"
                    style={{
                      width: "100%",
                      maxHeight: "150px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}
              {!!error && <div className={styles.error}>{error}</div>}
              {!!success && <div className={styles.success}>{success}</div>}

              <div className={styles.actions}>
                <button className={styles.primaryBtn} type="submit" disabled={saving}>
                  {saving ? "Saving..." : editId ? "Update Event" : "Create Event"}
                </button>
                {editId && (
                  <button className={styles.secondaryBtn} type="button" onClick={resetForm}>
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className={`${styles.card} ${styles.eventsCard}`}>
            <h3 className={styles.cardTitle}>Calendar Events ({events.length})</h3>
            {loading ? (
              <div className={styles.empty}>Loading events...</div>
            ) : events.length === 0 ? (
              <div className={styles.empty}>No calendar events yet.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Linked Category</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((item) => (
                      <tr key={item._id}>
                        <td>{item.festivalDate ? new Date(item.festivalDate).toLocaleDateString() : "-"}</td>
                        <td>{item.festivalName}</td>
                        <td>{eventTypeMap[item.eventType] || "Festival"}</td>
                        <td>{item.linkedCategory || "-"}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button className={styles.smallBtn} onClick={() => onEdit(item)}>Edit</button>
                            <button
                              className={`${styles.smallBtn} ${styles.dangerBtn}`}
                              onClick={() => setConfirmDelete({ open: true, target: item })}
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
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete.open}
        title="Delete Calendar Event"
        message={`Delete "${confirmDelete.target?.name || ""}"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={closeDeleteModal}
        onConfirm={onDelete}
      />
    </div>
  );
}

export default ManageCalendar;
