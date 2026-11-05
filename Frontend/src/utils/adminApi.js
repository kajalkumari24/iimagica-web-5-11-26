import axios from "axios";
import { BASE_URL } from "../url";
import { getAuthToken, clearAuthToken } from "./auth";

const adminApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

adminApi.interceptors.request.use(
  (config) => {
    const token = getAuthToken("adminToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        clearAuthToken("adminToken");
      } catch {}
      if (typeof window !== "undefined") {
        window.location.assign("/adminlogin");
      }
    }
    return Promise.reject(error);
  }
);

export default adminApi;
