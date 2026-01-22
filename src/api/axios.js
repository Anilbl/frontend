import axios from "axios";

const api = axios.create({
  // Ensure this matches your backend EXACTLY. 
  // Some servers require the trailing slash, others don't.
  baseURL: "http://localhost:8080/api", 
  headers: {
    "Content-Type": "application/json",
  },
});

/* REQUEST INTERCEPTOR */
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
        console.error("Axios Interceptor: Session parse error", error);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* RESPONSE INTERCEPTOR */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handling global auth failures
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem("user_session");
      if (window.location.pathname !== '/') {
        window.location.href = "/?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;