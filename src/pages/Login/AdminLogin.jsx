import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin({ setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === "admin@nast.edu.np" && password === "admin123") {
      const adminSession = { role: "admin", email: email };
      localStorage.setItem("user_session", JSON.stringify(adminSession));
      setUser(adminSession);
      navigate("/admin/dashboard");
    } else {
      alert("Invalid Admin Credentials!");
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
            <label>Admin Email</label>
            <input
              type="email"
              placeholder="admin@nast.edu.np"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <button type="submit" className="btn-primary">
            Sign In
          </button>
        </form>
        

        <div className="auth-footer">
          <button onClick={() => navigate("/")} className="btn-text">
            ← Back to Portal
          </button>
          <a href="/admin/forgot-password">Forgot Password?</a>
        </div>
      </div>
    </div>
  );
}