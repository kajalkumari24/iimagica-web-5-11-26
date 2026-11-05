import React, { useEffect, useMemo, useState } from "react";
import adminApi from "../utils/adminApi";
import styles from "./AdminAnalytics.module.css";
import adminStyles from "./AdminHome.module.css";

function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rangeDays, setRangeDays] = useState(7);
  const [metrics, setMetrics] = useState({
    users: 0,
    profiles: 0,
    notifications: 0,
    feedbacks: 0,
    contacts: 0,
  });
  const [lists, setLists] = useState({
    notifications: [],
    feedbacks: [],
    contacts: [],
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError("");
        const [usersRes, profilesRes, feedbackRes, contactRes, notifRes] = await Promise.all([
          adminApi.get(`/api/users/count`),
          adminApi.get(`/api/profiles/count`),
          adminApi.get(`/api/feedback/all`),
          adminApi.get(`/api/contact`),
          adminApi.get(`/api/notifications`),
        ]);

        const usersCount = usersRes.data?.data?.count ?? usersRes.data?.count ?? 0;
        const profilesCount = profilesRes.data?.data?.count ?? profilesRes.data?.count ?? 0;
        const feedbacks = feedbackRes.data?.data?.feedbacks || feedbackRes.data?.feedbacks || [];
        const contacts = Array.isArray(contactRes.data) ? contactRes.data : [];
        const notifications = Array.isArray(notifRes.data) ? notifRes.data : [];

        setMetrics({
          users: usersCount,
          profiles: profilesCount,
          notifications: notifications.length,
          feedbacks: feedbacks.length,
          contacts: contacts.length,
        });
        setLists({ notifications, feedbacks, contacts });
      } catch (err) {
        console.error("Analytics fetch failed:", err);
        setError("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const chartDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ key, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) });
    }
    return days;
  }, [rangeDays]);

  const countByDay = (items, dateField = "createdAt") => {
    const map = new Map();
    chartDays.forEach((d) => map.set(d.key, 0));
    items.forEach((item) => {
      const dt = item?.[dateField];
      if (!dt) return;
      const key = new Date(dt).toISOString().slice(0, 10);
      if (map.has(key)) map.set(key, map.get(key) + 1);
    });
    return chartDays.map((d) => ({ ...d, value: map.get(d.key) || 0 }));
  };

  const feedbackSeries = useMemo(() => countByDay(lists.feedbacks), [lists.feedbacks, chartDays]);
  const contactsSeries = useMemo(() => countByDay(lists.contacts), [lists.contacts, chartDays]);
  const notificationsSeries = useMemo(() => countByDay(lists.notifications), [lists.notifications, chartDays]);

  const topCategories = useMemo(() => {
    const map = new Map();
    lists.notifications.forEach((n) => {
      const key = (n.category || "Uncategorized").trim() || "Uncategorized";
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [lists.notifications]);

  const recentActivity = useMemo(() => {
    const merged = [];
    lists.notifications.forEach((n) => merged.push({ type: "Notification", title: n.title || "Untitled", date: n.createdAt }));
    lists.feedbacks.forEach((f) => merged.push({ type: "Feedback", title: (f.feedback || "").slice(0, 60) || "Feedback", date: f.createdAt }));
    lists.contacts.forEach((c) => merged.push({ type: "Contact", title: c.subject || "Message", date: c.createdAt }));
    return merged
      .filter((m) => m.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [lists]);

  const maxOf = (series) => Math.max(1, ...series.map((d) => d.value));

  return (
    <div className={styles.container}>
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
        <div>
          <div className={adminStyles.activeTitle} style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            Analytics
          </div>
          <div className={styles.headerSub}>Overview of platform activity and engagement</div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.rangeToggle}>
            <button className={rangeDays === 7 ? styles.activeToggle : ""} onClick={() => setRangeDays(7)}>7d</button>
            <button className={rangeDays === 30 ? styles.activeToggle : ""} onClick={() => setRangeDays(30)}>30d</button>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {loading && <div className={styles.loading}>Loading analytics...</div>}
        {error && <div className={styles.error}>{error}</div>}

        {!loading && !error && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Users</div>
                <div className={styles.statValue}>{metrics.users}</div>
                <div className={styles.statHint}>Profiles: {metrics.profiles}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Notifications</div>
                <div className={styles.statValue}>{metrics.notifications}</div>
                <div className={styles.statHint}>All campaigns</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Feedback</div>
                <div className={styles.statValue}>{metrics.feedbacks}</div>
                <div className={styles.statHint}>Total submissions</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Contacts</div>
                <div className={styles.statValue}>{metrics.contacts}</div>
                <div className={styles.statHint}>Inbound enquiries</div>
              </div>
            </div>

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <div className={styles.chartTitle}>Feedback Volume</div>
                    <div className={styles.chartSub}>Last {rangeDays} days</div>
                  </div>
                  <div className={styles.chartLegend}>Total {feedbackSeries.reduce((s, d) => s + d.value, 0)}</div>
                </div>
                <div className={styles.barChart}>
                  {feedbackSeries.map((d) => (
                    <div key={d.key} className={styles.barItem}>
                      <div className={styles.bar} style={{ height: `${(d.value / maxOf(feedbackSeries)) * 100}%` }} />
                      <div className={styles.barLabel}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <div className={styles.chartTitle}>Contacts Volume</div>
                    <div className={styles.chartSub}>Last {rangeDays} days</div>
                  </div>
                  <div className={styles.chartLegend}>Total {contactsSeries.reduce((s, d) => s + d.value, 0)}</div>
                </div>
                <div className={styles.barChart}>
                  {contactsSeries.map((d) => (
                    <div key={d.key} className={styles.barItem}>
                      <div className={styles.barAlt} style={{ height: `${(d.value / maxOf(contactsSeries)) * 100}%` }} />
                      <div className={styles.barLabel}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <div className={styles.chartTitle}>Notifications Sent</div>
                    <div className={styles.chartSub}>Last {rangeDays} days</div>
                  </div>
                  <div className={styles.chartLegend}>Total {notificationsSeries.reduce((s, d) => s + d.value, 0)}</div>
                </div>
                <div className={styles.barChart}>
                  {notificationsSeries.map((d) => (
                    <div key={d.key} className={styles.barItem}>
                      <div className={styles.barAccent} style={{ height: `${(d.value / maxOf(notificationsSeries)) * 100}%` }} />
                      <div className={styles.barLabel}>{d.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <div className={styles.chartTitle}>Top Categories</div>
                    <div className={styles.chartSub}>Most used in notifications</div>
                  </div>
                </div>
                <div className={styles.categoryList}>
                  {topCategories.length === 0 ? (
                    <div className={styles.emptyState}>No categories yet</div>
                  ) : (
                    topCategories.map(([name, count]) => (
                      <div key={name} className={styles.categoryRow}>
                        <div className={styles.categoryName}>{name}</div>
                        <div className={styles.categoryCount}>{count}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className={styles.activityCard}>
              <div className={styles.chartHeader}>
                <div>
                  <div className={styles.chartTitle}>Recent Activity</div>
                  <div className={styles.chartSub}>Latest across feedback, contacts, notifications</div>
                </div>
              </div>
              <div className={styles.activityTable}>
                {recentActivity.length === 0 ? (
                  <div className={styles.emptyState}>No recent activity</div>
                ) : (
                  recentActivity.map((a, idx) => (
                    <div key={`${a.type}-${idx}`} className={styles.activityRow}>
                      <div className={styles.activityType}>{a.type}</div>
                      <div className={styles.activityTitle}>{a.title}</div>
                      <div className={styles.activityDate}>{new Date(a.date).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminAnalytics;
