import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";

export default function Forgotpass() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Simulate sending reset link
    console.log("Password reset link sent to:", email);
    setIsSubmitted(true);
    
    // Clear email after submission
    setEmail("");
    
    // Hide success message after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-section">
          <div className="logo-placeholder">NAST</div>
          <h2>Accountant Portal</h2>
          <h3>Forgot Password</h3>
        </div>

        <p className="forgot-description">
          Enter your registered accountant email address and we'll send you instructions to reset your password.
        </p>

        {isSubmitted && (
          <div className="success-message">
            Password reset link has been sent to your email address. Please check your inbox.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Accountant Email</label>
            <input
              type="email"
              placeholder="accountant@nast.edu.np"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-btn accountant-theme">
            Send Reset Link
          </button>
        </form>

        <div className="login-footer">
          <button 
            type="button" 
            onClick={() => navigate("/login/accountant")} 
            className="link-button"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}