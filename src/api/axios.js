import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

/* ================= REQUEST INTERCEPTOR ================= */
// This function runs automatically before every single API call
api.interceptors.request.use(
  (config) => {
    const sessionData = localStorage.getItem("user_session");

    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        // Supports both 'token' (your new DTO) and 'jwt' keys
        const token = session?.token || session?.jwt;

        if (token && token !== "undefined" && token !== "null" && token.length > 10) {
          // Attaching the token here is what allows switching portals without re-login
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

    // Handle session expiration (401)
    if (status === 401) {
      const isLoginPath = window.location.pathname === "/";
      if (!isLoginPath) {
        console.warn("Session expired. Redirecting to login.");
        localStorage.removeItem("user_session");
        window.location.href = "/?expired=true";
      }
    }

    // Handle lack of permission (403)
    if (status === 403) {
        console.error("Access Denied: You do not have the required role for this module.");
    }

    if (!error.response) {
      console.error("NETWORK ERROR: Backend server might be down.");
    }

    return Promise.reject(error);
  }
);

export default api;