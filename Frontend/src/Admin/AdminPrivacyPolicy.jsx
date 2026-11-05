import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { toast } from "react-toastify";
import { Eye, FileText, RefreshCcw, Save } from "lucide-react";
import adminApi from "../utils/adminApi";
import styles from "./AdminPrivacyPolicy.module.css";
import adminStyles from "./AdminHome.module.css";

const AdminPrivacyPolicy = () => {
  const [content, setContent] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPolicy = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.get("/api/privacy-policy");
      const policy = data?.data;
      setContent(policy?.content || "");
      setLastUpdated(policy?.updatedAt || policy?.createdAt || null);
    } catch (error) {
      toast.error("Failed to fetch privacy policy.");
      console.error("Error fetching privacy policy:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  const stats = useMemo(() => {
    const trimmed = content.trim();
    return {
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      characters: content.length,
      sections: (content.match(/<h[1-6]\b|^#{1,6}\s/gim) || []).length,
    };
  }, [content]);

  const previewHtml = useMemo(() => {
    if (!content.trim()) {
      return "<p>No privacy policy content has been added yet.</p>";
    }
    return DOMPurify.sanitize(content);
  }, [content]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Privacy policy content is required.");
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await adminApi.post("/api/privacy-policy", { content });
      const policy = data?.data;
      setContent(policy?.content || content.trim());
      setLastUpdated(policy?.updatedAt || policy?.createdAt || new Date().toISOString());
      toast.success("Privacy Policy saved successfully.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to save privacy policy.");
      console.error("Error saving privacy policy:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleString()
    : "Not published yet";

  return (
    <div className={styles.page}>
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
        <div>
          <div className={adminStyles.activeTitle} style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            Privacy Policy
          </div>
          <div className={styles.headerSubtitle}>
            Manage the public privacy policy shown on the website.
          </div>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.secondaryButton} onClick={fetchPolicy} disabled={isLoading || isSaving}>
            <RefreshCcw size={16} />
            Refresh
          </button>
          <button className={styles.primaryButton} onClick={handleSave} disabled={isLoading || isSaving}>
            <Save size={16} />
            {isSaving ? "Saving..." : "Save Policy"}
          </button>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span>Words</span>
            <strong>{stats.words}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Characters</span>
            <strong>{stats.characters}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Last Updated</span>
            <strong className={styles.dateValue}>{updatedLabel}</strong>
          </div>
        </div>

        <div className={styles.editorGrid}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Policy Content</h2>
                <p>Use plain text or trusted HTML for headings, lists, and links.</p>
              </div>
              <FileText size={20} />
            </div>

            <textarea
              className={styles.editor}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Enter your privacy policy content here..."
              disabled={isLoading}
            />
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <h2>Live Preview</h2>
                <p>This preview uses the same sanitization as the public page.</p>
              </div>
              <Eye size={20} />
            </div>

            <div
              className={styles.preview}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default AdminPrivacyPolicy;
