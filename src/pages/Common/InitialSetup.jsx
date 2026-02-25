import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { requestSetupToken, finalizeSetup } from "../../api/authApi";
import { FaUserShield } from "react-icons/fa";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import "./InitialSetup.css";

export default function InitialSetup() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Security check: If no email state, user shouldn't be here
  useEffect(() => {
    if (!state?.email) {
      navigate("/login");
    }
  }, [state, navigate]);

  const [formData, setFormData] = useState({
    email: state?.email || "",
    newUsername: "",
    newPassword: "",
    confirmPassword: "",
    token: ""
  });

  // State for toggling password visibility
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [tokenSent, setTokenSent] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * HANDLES THE "GET CODE" BUTTON
   * Now calls the AuthController endpoint to avoid 403 Forbidden errors
   */
  const handleSendToken = async () => {
    setMsg({ type: "", text: "" });
    try {
      setLoading(true);
      // This calls the POST /api/auth/request-setup-token endpoint
      await requestSetupToken(formData.email);
      setTokenSent(true);
      setMsg({ type: "success", text: "A 6-digit verification code has been sent to your email." });
    } catch (err) {
      // Improved error capturing for 403/500 debugging
      const errorMsg = err.response?.data || "Failed to send code. Please try again later.";
      setMsg({ type: "error", text: typeof errorMsg === 'string' ? errorMsg : "Error connecting to server." });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    // Client-side Validation
    if (formData.newPassword.length < 6) {
      return setMsg({ type: "error", text: "Password must be at least 6 characters long." });
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return setMsg({ type: "error", text: "Passwords do not match!" });
    }

    try {
      setLoading(true);
      const payload = {
        email: formData.email,
        token: formData.token,
        newUsername: formData.newUsername,
        newPassword: formData.newPassword
      };

      // Calls the POST /api/auth/finalize-setup endpoint
      await finalizeSetup(payload);
      
      setMsg({ type: "success", text: "Account activated! Redirecting to login..." });
      
      // Delay to let the user read the success message
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const errorDetail = err.response?.data || "Setup failed. Please check your verification code.";
      setMsg({ type: "error", text: typeof errorDetail === "string" ? errorDetail : "Error updating account." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-wrapper">
      <div className="setup-card">
        <div className="setup-header">
          <FaUserShield className="setup-icon" />
          <h2>Account Setup</h2>
          <p>Please configure your permanent credentials to activate your payroll account.</p>
        </div>

        {msg.text && <div className={`status-msg ${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label>Registered Email</label>
            <input type="email" value={formData.email} disabled className="disabled-input" />
          </div>

          <div className="form-group">
            <label>Choose New Username</label>
            <input
              name="newUsername"
              type="text"
              placeholder="e.g. john_doe"
              required
              value={formData.newUsername}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-grid">
            {/* New Password Field */}
            <div className="form-group">
              <label>New Password</label>
              <div className="password-input-wrapper">
                <input
                  name="newPassword"
                  type={showNewPass ? "text" : "password"}
                  required
                  value={formData.newPassword}
                  onChange={handleInputChange}
                />
                <span className="toggle-icon" onClick={() => setShowNewPass(!showNewPass)}>
                  {showNewPass ? <AiFillEyeInvisible /> : <AiFillEye />}
                </span>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  name="confirmPassword"
                  type={showConfirmPass ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <span className="toggle-icon" onClick={() => setShowConfirmPass(!showConfirmPass)}>
                  {showConfirmPass ? <AiFillEyeInvisible /> : <AiFillEye />}
                </span>
              </div>
            </div>
          </div>

          <div className="token-section">
            <label>Verification Code</label>
            <div className="token-input-group">
              <input
                name="token"
                type="text"
                placeholder="6-digit code"
                required
                maxLength="6"
                value={formData.token}
                onChange={handleInputChange}
              />
              <button 
                type="button" 
                onClick={handleSendToken} 
                disabled={loading} 
                className="token-req-btn"
              >
                {loading ? "Sending..." : (tokenSent ? "Resend Code" : "Get Code")}
              </button>
            </div>
            <small className="token-hint">Check your email for the activation token.</small>
          </div>

          <button 
            type="submit" 
            className="activate-btn" 
            disabled={!tokenSent || loading || !formData.token}
          >
            {loading ? "Activating..." : "Finalize & Activate Account"}
          </button>
        </form>
      </div>
    </div>
  );
}