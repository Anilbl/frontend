import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ForgotPassword.css"; 

const Forgotpw = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // 1. Trigger the OTP generation and email delivery
      await axios.post("http://localhost:8080/api/users/forgot-password", null, {
        params: { email }
      });

      setMessage({ type: "success", text: "OTP sent! Redirecting to reset page..." });

      // 2. WAIT & REDIRECT: Give the user a moment to see the message, then move to the OTP screen
      setTimeout(() => {
        navigate("/reset-password"); 
      }, 2000);

    } catch (error) {
      setMessage({ type: "error", text: "Email not found or server is unreachable." });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    localStorage.removeItem("user_session");
    navigate("/login/admin");
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">NAST</div>
          <h2>Admin Portal</h2>
          <p>Forgot Password</p>
        </div>
        
        <p className="auth-instruction">
          Enter your admin email and we'll send a 6-digit OTP to reset your password.
        </p>

        {message.text && (
          <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleResetRequest}>
          <div className="form-group">
            <label>ADMIN EMAIL</label>
            <input
              type="email"
              className="auth-input"
              placeholder="admin@nast.edu.np"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Sending OTP..." : "Send Reset OTP"}
          </button>
        </form>

        <div className="auth-footer">
          <button type="button" onClick={handleBackToLogin} className="back-to-login-btn">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default Forgotpw;