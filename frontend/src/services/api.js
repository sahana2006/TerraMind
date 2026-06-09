import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const storageKeys = {
  accessToken: "terramind_access_token",
  refreshToken: "terramind_refresh_token",
};

export const getStoredAccessToken = () => localStorage.getItem(storageKeys.accessToken);
export const getStoredRefreshToken = () => localStorage.getItem(storageKeys.refreshToken);

export const setStoredTokens = ({ access, refresh }) => {
  if (access) {
    localStorage.setItem(storageKeys.accessToken, access);
  }
  if (refresh) {
    localStorage.setItem(storageKeys.refreshToken, refresh);
  }
};

export const clearStoredTokens = () => {
  localStorage.removeItem(storageKeys.accessToken);
  localStorage.removeItem(storageKeys.refreshToken);
  window.dispatchEvent(new Event("terramind-auth-cleared"));
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login/") &&
      !originalRequest.url?.includes("/auth/register/") &&
      !originalRequest.url?.includes("/auth/refresh/")
    ) {
      originalRequest._retry = true;
      const refreshToken = getStoredRefreshToken();

      if (!refreshToken) {
        clearStoredTokens();
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        const newAccessToken = refreshResponse.data?.access;

        if (newAccessToken) {
          localStorage.setItem(storageKeys.accessToken, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        clearStoredTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
