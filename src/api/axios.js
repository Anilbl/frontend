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
        // Robust token extraction: checks both 'token' and 'jwt' keys
        const token = session?.token || session?.jwt;

        if (token && token !== "undefined" && token !== "null" && token.length > 10) {
          // trim() ensures no accidental whitespace causes a 403 Forbidden
          config.headers.Authorization = `Bearer ${token.trim()}`;
        } else {
          delete config.headers.Authorization;
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

    // 1. Handle Session Expiry (401/403)
    if (status === 401 || status === 403) {
      // Avoid infinite loops if already on login page
      if (window.location.pathname !== "/") {
        console.warn("Session expired or unauthorized access. Redirecting...");
        localStorage.removeItem("user_session");
        window.location.href = "/?expired=true";
      }
    }

    // 2. Handle Server Crashes (500)
    if (status === 500) {
      console.error("SERVER ERROR (500):", error.response.data?.message || "Internal Server Error");
      // This helps you see the error in the UI toast notifications if you use them
    }

    // 3. Handle Network Errors (Server down)
    if (!error.response) {
      console.error("NETWORK ERROR: Check if the Spring Boot backend is running on port 8080.");
    }

    return Promise.reject(error);
  }
);

export default api;