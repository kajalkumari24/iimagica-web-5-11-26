import React, { useEffect, useMemo, useState } from "react";
import { FaCheckCircle, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import styles from "./AdminPlans.module.css";
import ConfirmModal from "./components/ConfirmModal";
import adminApi from "../utils/adminApi";

const PLAN_TYPES = ["monthly", "quarterly", "half-yearly", "annually"];

const THEME = {
  monthly: { title: "Monthly Plan", color: "#45b35a" },
  quarterly: { title: "Quarterly Plan", color: "#9c27b0" },
  "half-yearly": { title: "Half-Yearly Plan", color: "#2aa8ff" },
  annually: { title: "Annually Plan", color: "#f59e0b" },
};

const BILLING_LABEL = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  "half-yearly": "Half-Yearly",
  yearly: "Annually",
  annually: "Annually",
};

const DEFAULT_PLANS = {
  monthly: [
    {
      billing: "monthly",
      name: "Monthly Plan",
      price: "49",
      duration: "Per Month",
      icon: "[M]",
      features: [
        "Unlimited Greeting & Festival Images",
        "Daily Posts & Seasonal Designs",
        "All Premium Templates Access",
        "Standard Support (Chat + Email)",
      ],
      link: "/monthly-plan",
    },
  ],
  quarterly: [
    {
      billing: "quarterly",
      name: "Quarterly Plan",
      price: "129",
      duration: "For 3 Months",
      icon: "[Q]",
      features: [
        "Unlimited Greeting & Festival Images",
        "Daily Posts & Seasonal Designs",
        "All Premium Templates Access",
        "Standard Support (Chat + Email)",
      ],
      link: "/quarterly-plan",
    },
  ],
  "half-yearly": [
    {
      billing: "half-yearly",
      name: "Half-Yearly Plan",
      price: "279",
      duration: "For 6 Months",
      icon: "[H]",
      features: [
        "Unlimited Greeting & Festival Images",
        "Daily Posts & Seasonal Designs",
        "All Premium Templates Access",
        "Standard Support (Chat + Email)",
      ],
      link: "/half-yearly-plan",
    },
  ],
  annually: [
    {
      billing: "annually",
      name: "Annually Plan",
      price: "499",
      duration: "For 1 Year",
      icon: "[Y]",
      features: [
        "Unlimited Greeting & Festival Images",
        "Daily Posts & Seasonal Designs",
        "All Premium Templates Access",
        "Standard Support (Chat + Email)",
      ],
      link: "/annually-plan",
    },
  ],
};

const INITIAL_FORM = {
  planType: "monthly",
  billing: "monthly",
  name: "",
  price: "",
  duration: "",
  icon: "",
  features: "",
  link: "",
  isActive: true,
};

const normalizePlanType = (value = "") => {
  const lower = value.toLowerCase();
  if (lower.includes("quarter")) return "quarterly";
  if (lower.includes("half") || lower.includes("6 month")) return "half-yearly";
  if (lower.includes("year") || lower.includes("annual")) return "annually";
  return "monthly";
};

const normalizeBilling = (value = "") => {
  const lower = value.toLowerCase();
  if (lower.includes("quarter")) return "quarterly";
  if (lower.includes("half") || lower.includes("6 month")) return "half-yearly";
  if (lower.includes("year") || lower.includes("annual")) return "annually";
  return "monthly";
};

const normalizeApiPlan = (plan) => {
  const planType = normalizePlanType(plan.planType || plan.name);
  const billing = normalizeBilling(plan.billing || `${plan.name} ${plan.duration}`);
  return {
    id: plan._id,
    planType,
    billing,
    name: plan.name || BILLING_LABEL[billing],
    price: plan.price || "0",
    duration: plan.duration || "Per Month",
    icon: plan.icon || "*",
    features: Array.isArray(plan.features) ? plan.features : [],
    link: plan.link || "/",
    isActive: typeof plan.isActive === "boolean" ? plan.isActive : true,
    source: "api",
  };
};

const mergePlans = (apiPlans) => {
  const merged = {};

  PLAN_TYPES.forEach((type) => {
    const defaults = DEFAULT_PLANS[type].map((card) => ({
      ...card,
      planType: type,
      id: null,
      isActive: true,
      source: "default",
    }));

    const dynamic = apiPlans.filter((plan) => plan.planType === type);
    const used = new Set();

    const rows = defaults.map((card) => {
      const match = dynamic.find((item) => item.billing === card.billing && !used.has(item.id));
      if (!match) return card;
      used.add(match.id);
      return { ...card, ...match, source: "api" };
    });

    const extras = dynamic.filter((item) => !used.has(item.id));
    merged[type] = [...rows, ...extras];
  });

  return merged;
};

export default function AdminPlans() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const isEditModalOpen = formOpen && formMode === "edit";

  const loadPlans = async () => {
    setLoadingPlans(true);
    try {
      const res = await adminApi.get("/api/plans/all?admin=1");
      const list = Array.isArray(res.data) ? res.data.map(normalizeApiPlan) : [];
      setPlans(list);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Failed to load plans");
    } finally {
      setLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  // ✅ Close modals on ESC key press
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setFormOpen(false);
        setDeleteTarget(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const groupedPlans = useMemo(() => mergePlans(plans), [plans]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "isActive") {
      setForm((prev) => ({ ...prev, isActive: value === "true" }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFormMode("add");
    setFormOpen(true);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setFormMode("add");
    setFormOpen(false);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteTarget(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...form,
        name: form.name || BILLING_LABEL[form.billing],
        isActive: !!form.isActive,
        features: form.features
          .split(/[\r\n,]+/)
          .map((item) => item.trim())
          .filter(Boolean),
      };

      if (formMode === "edit" && editingId) {
        await adminApi.put(`/api/plans/${editingId}`, payload);
        alert("Plan updated successfully");
      } else {
        await adminApi.post("/api/plans/create", payload);
        alert(formMode === "edit" ? "Plan overridden successfully" : "Plan added successfully");
      }

      resetForm();
      await loadPlans();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Error saving plan");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (card) => {
    setEditingId(card.id || null);
    setForm({
      planType: card.planType,
      billing: card.billing,
      name: card.name,
      price: card.price,
      duration: card.duration,
      icon: card.icon,
      features: (card.features || []).join("\n"),
      link: card.link || "",
      isActive: typeof card.isActive === "boolean" ? card.isActive : true,
    });
    setFormMode("edit");
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (card) => {
    if (!card.id) {
      alert("Default card delete nahi hoga. Override card save karo, phir delete kar sakte ho.");
      return;
    }

    setDeleteTarget(card);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return;

    setDeleteLoading(true);
    try {
      await adminApi.delete(`/api/plans/${deleteTarget.id}`);
      alert("Plan deleted");
      if (editingId === deleteTarget.id) resetForm();
      setDeleteTarget(null);
      await loadPlans();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || "Error deleting plan");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className={`${styles.page} ${(!formOpen || isEditModalOpen) ? styles.pageFull : ""}`}>
      {formOpen && formMode === "add" && (
        <section className={styles.formPanel}>
          <h2 className={styles.panelTitle}>{editingId ? "Update Plan" : "Add Plan"}</h2>
          <p className={styles.panelSubtitle}>
            Edit click karte hi yeh panel open hota hai. Same type + billing save karoge to card replace ho jayega.
          </p>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.grid2}>
              <label className={styles.field}>
                <span>Plan Type</span>
                <select name="planType" value={form.planType} onChange={handleChange} required>
                  <option value="monthly">Monthly Plan</option>
                  <option value="quarterly">Quarterly Plan</option>
                  <option value="half-yearly">Half-Yearly Plan</option>
                  <option value="annually">Annually Plan</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Billing</span>
                <select name="billing" value={form.billing} onChange={handleChange} required>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="annually">Annually</option>
                </select>
              </label>
            </div>

            <div className={styles.grid2}>
              <label className={styles.field}>
                <span>Card Title</span>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Monthly" required />
              </label>

              <label className={styles.field}>
                <span>Price</span>
                <input name="price" value={form.price} onChange={handleChange} placeholder="49" required />
              </label>
            </div>

            <div className={styles.grid2}>
              <label className={styles.field}>
                <span>Duration</span>
                <input name="duration" value={form.duration} onChange={handleChange} placeholder="Per Month" required />
              </label>

              <label className={styles.field}>
                <span>Icon</span>
                <input name="icon" value={form.icon} onChange={handleChange} placeholder="[B]" />
              </label>
            </div>

            <label className={styles.field}>
              <span>Status</span>
              <select name="isActive" value={String(form.isActive)} onChange={handleChange}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Features (comma separated)</span>
              <textarea
                name="features"
                value={form.features}
                onChange={handleChange}
                placeholder={"Greeting Images\nWeekly Posts\nTemplates"}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Redirect Link</span>
              <input name="link" value={form.link} onChange={handleChange} placeholder="/basic-plan" />
            </label>

            <div className={styles.actions}>
              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Update Plan" : "Add Plan"}
              </button>
              <button type="button" className={styles.ghostBtn} onClick={resetForm} disabled={loading}>
                Close
              </button>
            </div>
          </form>
        </section>
      )}

      {isEditModalOpen && (
        <div className={styles.modalOverlay} onClick={resetForm}>
          <section className={styles.modalPanel} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.panelTitle}>Update Plan</h2>
            <p className={styles.panelSubtitle}>
              Plan details update karo aur save karo.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span>Plan Type</span>
                  <select name="planType" value={form.planType} onChange={handleChange} required>
                    <option value="monthly">Monthly Plan</option>
                    <option value="quarterly">Quarterly Plan</option>
                    <option value="half-yearly">Half-Yearly Plan</option>
                    <option value="annually">Annually Plan</option>
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Billing</span>
                  <select name="billing" value={form.billing} onChange={handleChange} required>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half-yearly">Half-Yearly</option>
                    <option value="annually">Annually</option>
                  </select>
                </label>
              </div>

              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span>Card Title</span>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Monthly" required />
                </label>

                <label className={styles.field}>
                  <span>Price</span>
                  <input name="price" value={form.price} onChange={handleChange} placeholder="49" required />
                </label>
              </div>

              <div className={styles.grid2}>
                <label className={styles.field}>
                  <span>Duration</span>
                  <input name="duration" value={form.duration} onChange={handleChange} placeholder="Per Month" required />
                </label>

                <label className={styles.field}>
                  <span>Icon</span>
                  <input name="icon" value={form.icon} onChange={handleChange} placeholder="[B]" />
                </label>
              </div>

              <label className={styles.field}>
                <span>Status</span>
                <select name="isActive" value={String(form.isActive)} onChange={handleChange}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Features (comma separated)</span>
                <textarea
                  name="features"
                  value={form.features}
                  onChange={handleChange}
                  placeholder={"Greeting Images\nWeekly Posts\nTemplates"}
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Redirect Link</span>
                <input name="link" value={form.link} onChange={handleChange} placeholder="/basic-plan" />
              </label>

              <div className={styles.actions}>
                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Update Plan"}
                </button>
                <button type="button" className={styles.ghostBtn} onClick={resetForm} disabled={loading}>
                  Close
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete Plan"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name || BILLING_LABEL[deleteTarget.billing] || "this plan"}"? This action cannot be undone.`
            : ""
        }
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        confirmLabel={deleteLoading ? "Deleting..." : "Delete"}
        loading={deleteLoading}
      />

      <section className={styles.cardsPanel}>
        <div className={styles.topBar}>
          <div>
            <h2 className={styles.manageTitle}>Plans Management</h2>
            <p className={styles.manageSubtitle}>Basic, Advance, Premium cards with dynamic override and status control.</p>
          </div>
          <button className={styles.addNewBtn} type="button" onClick={openCreate}>
            <FaPlus /> {formOpen ? "Add Another" : "Add New Plan"}
          </button>
        </div>

        {loadingPlans && <p className={styles.loading}>Loading plans...</p>}

        {!loadingPlans &&
          PLAN_TYPES.map((type) => (
            <div key={type} className={styles.planSection}>
              <h3 className={styles.sectionTitle} style={{ color: THEME[type].color }}>
                {THEME[type].title}
              </h3>

              <div className={styles.cardGrid}>
                {(groupedPlans[type] || []).map((card, index) => (
                  <article
                    key={card.id || `${type}-${card.billing}-${index}`}
                    className={`${styles.card} ${card.isActive ? "" : styles.inactiveCard}`}
                    style={{ borderTopColor: THEME[type].color }}
                  >
                    <div className={styles.cardTopRow}>
                      <div className={styles.cardHeader}>
                        <span className={styles.cardIcon}>{card.icon || "*"}</span>
                        <h4>{card.name || BILLING_LABEL[card.billing] || "Plan"}</h4>
                      </div>
                      <span className={`${styles.statusBadge} ${card.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                        {card.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className={styles.cardPrice}>
                      Rs {card.price} <span>- {card.duration}</span>
                    </p>

                    <ul className={styles.featureList}>
                      {(card.features || []).map((feature, idx) => (
                        <li key={`${feature}-${idx}`}>
                          <FaCheckCircle />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className={styles.cardActions}>
                      <button type="button" className={styles.editBtn} onClick={() => handleEdit(card)}>
                        <FaEdit /> Edit
                      </button>
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(card)}
                        disabled={!card.id}
                        title={!card.id ? "Default card" : "Delete"}
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>

                  </article>
                ))}
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
