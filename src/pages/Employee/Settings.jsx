import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Settings.css";

const Settings = () => {
  const navigate = useNavigate();
  const [isNotificationsEnabled, setNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [employeeData, setEmployeeData] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const session = JSON.parse(localStorage.getItem("user_session") || "{}");
  const token = session.jwt || session.token;
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/employees/${session.empId}`, authHeader
        );
        setEmployeeData(res.data);
        setNotifications(res.data.emailNotifications ?? false);
        if (res.data.photoUrl) setPhotoPreview(res.data.photoUrl);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    };
    fetchData();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) return;
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append("photo", photoFile);
    try {
      await axios.post(
        `http://localhost:8080/api/employees/${session.empId}/upload-photo`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } }
      );
      setMessage({ type: "success", text: "✅ Photo uploaded!" });
      setPhotoFile(null);
    } catch (err) {
      setMessage({ type: "error", text: "❌ Photo upload failed." });
    } finally {
      setPhotoUploading(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const handleToggleEmail = async () => {
    const newValue = !isNotificationsEnabled;
    setNotifications(newValue);
    try {
      await axios.put(
        `http://localhost:8080/api/employees/email-preference/${session.empId}`,
        { emailNotifications: newValue }, authHeader
      );
    } catch (err) {
      setNotifications(!newValue);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    try {
      await axios.put(
        `http://localhost:8080/api/employees/change-password/${session.empId}`,
        { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "" });
      setTimeout(() => { setShowPasswordModal(false); setMessage({ type: "", text: "" }); }, 2000);
    } catch (err) {
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
            {/* Photo */}
            <div className="avatar-wrapper">
              {photoPreview
                ? <img src={photoPreview} alt="Profile" className="avatar-photo" />
                : <div className="profile-avatar">
                    {session.username ? session.username.charAt(0).toUpperCase() : "S"}
                  </div>
              }
              <label className="photo-upload-label">
                📷 Change Photo
                <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
              </label>
              {photoFile && (
                <button className="upload-btn" onClick={handlePhotoUpload} disabled={photoUploading}>
                  {photoUploading ? "Uploading..." : "Save Photo"}
                </button>
              )}
            </div>
            <h3>{session.username}</h3>
            <p className="role-tag">{session.role?.roleName || "Staff"}</p>
          </div>

          {/* Employee Details */}
          {employeeData && (
            <div className="info-list">
              <div className="info-item"><label>USER ID</label><span>{session.userId}</span></div>
              <div className="info-item"><label>EMPLOYEE CODE</label><span>{session.empId}</span></div>
              <div className="info-item"><label>FULL NAME</label><span>{employeeData.firstName} {employeeData.lastName}</span></div>
              <div className="info-item"><label>EMAIL</label><span>{employeeData.email}</span></div>
              <div className="info-item"><label>CONTACT</label><span>{employeeData.contact}</span></div>
              <div className="info-item"><label>DEPARTMENT</label><span>{employeeData.department?.deptName}</span></div>
              <div className="info-item"><label>DESIGNATION</label><span>{employeeData.position?.designationTitle}</span></div>
              <div className="info-item"><label>EMPLOYMENT</label><span>{employeeData.employmentStatus}</span></div>
              <div className="info-item"><label>JOINING DATE</label><span>{employeeData.joiningDate}</span></div>
              <div className="info-item"><label>BANK</label><span>{employeeData.primaryBankAccount?.bank?.bankName}</span></div>
              <div className="info-item"><label>ACCOUNT NO.</label><span>{employeeData.primaryBankAccount?.accountNumber}</span></div>
            </div>
          )}
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
                <input type="checkbox" checked={isNotificationsEnabled} onChange={handleToggleEmail} />
                <span className="slider round"></span>
              </label>
            </div>
          </section>
        </div>
      </div>

      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="settings-card password-modal">
            <h3>Update Password</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div className="input-group">
                <label>Current Password</label>
                <input type="password" required value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} />
              </div>
              <div className="input-group">
                <label>New Password</label>
                <input type="password" required value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
              </div>
              {message.text && (
                <p className={`status-msg ${message.type === "success" ? "success" : "error"}`}>{message.text}</p>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-text" onClick={() => { setShowPasswordModal(false); setMessage({ type: "", text: "" }); }}>Cancel</button>
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