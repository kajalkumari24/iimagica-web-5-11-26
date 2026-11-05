import axios from 'axios';
import { BASE_URL } from './url';
import { clearAuthToken } from './utils/auth';
import { clearSessionAppState } from './utils/appState';
import { invalidateAuthCache } from './utils/sessionAuth';

// Set global defaults so every axios request sends cookies
axios.defaults.withCredentials = true;
axios.defaults.baseURL = BASE_URL;

let isRefreshing = false;
let failedQueue = [];
let isForcingLogout = false;

const isProtectedRoute = (pathname) => {
  const path = pathname.toLowerCase();
  const protectedPrefixes = [
    "/myprofile",
    "/subscription",
    "/image-view",
    "/home",
    "/notification",
    "/calendar",
    "/category",
    "/edit",
    "/checkout",
    "/admin",
    "/services/banners",
    "/services/logos",
    "/services/website",
    "/services/visiting-card",
    "/services/digital-card",
    "/services/templates"
  ];
  return protectedPrefixes.some(prefix => path === prefix || path.startsWith(prefix + "/"));
};

const forceLogout = () => {
  if (isForcingLogout) return;
  isForcingLogout = true;

  try {
    clearAuthToken();
    clearAuthToken('adminToken');
  } catch (e) {}

  try {
    clearSessionAppState();
  } catch (e) {}

  try {
    invalidateAuthCache();
  } catch (e) {}

  if (isProtectedRoute(window.location.pathname)) {
    window.location.href = "/";
  } else {
    isForcingLogout = false;
  }
};

const isUserNotFoundError = (error) => {
  const data = error.response?.data;
  if (!data) return false;

  if (typeof data === 'string') {
    return data.toLowerCase().includes('user not found');
  }

  if (typeof data === 'object') {
    const msg = data.message || data.error || '';
    if (typeof msg === 'string') {
      return msg.toLowerCase().includes('user not found');
    }
  }

  return false;
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if the response contains "User not found"
    if (isUserNotFoundError(error)) {
      forceLogout();
      return Promise.reject(error);
    }

    // Handle 403 Forbidden directly
    if (error.response?.status === 403) {
      forceLogout();
      return Promise.reject(error);
    }

    // Prevent infinite loop if the refresh token request itself fails with 401
    if (originalRequest?.url?.includes('/api/users/refresh-token')) {
      forceLogout();
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // If we already retried and still got 401, force logout
      if (originalRequest._retry) {
        forceLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return axios(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE_URL}/api/users/refresh-token`, {}, { withCredentials: true });
        isRefreshing = false;
        processQueue(null, data.token);
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        forceLogout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axios;

