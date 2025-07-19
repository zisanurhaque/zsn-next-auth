import axios from "axios";
import { getAuthConfig } from "./config";
import { getAccessToken, refreshAccessToken, clearTokens } from "./token";

export const axiosPublicInstance = axios.create({
  baseURL: getAuthConfig().baseURL,
  headers: { "Content-Type": "application/json" },
});

export const axiosProtectedInstance = axios.create({
  baseURL: getAuthConfig().baseURL,
  withCredentials: true,
  timeout: 10000,
});

axiosProtectedInstance.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosProtectedInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const config = getAuthConfig();

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosProtectedInstance(originalRequest);
      } catch (refreshError) {
        if (config.debug) console.debug("[Auth] Token refresh failed");
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
