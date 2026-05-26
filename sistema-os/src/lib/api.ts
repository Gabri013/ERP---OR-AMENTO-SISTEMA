import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth.store";

const API_BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
  "https://erp-backend-evq2.onrender.com";

export const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Inject token automatically
api.interceptors.request.use((config) => {
  const token =
    useAuthStore.getState().token || localStorage.getItem("authToken");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes("/auth/refresh") &&
      !original.url?.includes("/auth/login")
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (original.headers)
              original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          })
          .catch(Promise.reject.bind(Promise));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken =
          useAuthStore.getState().refreshToken ||
          localStorage.getItem("refreshToken");

        if (!refreshToken) throw new Error("No refresh token");

        const { data: payload } = await axios.post(
          `${API_BASE}/api/auth/refresh`,
          { refreshToken },
          { withCredentials: true },
        );

        const newToken = payload?.data?.accessToken ?? payload?.accessToken;
        const newRefresh = payload?.data?.refreshToken ?? payload?.refreshToken;

        if (!newToken) throw new Error("No access token in response");

        useAuthStore.getState().setToken(newToken, newRefresh);
        localStorage.setItem("authToken", newToken);
        if (newRefresh) localStorage.setItem("refreshToken", newRefresh);

        processQueue(null, newToken);
        if (original.headers)
          original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        useAuthStore.getState().logout();
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
