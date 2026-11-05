import { BASE_URL } from "../url";

// Cache auth state to avoid hitting /me on every render
let cachedAuth = null;       // true | false | null
let cacheExpiry = 0;         // timestamp in ms
let refreshPromise = null;   // dedup in-flight refresh

const CACHE_TTL = 4 * 60 * 1000; // cache valid auth for 4 minutes

export const invalidateAuthCache = () => {
  cachedAuth = null;
  cacheExpiry = 0;
};

export const ensureUserSession = async () => {
  try {
    // Return cached result if still fresh
    if (cachedAuth !== null && Date.now() < cacheExpiry) {
      if (cachedAuth) {
        localStorage.setItem("isLoggedIn", "true");
      } else {
        localStorage.removeItem("isLoggedIn");
      }
      return cachedAuth;
    }

    // Try /me with current access token cookie
    const meRes = await fetch(`${BASE_URL}/api/users/me`, { credentials: "include" });
    if (meRes.ok) {
      cachedAuth = true;
      cacheExpiry = Date.now() + CACHE_TTL;
      localStorage.setItem("isLoggedIn", "true");
      return true;
    }

    // Access token expired — attempt silent refresh (deduplicated)
    if (!refreshPromise) {
      refreshPromise = fetch(`${BASE_URL}/api/users/refresh-token`, {
        method: "POST",
        credentials: "include",
      })
        .then(async (res) => {
          const ok = res.ok;
          refreshPromise = null;
          return ok;
        })
        .catch(() => {
          refreshPromise = null;
          return false;
        });
    }

    const refreshed = await refreshPromise;

    if (refreshed) {
      // Refresh succeeded — new cookies are set, verify with /me
      const retryMe = await fetch(`${BASE_URL}/api/users/me`, { credentials: "include" });
      cachedAuth = retryMe.ok;
      cacheExpiry = retryMe.ok ? Date.now() + CACHE_TTL : 0;
      if (cachedAuth) {
        localStorage.setItem("isLoggedIn", "true");
      } else {
        localStorage.removeItem("isLoggedIn");
      }
      return cachedAuth;
    }

    localStorage.removeItem("isLoggedIn");
    cachedAuth = false;
    cacheExpiry = 0;
    return false;
  } catch {
    localStorage.removeItem("isLoggedIn");
    cachedAuth = false;
    cacheExpiry = 0;
    return false;
  }
};

export default { ensureUserSession, invalidateAuthCache };
