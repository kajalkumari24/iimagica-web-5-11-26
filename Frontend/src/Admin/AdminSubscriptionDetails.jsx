import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import adminApi from "../utils/adminApi";
import styles from "./AdminSubscriptionDetails.module.css";

export default function AdminSubscriptionDetails() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchDetails = async () => {
    try {
      const res = await adminApi.get(`/api/subscriptions/admin/user/${userId}`);
      if (typeof res.data === "string" && res.data.includes("<html")) {
        throw new Error("Backend route missing! API returned HTML.");
      }
      setData(res.data);
      setErrorMsg("");
    } catch (error) {
      console.error("Error fetching subscription details", error);
      setErrorMsg(error?.response?.data?.message || error.message || "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchDetails();
  }, [userId]);

  const handleResetTrial = async () => {
    if (!userId) return;

    const confirmed = window.confirm(
      "Reset this user's free trial? Current active access will be replaced with a fresh trial."
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      setSuccessMsg("");
      setErrorMsg("");
      await adminApi.post(`/api/subscriptions/admin/user/${userId}/reset-trial`);
      await fetchDetails();
      setSuccessMsg("Free trial reset successfully.");
      window.setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      console.error("Error resetting free trial", error);
      setErrorMsg(error?.response?.data?.message || "Failed to reset free trial");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) return <div className={styles.loading}>Loading subscription details...</div>;

  if (errorMsg && !data) {
    return (
      <div className={styles.loading} style={{ color: "#ff6b7a", padding: "50px", textAlign: "center" }}>
        <h2>Error: {errorMsg}</h2>
        <button onClick={() => navigate(-1)} className={styles.backBtn} style={{ marginTop: "20px" }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!data || !data.user) {
    return <div className={styles.loading}>No data found.</div>;
  }

  const { user = {}, currentStatus = {}, history = [] } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>User Subscription Details</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.backBtn}
            onClick={handleResetTrial}
            disabled={actionLoading}
          >
            {actionLoading ? "Resetting..." : "Reset Free Trial"}
          </button>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            Back to Users
          </button>
        </div>
      </div>

      {successMsg && <div className={styles.successBanner}>{successMsg}</div>}
      {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

      <div className={styles.grid}>
        <div className={styles.card}>
          <h3>User Information</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>Name:</span>
            <span className={styles.value}>{user.name}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Email:</span>
            <span className={styles.value}>{user.email}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Mobile:</span>
            <span className={styles.value}>{user.mobile || "N/A"}</span>
          </div>
        </div>

        <div className={styles.card}>
          <h3>Current Subscription Status</h3>
          <div className={styles.infoRow}>
            <span className={styles.label}>Plan Type:</span>
            <span className={styles.value} style={{ textTransform: "capitalize" }}>
              {currentStatus.isFreeTrial ? "Free Trial" : currentStatus.planType}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Status:</span>
            <span
              className={`${styles.value} ${
                currentStatus.status === "active" || currentStatus.status === "trial"
                  ? styles.active
                  : styles.expired
              }`}
              style={{ textTransform: "capitalize" }}
            >
              {currentStatus.status}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Start Date:</span>
            <span className={styles.value}>{formatDate(currentStatus.startDate)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Expiry Date:</span>
            <span className={styles.value}>{formatDate(currentStatus.expiryDate)}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Time Left:</span>
            <span className={styles.value}>
              {currentStatus.daysLeft > 0
                ? `${currentStatus.daysLeft} Days`
                : currentStatus.hoursLeft > 0 || currentStatus.minutesLeft > 0
                  ? `${currentStatus.hoursLeft}h ${currentStatus.minutesLeft}m`
                  : "Expired"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h3>Subscription History</h3>
        <table className={styles.historyTable}>
          <thead>
            <tr>
              <th>Plan Name</th>
              <th>Amount</th>
              <th>Billing</th>
              <th>Start Date</th>
              <th>Expiry Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length > 0 ? (
              history.map((sub) => (
                <tr key={sub._id}>
                  <td>{sub.planName || (sub.planId ? sub.planId.name : "N/A")}</td>
                  <td>Rs {sub.amount}</td>
                  <td style={{ textTransform: "capitalize" }}>{sub.billingCycle}</td>
                  <td>{formatDate(sub.startDate)}</td>
                  <td>{formatDate(sub.expiryDate)}</td>
                  <td
                    className={sub.status === "active" ? styles.active : styles.expired}
                    style={{ textTransform: "capitalize" }}
                  >
                    {sub.status}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                  No subscription history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
