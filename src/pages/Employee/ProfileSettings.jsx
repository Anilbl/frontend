import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ProfileSettings.css";

const API_BASE = "http://localhost:8080/api/employees";

const ProfileSettings = () => {

  // =========================
  // SESSION
  // =========================
  const session = JSON.parse(localStorage.getItem("user_session") || "{}");
  const empId = session.empId;
  const token = session.token || session.jwt;

  const authHeader = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };

  // =========================
  // STATES
  // =========================
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
    position: { designationTitle: "" },
    emailNotifications: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  // =========================
  // FETCH PROFILE
  // =========================
  useEffect(() => {
    const fetchProfile = async () => {
      if (!empId || !token) {
        setMessage("❌ Session expired. Please login again.");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `${API_BASE}/${empId}`,
          authHeader
        );

        setProfile({
          ...res.data,
          emailNotifications: res.data.emailNotifications ?? false
        });

      } catch (err) {
        console.error(err);
        setMessage("❌ Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // =========================
  // UPDATE PROFILE
  // =========================
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await axios.put(
        `${API_BASE}/${empId}`,
        profile,
        authHeader
      );

      setMessage("✅ Profile updated successfully!");

    } catch (err) {
      setMessage(
        err.response?.data?.message ||
        "❌ Failed to update profile."
      );
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // =========================
  // CHANGE PASSWORD
  // =========================
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage("❌ New passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage("");

    try {
      await axios.put(
        `${API_BASE}/change-password/${empId}`,
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        authHeader
      );

      setPasswordMessage("✅ Password changed successfully!");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

    } catch (err) {
      setPasswordMessage(
        err.response?.data ||
        "❌ Password change failed."
      );
    } finally {
      setPasswordLoading(false);
      setTimeout(() => setPasswordMessage(""), 3000);
    }
  };

  // =========================
  // EMAIL TOGGLE
  // =========================
  const handleToggleEmail = async () => {
    const newValue = !profile.emailNotifications;

    try {
      await axios.put(
        `${API_BASE}/email-preference/${empId}`,
        { emailNotifications: newValue },
        authHeader
      );

      setProfile({ ...profile, emailNotifications: newValue });

    } catch (err) {
      console.error("Email preference update failed");
    }
  };

  // =========================
  // LOADING SCREEN
  // =========================
  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h3>Loading profile...</h3>
      </div>
    );
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="profile-settings-container">
      <div className="profile-card">

        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="avatar-circle">
            {profile.firstName?.charAt(0)}
            {profile.lastName?.charAt(0)}
          </div>

          <h3>{profile.firstName} {profile.lastName}</h3>
          <p>{profile.position?.designationTitle}</p>
        </div>

        {/* Main Content */}
        <div className="profile-main-form">

          {/* PROFILE UPDATE */}
          <form onSubmit={handleProfileUpdate} className="form-section">
            <h4>Account Information</h4>

            <div className="input-group">
              <label>Email</label>
              <input type="email" value={profile.email} disabled />
            </div>

            <div className="input-group">
              <label>Contact Number</label>
              <input
                type="text"
                value={profile.contactNumber || ""}
                onChange={(e) =>
                  setProfile({ ...profile, contactNumber: e.target.value })
                }
              />
            </div>

            <div className="input-group">
              <label>Address</label>
              <input
                type="text"
                value={profile.address || ""}
                onChange={(e) =>
                  setProfile({ ...profile, address: e.target.value })
                }
              />
            </div>

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {message && <p className="form-feedback">{message}</p>}
          </form>

          {/* CHANGE PASSWORD */}
          <form onSubmit={handleChangePassword} className="form-section">
            <h4>Security - Change Password</h4>

            <div className="input-group">
              <label>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value
                  })
                }
                required
              />
            </div>

            <div className="input-group">
              <label>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value
                  })
                }
                required
              />
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value
                  })
                }
                required
              />
            </div>

            <button type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>

            {passwordMessage && (
              <p className="form-feedback">{passwordMessage}</p>
            )}
          </form>

          {/* EMAIL NOTIFICATION */}
          <div className="form-section">
            <h4>Email Notifications</h4>

            <label>
              <input
                type="checkbox"
                checked={profile.emailNotifications || false}
                onChange={handleToggleEmail}
              />
              Receive Payslip & Leave Alerts
            </label>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;