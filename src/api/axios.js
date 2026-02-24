import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use(
  (config) => {
    const sessionData = localStorage.getItem("user_session");

    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        // Extract token from either 'token' or 'jwt' keys
        const token = session?.token || session?.jwt;

        if (token && token !== "undefined" && token !== "null" && token.length > 10) {
          // Add Bearer prefix and trim whitespace
          config.headers.Authorization = `Bearer ${token.trim()}`;
        }
      } catch (err) {
        console.error("Axios interceptor parse error:", err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response ? error.response.status : null;

    // 1. Handle Forbidden (403) or Unauthorized (401)
    if (status === 401 || status === 403) {
      const isLoginPath = window.location.pathname === "/";
      
      if (!isLoginPath) {
        console.error("Access Denied (403/401). Check your Role permissions.");
        // Optional: Redirect only on 401 (Expired). 
        // Keep 403 errors on screen so Admin knows they lack permissions.
        if (status === 401) {
            localStorage.removeItem("user_session");
            window.location.href = "/?expired=true";
        }
      }
    }

    if (!error.response) {
      console.error("NETWORK ERROR: Backend server might be down.");
    }

    return Promise.reject(error);
  }
);

export default api;