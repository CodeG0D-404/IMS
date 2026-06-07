import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

/* =========================================
   REQUEST INTERCEPTOR
========================================= */
api.interceptors.request.use(
  (config) => {
    const storeId = localStorage.getItem("storeId");

    // Avoid attaching storeId for auth routes
    if (storeId && !config.url?.startsWith("/auth")) {
      config.headers = config.headers || {};
      config.headers["x-store-id"] = storeId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================================
   RESPONSE INTERCEPTOR
========================================= */
api.interceptors.response.use(
  (response) => response, 

  (error) => {
    if (error.response?.status === 401) {
      // 🔥 Full reset (important)
      localStorage.clear();

      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;