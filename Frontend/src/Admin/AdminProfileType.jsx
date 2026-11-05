import React, { useState, useEffect } from "react";
import adminApi from "../utils/adminApi";
import styles from "./ManageFrames.module.css";

const TABS = [
  { key: "political", label: "🏛️ Political" },
  { key: "professional", label: "💼 Professional" },
  { key: "brand", label: "🏷️ Brand" },
];

const AdminProfileType = ({ onClose, showNotification }) => {
  const [activeTab, setActiveTab] = useState("political");
  const [items, setItems] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  const fetchItems = async (type = activeTab) => {
    try {
      setLoading(true);
      const res = await adminApi.get(`/api/profile-types/${type}`);
      setItems(res.data?.data || res.data || []);
    } catch (err) {
      showNotification?.(`Failed to load ${type} list`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setItems([]);
    setInput("");
    setEditingId(null);
    fetchItems(activeTab);
  }, [activeTab]);

  const handleAdd = async () => {
    const name = input.trim();
    if (!name) return;
    setLoading(true);
    try {
      await adminApi.post("/api/profile-types", { type: activeTab, name });
      setInput("");
      await fetchItems();
      showNotification?.(`"${name}" added successfully`, "success");
    } catch (err) {
      showNotification?.(err.response?.data?.message || "Failed to add", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    const name = editingName.trim();
    if (!name) return;
    setLoading(true);
    try {
      await adminApi.put(`/api/profile-types/${id}`, { name });
      setEditingId(null);
      await fetchItems();
      showNotification?.(`Updated to "${name}"`, "success");
    } catch (err) {
      showNotification?.(err.response?.data?.message || "Failed to update", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    setLoading(true);
    try {
      await adminApi.delete(`/api/profile-types/${item._id}`);
      await fetchItems();
      showNotification?.(`"${item.name}" deleted`, "success");
    } catch (err) {
      showNotification?.("Failed to delete", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={onClose}>
      <div className={styles.partyModal} style={{ width: 560 }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.partyModalHeader}>
          <div className={styles.partyModalTitleRow}>
            <span className={styles.partyModalIcon}>⚙️</span>
            <div>
              <div className={styles.partyModalTitle}>Manage Profile Types</div>
              <div className={styles.partyModalSub}>{items.length} item{items.length !== 1 ? "s" : ""} in {activeTab}</div>
            </div>
          </div>
          <button className={styles.partyModalClose} onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                padding: "12px 8px",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid #0ea5a4" : "2px solid transparent",
                background: "transparent",
                color: activeTab === tab.key ? "#0f766e" : "#64748b",
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add Input */}
        <div className={styles.partyAddRow}>
          <input
            type="text"
            placeholder={`Add new ${activeTab === "political" ? "party" : activeTab}...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className={styles.partyAddInput}
          />
          <button
            disabled={loading || !input.trim()}
            className={styles.partyAddBtn}
            onClick={handleAdd}
          >
            {loading ? "..." : "+ Add"}
          </button>
        </div>

        {/* List */}
        <div className={styles.partyList}>
          {loading && items.length === 0 ? (
            <div className={styles.partyEmpty}>Loading...</div>
          ) : items.length === 0 ? (
            <div className={styles.partyEmpty}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div>No {activeTab === "political" ? "party" : activeTab} items yet</div>
              <div style={{ fontSize: 12, marginTop: 4, color: "#94a3b8" }}>Add your first item above</div>
            </div>
          ) : items.map((item, idx) => (
            <div key={item._id} className={styles.partyItem}>
              <div className={styles.partyItemLeft}>
                <span className={styles.partyIndex}>{idx + 1}</span>
                {editingId === item._id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(item._id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className={styles.partyEditInput}
                  />
                ) : (
                  <span className={styles.partyName}>{item.name}</span>
                )}
              </div>
              <div className={styles.partyItemActions}>
                {editingId === item._id ? (
                  <>
                    <button className={styles.partySaveBtn} disabled={loading} onClick={() => handleUpdate(item._id)}>✓ Save</button>
                    <button className={styles.partyCancelBtn} onClick={() => setEditingId(null)}>✕</button>
                  </>
                ) : (
                  <>
                    <button className={styles.partyEditBtn} onClick={() => { setEditingId(item._id); setEditingName(item.name); }}>✏️ Edit</button>
                    <button className={styles.partyDeleteBtn} onClick={() => handleDelete(item)}>🗑️ Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={styles.partyModalFooter}>
          <button className={styles.btnCancel} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileType;
