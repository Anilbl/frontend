import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Updated: Allow manual typing of the OTP if it's not in the URL
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match!" });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`http://localhost:8080/api/users/reset-password`, null, {
        params: { token, newPassword }
      });
      alert("Password updated successfully! Your account is now ACTIVE.");
      navigate("/login/admin"); // Navigate to your login page
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data || "Invalid or expired OTP." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2>Set New Password</h2>
        <p style={{textAlign: 'center', marginBottom: '20px'}}>Enter the 6-digit code from your email</p>
        
        {message.text && <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'}`}>{message.text}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* Added OTP Input Field */}
          <div className="input-group">
            <label>OTP Code</label>
            <input 
              type="text" 
              value={token} 
              onChange={(e) => setToken(e.target.value)} 
              placeholder="6-digit OTP"
              required 
            />
          </div>
          <div className="input-group">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <div className="input-group">
            <label>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;