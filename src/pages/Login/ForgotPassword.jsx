import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Points to your Spring Boot backend on port 8080
      const response = await axios.post("http://localhost:8080/api/users/forgot-password", null, {
        params: { email }
      });
      setMessage({ type: "success", text: "Reset link sent! Please check your email." });
    } catch (error) {
      setMessage({ type: "error", text: "Email not found or server is unreachable." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">NAST</div>
          <h2>Employee Portal</h2>
          <p>Forgot Password</p>
        </div>
        
        <p className="auth-instruction">
          Enter your employee email address and we'll send you instructions to reset your password.
        </p>

        {message.text && (
          <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleResetRequest}>
          <div className="form-group">
            <label>EMPLOYEE EMAIL</label>
            <input
              type="email"
              placeholder="employee@nast.edu.np"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="auth-footer">
          {/* ✅ FIXED: Corrected path to navigate back to Login specifically */}
          <button 
            type="button"
            onClick={() => navigate("/login/employee")} 
            className="btn-text" 
            style={{ 
                backgroundColor: '#dc3545', 
                color: 'white', 
                padding: '10px', 
                borderRadius: '5px', 
                width: '100%', 
                border: 'none', 
                marginTop: '10px',
                cursor: 'pointer' 
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;