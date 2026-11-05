import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../url";

const isExpiredFromSubscription = (subscription) => {
  if (!subscription) return false;
  if (subscription.subscriptionStatus === "expired") return true;
  if (!subscription.expiryDate) return false;
  const expiryTime = new Date(subscription.expiryDate).getTime();
  return Number.isFinite(expiryTime) ? expiryTime <= Date.now() : false;
};

// Global cache to prevent multiple API calls when multiple sliders load
let globalSubscriptionCache = null;
let globalFetchPromise = null;
let lastFetchTime = 0;
const CACHE_DURATION = 30000; // Cache valid for 30 seconds

const fetchSubscriptionGlobal = async () => {
  if (globalSubscriptionCache && (Date.now() - lastFetchTime < CACHE_DURATION)) {
    return globalSubscriptionCache;
  }
  if (globalFetchPromise) {
    return globalFetchPromise;
  }
  globalFetchPromise = axios.get(`${BASE_URL}/api/subscriptions/me`, { withCredentials: true })
    .then(res => {
      globalSubscriptionCache = res.data?.subscription;
      lastFetchTime = Date.now();
      globalFetchPromise = null;
      return globalSubscriptionCache;
    })
    .catch(err => {
      console.error("Failed to check subscription:", err);
      globalFetchPromise = null;
      return null;
    });
  return globalFetchPromise;
};

export default function useSubscriptionGate() {
  const [isExpired, setIsExpired] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [checked, setChecked] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const refreshSubscriptionStatus = useCallback(async () => {
    const subscription = await fetchSubscriptionGlobal();
    const expired = isExpiredFromSubscription(subscription);
    setIsExpired(expired);
    setExpiryDate(subscription?.expiryDate || null);
    setChecked(true);
    return expired;
  }, []);

  useEffect(() => {
    refreshSubscriptionStatus();
  }, [refreshSubscriptionStatus]);

  useEffect(() => {
    if (!expiryDate || isExpired) return undefined;
    const timer = setInterval(() => {
      const expiredNow = new Date(expiryDate).getTime() <= Date.now();
      if (expiredNow) {
        setIsExpired(true);
        setShowExpiredModal(true);
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [expiryDate, isExpired]);

  const ensureSubscriptionAccess = useCallback(
    async (onAllowed) => {
      const expired = checked ? isExpired : await refreshSubscriptionStatus();
      if (expired) {
        setShowExpiredModal(true);
        return false;
      }
      if (typeof onAllowed === "function") onAllowed();
      return true;
    },
    [checked, isExpired, refreshSubscriptionStatus]
  );

  return {
    showExpiredModal,
    setShowExpiredModal,
    ensureSubscriptionAccess,
  };
}
