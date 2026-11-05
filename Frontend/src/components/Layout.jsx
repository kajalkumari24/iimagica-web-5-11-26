import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import NavigationBar from "../Webpages/NavigationBar";
// import Footer from "../Webpages/Footer";
import Footers from "../Webpages/Footers";
import Header from "../page/Header/Header";
import { getAuthToken } from "../utils/auth";
import { ensureUserSession } from "../utils/sessionAuth";
import "./PublicTheme.css";

const Layout = () => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const normalizedPath = String(location.pathname || "").toLowerCase();
  const isPricingPage = normalizedPath === "/pricing"; // This is true for /pricing
  const isHomePage = normalizedPath === "/" || normalizedPath === ""; // Add this

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const hasToken = !!getAuthToken();
      if (hasToken) {
        if (mounted) {
          setIsAuthenticated(true);
          setAuthResolved(true);
        }
        return;
      }

      try {
        const hasSession = await ensureUserSession();
        if (mounted) {
          setIsAuthenticated(hasSession || !!getAuthToken());
          setAuthResolved(true);
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(!!getAuthToken());
          setAuthResolved(true);
        }
      }
    };

    checkSession();
    return () => {
      mounted = false;
    };
  }, [normalizedPath]);

  // The footer should be visible on all pages that use this Layout component,
  // regardless of authentication status.
  const hideFooterForAuth = false;
  const showAuthHeader = isAuthenticated && isPricingPage;
  const shouldHoldHeader = isPricingPage && !authResolved;

  return (
    <div className="public-theme-shell">
      {!shouldHoldHeader && !isPricingPage && (showAuthHeader ? <Header /> : <NavigationBar />)}
      <main className="public-theme-main">
        <Outlet />
      </main>
      {/* {!hideFooterForAuth && <Footer />} */}
      {!hideFooterForAuth && <Footers />}
    </div>
  );
};

export default Layout;
