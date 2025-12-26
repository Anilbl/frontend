import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin({ setUser }) {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          usernameOrEmail: usernameOrEmail, 
          password: password 
        }),
      });

      const data = await response.json();

      // ✅ FIXED: Must store data.userId so 'Leave Management' can use it
      if (response.ok && data.userId) {
        const adminSession = { 
          userId: data.userId, // <--- CRITICAL: Needed for Approved By data
          role: data.role || "admin", 
          email: data.email,
          username: data.username 
        };
        
        // Match the key "user" used in your LeaveAdmin.js handleLeaveAction
        localStorage.setItem("user", JSON.stringify(adminSession));
        setUser(adminSession);
        navigate("/admin/dashboard");
      } else {
        alert(data.message || "Invalid Admin Credentials!");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Backend server unreachable. Please start your Spring Boot app.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">NAST</div>
          <h2>Welcome Back</h2>
          <p>Please enter your admin credentials</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Admin Email or Username</label>
            <input
              type="text"
              placeholder="admin_user or admin@payroll.com"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
        <div className="auth-footer">
          <button onClick={() => navigate("/")} className="btn-text">
            ← Back to Portal
          </button>
        </div>
      </div>
    </div>
  );
}