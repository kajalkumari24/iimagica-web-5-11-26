const envApiUrl = import.meta.env.VITE_API_URL?.trim();
const host = typeof window !== "undefined" ? window.location.hostname : "";
const isLocalHost =
  host === "localhost" || host === "127.0.0.1" || host === "::1";

const isPrivateNetworkHost = (value = "") => {
  return (
    /^10\./.test(value) ||
    /^192\.168\./.test(value) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(value)
  );
};

const getSafeApiUrl = () => {
  if (!envApiUrl) {
    return isLocalHost ? "http://localhost:5007" : window.location.origin;
  }

  try {
    const apiUrl = new URL(envApiUrl);
    const apiHost = apiUrl.hostname;

    // If an explicit API URL is configured, keep using it.
    // Rewriting LAN API hosts to the frontend origin breaks requests when the
    // app is opened from another device on the same network.
    if (isPrivateNetworkHost(apiHost) || isLocalHost) {
      return apiUrl.origin;
    }
  } catch {
    return isLocalHost ? "http://localhost:5007" : window.location.origin;
  }

  return envApiUrl;
};

export const BASE_URL =
  getSafeApiUrl();
export const VITE_FCM_TEST_TOKEN = import.meta.env.VITE_FCM_TEST_TOKEN;
