import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import axios from "../axiosConfig";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./PrivacyPolicy.module.css";

const escapeHtml = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatPolicyContent = (content) => {
  const escapedContent = escapeHtml(content);

  return escapedContent
    .split("\n")
    .map((line) => {
      const trimmedLine = line.trim();

      if (/^\d+\.\s+\S/.test(trimmedLine)) {
        return `<strong class="${styles.sectionHeading}">${line}</strong>`;
      }

      if (/^[a-z]\)\s+\S/i.test(trimmedLine)) {
        return `<strong class="${styles.subHeading}">${line}</strong>`;
      }

      if (/^[A-Z][A-Za-z /]+:\s*$/.test(trimmedLine)) {
        return `<strong class="${styles.subHeading}">${line}</strong>`;
      }

      if (/^(Email|App Name|Country):\s+/i.test(trimmedLine)) {
        return line.replace(
          /^(Email|App Name|Country):/i,
          `<strong class="${styles.inlineLabel}">$1:</strong>`
        );
      }

      return line;
    })
    .join("\n");
};

const PrivacyPolicy = () => {
  const [policyContent, setPolicyContent] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        const response = await axios.get("/api/privacy-policy");
        const policy = response.data?.data;
        if (policy?.content) {
          setPolicyContent(policy.content);
          setLastUpdated(policy.updatedAt || policy.createdAt || null);
        } else {
          setPolicyContent("");
          setLastUpdated(null);
        }
      } catch (error) {
        console.error("Failed to fetch privacy policy:", error);
        toast.error("Could not load the privacy policy. Please try again later.");
        setErrorMessage("Could not load the privacy policy. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, []);

  const sanitizedContent = DOMPurify.sanitize(formatPolicyContent(policyContent));
  const updatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "19 June 2026";

  return (
    <div className={styles.privacyPolicyContainer}>
      <section className={styles.policyCard}>
        <header className={styles.hero}>
          <p className={styles.eyebrow}>iimagica</p>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.updated}>Last updated: {updatedLabel}</p>
        </header>

        {isLoading ? (
          <div className={styles.stateBox}>Loading privacy policy...</div>
        ) : errorMessage ? (
          <div className={styles.stateBox}>{errorMessage}</div>
        ) : !policyContent.trim() ? (
          <div className={styles.stateBox}>
            No privacy policy has been published yet.
          </div>
        ) : (
          <div
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        )}
      </section>
    </div>
  );
};

export default PrivacyPolicy;
