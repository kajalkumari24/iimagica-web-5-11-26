import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAuthToken, clearAuthToken } from "../utils/auth";
import adminApi from "../utils/adminApi";
import { ensureUserSession } from "../utils/sessionAuth";

const ProtectedRoute = ({ children, type }) => {
  const location = useLocation();
  const adminToken = type === "admin" ? getAuthToken("adminToken") : null;
  const cachedUserAuth = sessionStorage.getItem("userAuthorized") === "true";
  const cachedAdminAuth = sessionStorage.getItem("adminAuthorized") === "true";
  const [adminChecking, setAdminChecking] = useState(type === "admin" ? !cachedAdminAuth : false);
  const [adminAuthorized, setAdminAuthorized] = useState(type === "admin" ? cachedAdminAuth : false);
  const [userChecking, setUserChecking] = useState(type !== "admin" ? !cachedUserAuth : false);
  const [userAuthorized, setUserAuthorized] = useState(type !== "admin" ? cachedUserAuth : false);

  useEffect(() => {
    let mounted = true;

    const checkAdminCookie = async () => {
      try {
        await adminApi.get("/api/admins/me");
        if (mounted) {
          setAdminAuthorized(true);
          sessionStorage.setItem("adminAuthorized", "true");
          setAdminChecking(false);
        }
      } catch (error) {
        if (mounted) {
          setAdminAuthorized(false);
          sessionStorage.removeItem("adminAuthorized");
          setAdminChecking(false);
        }
      }
    };

    if (type !== "admin") return;

    if (adminToken) {
      try {
        // Simple expiry check without jwt-decode dependency
        const payload = JSON.parse(atob(adminToken.split(".")[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) {
          clearAuthToken("adminToken");
          checkAdminCookie();
        } else {
          setAdminAuthorized(true);
          sessionStorage.setItem("adminAuthorized", "true");
          setAdminChecking(false);
        }
      } catch {
        clearAuthToken("adminToken");
        sessionStorage.removeItem("adminAuthorized");
        checkAdminCookie();
      }
    } else {
      checkAdminCookie();
    }

    return () => {
      mounted = false;
    };
  }, [type, adminToken]);

  useEffect(() => {
    if (type === "admin") return;
    let mounted = true;

    const checkUserCookie = async () => {
      let ok = false;
      try {
        const sessionOk = await ensureUserSession();
        if (mounted && sessionOk) {
          setUserAuthorized(true);
          sessionStorage.setItem("userAuthorized", "true");
          ok = true;
        }
      } catch {}
      if (mounted) {
        if (!ok) sessionStorage.removeItem("userAuthorized");
        setUserChecking(false);
      }
    };

    // Always use cookie-based session check for users
    checkUserCookie();

    return () => {
      mounted = false;
    };
  }, [type]);

  if (type === "admin") {
    if (adminChecking) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#F10D64]" />
        </div>
      );
    }
    if (!adminAuthorized) {
      return <Navigate to="/adminlogin" replace />;
    }
    return children;
  }

  if (userChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#F10D64]" />
      </div>
    );
  }
  if (!userAuthorized) {
    return <Navigate to="/LoginPage" state={{ returnUrl: location.pathname }} replace />;
  }
  return children;
};

export default ProtectedRoute;
