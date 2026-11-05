import React, { useState, useEffect } from "react";
import adminApi from "../utils/adminApi";
import styles from "./AdminHome.module.css";
import { useNavigate } from "react-router-dom";
import SkeletonLoader from "./components/SkeletonLoader";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function AdminHome() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFrames: 0,
    totalImages: 0,
    totalProfiles: 0,
    totalNotifications: 0,
    totalFeedbacks: 0,
  });
  const [profileTypeData, setProfileTypeData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const [
        usersRes,
        framesRes,
        imagesRes,
        notificationsRes,
        profilesRes,
        feedbackRes,
        profileTypeRes,
        userProfilesRes,
      ] = await Promise.all([
        adminApi.get(`/api/users/count`),
        adminApi.get(`/api/frames/count`),
        adminApi.get(`/api/images/count`),
        adminApi.get(`/api/notifications/count`),
        adminApi.get(`/api/profiles/count`),
        adminApi.get(`/api/feedback/count`),
        adminApi.get(`/api/profiles/profiletype-counts`),
        adminApi.get(`/api/admins/profiles`),
      ]);

      setStats({
        totalUsers: usersRes?.data?.data?.count || usersRes?.data?.count || 0,
        totalFrames: framesRes?.data?.data?.count || framesRes?.data?.count || 0,
        totalImages: imagesRes?.data?.data?.count || imagesRes?.data?.count || 0,
        totalNotifications: notificationsRes?.data?.data?.count || notificationsRes?.data?.count || 0,
        totalProfiles: profilesRes?.data?.data?.count || profilesRes?.data?.count || 0,
        totalFeedbacks: feedbackRes?.data?.data?.count || feedbackRes?.data?.count || 0,
      });

      // Process profile type data
      const normalizeProfileTypeCounts = (payload) => {
        if (!payload) return [];
        const candidate = payload.data || payload.counts || payload.profileTypeCounts || payload;

        if (Array.isArray(candidate)) {
          return candidate.map((item) => ({
            name: item?.name || item?.type || item?.profiletype || "Other",
            value: Number(item?.value ?? item?.count ?? item?.total ?? 0) || 0
          }));
        }

        if (typeof candidate === "object") {
          return Object.entries(candidate).map(([name, rawValue]) => ({
            name,
            value: typeof rawValue === "object" 
              ? Number(rawValue?.count ?? rawValue?.value ?? 0) || 0
              : Number(rawValue) || 0
          }));
        }

        return [];
      };

      const fetchedData = normalizeProfileTypeCounts(profileTypeRes?.data);
      const userProfiles = userProfilesRes?.data?.data?.profiles || userProfilesRes?.data?.profiles || [];
      const liveProfileCounts = {};

      const normalizeTypeName = (value) => {
        const raw = String(value || "").trim();
        if (!raw) return "Other";
        return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
      };
      
      userProfiles.forEach(profile => {
        const profileType = profile?.profileType || profile?.profiletype || "Other";
        const normalizedType = normalizeTypeName(profileType);
        liveProfileCounts[normalizedType] = (liveProfileCounts[normalizedType] || 0) + 1;
      });

      const defaultTypes = ["Political", "Business", "Professional", "Personal", "Social", "Brand"];
      const mergedData = defaultTypes.map((type) => {
        const liveCount = liveProfileCounts[type] || 0;
        const apiMatch = fetchedData.find(f => f.name.toLowerCase() === type.toLowerCase());
        const apiCount = apiMatch ? apiMatch.value : 0;
        return { name: type, value: liveCount > 0 ? liveCount : apiCount };
      });

      // Also include any extra types from live data not in defaultTypes
      Object.entries(liveProfileCounts).forEach(([type, count]) => {
        if (!defaultTypes.some(d => d.toLowerCase() === type.toLowerCase())) {
          mergedData.push({ name: type, value: count });
        }
      });

      setProfileTypeData(mergedData);

      try {
        const activityRes = await adminApi.get(`/api/admins/activity`);
        const activityItems = activityRes?.data?.data?.items || activityRes?.data?.items || [];
        setRecentActivity(Array.isArray(activityItems) ? activityItems : []);
      } catch (activityErr) {
        setRecentActivity([]);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStats({
        totalUsers: 0,
        totalFrames: 0,
        totalImages: 0,
        totalProfiles: 0,
        totalNotifications: 0,
        totalFeedbacks: 0,
      });
      setProfileTypeData([
        { name: "Political", value: 0 },
        { name: "Business", value: 0 },
        { name: "Professional", value: 0 },
        { name: "Personal", value: 0 },
        { name: "Social", value: 0 },
      ]);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  const profileTypeColors = {
    Political: "#3b82f6",
    Business: "#22c55e",
    Professional: "#f97316",
    Personal: "#a855f7",
    Social: "#eab308",
    Brand: "#ef4444",
    Other: "#64748b",
  };
  const pieData = profileTypeData.filter((item) => Number(item?.value || 0) > 0);

  const formatActivityTime = (item) => {
    if (item?.meta) return item.meta;
    const ts = item?.createdAt || item?.timestamp || item?.time;
    if (!ts) return "";
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <div className={styles.actions}>
          <button onClick={() => navigate('/admin/manage-frames')}>+ Frame</button>
          <button onClick={() => navigate('/admin/notifications')}>+ Notification</button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.totalUsers}</div>
          <div className={styles.statLabel}>Users</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.totalFrames}</div>
          <div className={styles.statLabel}>Frames</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.totalImages}</div>
          <div className={styles.statLabel}>Images</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.totalProfiles}</div>
          <div className={styles.statLabel}>Profiles</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.totalNotifications}</div>
          <div className={styles.statLabel}>Notifications</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{stats.totalFeedbacks}</div>
          <div className={styles.statLabel}>Feedbacks</div>
        </div>
      </div>

      <div className={styles.chartsSection}>
        <div className={styles.chartCard}>
          <h3>Profile Types</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData.length ? pieData : profileTypeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value, percent }) =>
                  Number(value || 0) > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                }
              >
                {(pieData.length ? pieData : profileTypeData).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={profileTypeColors[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3>Profile Counts</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={profileTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {profileTypeData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={profileTypeColors[entry.name] || "#94a3b8"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.activitySection}>
        <h3>Recent Activity</h3>
        <div className={styles.activityList}>
          {(recentActivity.length ? recentActivity : [{ title: 'No recent activity', meta: '' }]).slice(0, 5).map((item, i) => (
            <div key={item?.id || i} className={styles.activityItem}>
              <div className={styles.activityTitle}>{item?.title || 'Activity'}</div>
              <div className={styles.activityTime}>{formatActivityTime(item)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminHome;
