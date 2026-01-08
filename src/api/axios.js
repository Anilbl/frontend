import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const sessionData = localStorage.getItem("user_session");
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        // FIX: Wrapped Bearer token in backticks (``) to solve Vite pre-transform error
        if (session && session.token && session.token !== "undefined" && session.token !== "null") {
          config.headers.Authorization = `Bearer ${session.token}`;
        } else {
          delete config.headers.Authorization;
        }
      } catch (error) {
        console.error("JSON parsing error for user_session", error);
        delete config.headers.Authorization;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;