import api from "./axios"; 

/**
 * AUTH & USER SETUP API SERVICE
 * All endpoints now point to /api/auth to bypass Spring Security 
 * 403 Forbidden errors during the initial account setup process.
 */

/**
 * 1. Request a verification token for first-time setup
 * Triggered when the user clicks the "Get Code" button.
 */
export const requestSetupToken = async (email) => {
    try {
        // Pointing to AuthController endpoint (public access)
        const response = await api.post("/auth/request-setup-token", { email });
        return response.data;
    } catch (error) {
        // Logging for easier debugging in the browser console
        console.error("Token Request Error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * 2. Finalize the account setup
 * Sends new username, password, and the 6-digit OTP to the backend.
 * Expects: { email, newUsername, newPassword, token }
 */
export const finalizeSetup = async (setupData) => {
    try {
        // Pointing to AuthController endpoint (public access)
        const response = await api.post("/auth/finalize-setup", setupData);
        return response.data;
    } catch (error) {
        console.error("Finalize Setup Error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * 3. Login Service
 * Standard login for existing users.
 */
export const login = async (credentials) => {
    try {
        const response = await api.post("/auth/login", credentials);
        return response.data;
    } catch (error) {
        console.error("Login Error:", error.response?.data || error.message);
        throw error;
    }
};