import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./ProfileSettings.css"; 

const ProfileSettings = () => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    address: "",
    position: { designationTitle: "" }
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const sessionData = localStorage.getItem("user_session");
    
    if (!sessionData) {
      setLoading(false);
      setMessage("Session Error: No session found. Please log in.");
      return;
    }
    
    const session = JSON.parse(sessionData);
    // Use empId if available, otherwise fallback to userId for lookup
    const targetId = session.empId; 
    
    if (targetId) {
      try {
        const token = session.token || session.jwt;
        // API call to the fixed endpoint using the synced ID
        const res = await axios.get(`http://localhost:8080/api/employees/profile/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` } 
        });
        
        if (res.data) {
          setProfile(res.data);
          setMessage(""); 
        } else {
          setMessage("Profile record not found in database.");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setMessage("Your session is out of sync with the database.");
      } finally {
        setLoading(false); 
      }
    } else {
      // This part handles the specific error seen in your screenshot
      setLoading(false);
      setMessage("No Employee ID found in current session. Please Reset.");
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const sessionData = localStorage.getItem("user_session");
    if (!sessionData) return;
    const session = JSON.parse(sessionData);

    try {
      await axios.put(`http://localhost:8080/api/employees/profile/update/${session.empId}`, profile, {
        headers: { Authorization: `Bearer ${session.token || session.jwt}` }
      });
      setMessage("✅ Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Update failed. Check backend connection.");
    }
  };

  // Clears the stale 'null' ID and forces a fresh login to grab ID 13
  const handleLogoutFix = () => {
    localStorage.removeItem("user_session");
    window.location.href = "/login";
  };

  if (loading) return (
    <div className="loading-container" style={{padding: "40px", textAlign: "center"}}>
      <div className="spinner"></div>
      <p>Fetching your profile data...</p>
    </div>
  );

  return (
    <div className="profile-settings-container">
      <div className="profile-card">
        <div className="profile-sidebar">
          <div className="avatar-circle">
            {profile.firstName?.charAt(0) || "U"}{profile.lastName?.charAt(0) || ""}
          </div>
          <h3>{profile.firstName || "User"} {profile.lastName || ""}</h3>
          <p className="role-tag">{profile.position?.designationTitle || "Staff Member"}</p>
          
          {/* CRITICAL FIX: The Reset button to clear the 'No ID' error */}
          {(message.includes("ID") || message.includes("sync")) && (
            <button onClick={handleLogoutFix} className="fix-session-btn">
              Reset Session & Log In
            </button>
          )}
        </div>

        <form className="profile-main-form" onSubmit={handleUpdate}>
          <div className="form-section">
            <h4>Account Information</h4>
            <div className="input-grid">
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={profile.email || ""} 
                  disabled 
                  placeholder="Loading email..."
                />
              </div>
              <div className="input-group">
                <label>Contact Number</label>
                <input 
                  type="text" 
                  value={profile.contactNumber || ""} 
                  onChange={(e) => setProfile({...profile, contactNumber: e.target.value})} 
                  placeholder="Enter contact number"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4>Personal Details</h4>
            <div className="input-group">
              <label>Residential Address</label>
              <input 
                type="text" 
                value={profile.address || ""} 
                onChange={(e) => setProfile({...profile, address: e.target.value})} 
                placeholder="Enter address"
              />
            </div>
          </div>

          <button type="submit" className="update-profile-btn" disabled={!!message && !message.includes('✅')}>
            Save Changes
          </button>
          
          {message && (
            <p className={`form-feedback ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;