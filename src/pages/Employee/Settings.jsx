import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();
  const [isNotificationsEnabled, setNotifications] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  // FIX: Using 'currentPassword' to match typical backend DTO expectations
  const [passwordData, setPasswordData] = useState({ 
    currentPassword: "", 
    newPassword: "" 
  });
  
  const [message, setMessage] = useState({ type: "", text: "" });

  // Load session from localStorage
  const session = JSON.parse(localStorage.getItem("user_session") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    navigate("/");
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    try {
      const token = session.jwt || session.token;
      const idToUse = session.userId; // Uses ID 14 from your logs

      // API call to your backend on port 8080
      const response = await axios.put(
        `http://localhost:8080/api/users/change-password/${idToUse}`, 
        {
          currentPassword: passwordData.currentPassword, 
          newPassword: passwordData.newPassword
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          } 
        }
      );

      setMessage({ type: "success", text: "Password updated successfully!" });
      
      // Clear fields and close modal after success
      setPasswordData({ currentPassword: "", newPassword: "" });
      setTimeout(() => {
        setShowPasswordModal(false);
        setMessage({ type: "", text: "" });
      }, 2000);

    } catch (err) {
      console.error("Server Error:", err.response?.data);
      const errorMsg = err.response?.data?.message || "Invalid credentials";
      setMessage({ type: "error", text: `Failed to update: ${errorMsg}` });
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p className="subtitle">Manage your profile and security preferences</p>
      </div>

      <div className="settings-grid">
        {/* Profile Card */}
        <div className="settings-card profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {session.username ? session.username.charAt(0).toUpperCase() : "S"}
            </div>
            <h3>{session.username || "shyam_worker"}</h3>
            <p className="role-tag">{session.role?.roleName || "Staff"}</p>
          </div>
          
          <div className="info-list">
            <div className="info-item">
              <label>USER ID</label>
              <span>{session.userId || "14"}</span>
            </div>
            <div className="info-item">
              <label>EMPLOYEE CODE</label>
              <span>{session.empId || "13"}</span>
            </div>
          </div>
        </div>

        {/* Options Card */}
        <div className="settings-card options-card">
          <section className="settings-section">
            <h3>Security</h3>
            <div className="setting-option">
              <div>
                <p className="option-title">Change Password</p>
                <p className="option-desc">Update your login credentials regularly</p>
              </div>
              <button className="btn-outline" onClick={() => setShowPasswordModal(true)}>Update</button>
            </div>
          </section>

          <section className="settings-section">
            <h3>Preferences</h3>
            <div className="setting-option">
              <div>
                <p className="option-title">Email Notifications</p>
                <p className="option-desc">Receive payslip alerts and leave updates</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={isNotificationsEnabled} 
                  onChange={() => setNotifications(!isNotificationsEnabled)} 
                />
                <span className="slider round"></span>
              </label>
            </div>
          </section>

          <section className="settings-section danger-zone">
            <h3>Session Management</h3>
            <div className="setting-option">
              <div>
                <p className="option-title">Account Security</p>
                <p className="option-desc">Sign out from this active device</p>
              </div>
              <button className="btn-danger-outline" onClick={handleLogout}>Logout</button>
            </div>
          </section>
        </div>
      </div>

      {/* Password Modal Overlay */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="settings-card password-modal">
            <h3>Update Password</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div className="input-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  required 
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  required 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                />
              </div>

              {message.text && (
                <p className={`status-msg ${message.type === "success" ? "success" : "error"}`}>
                  {message.text}
                </p>
              )}

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-text" 
                  onClick={() => {
                    setShowPasswordModal(false);
                    setMessage({ type: "", text: "" });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;