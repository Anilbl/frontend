import React from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import "./EmployeeLayout.css";

const EmployeeLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    navigate("/");
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">NAST</div>
          <span className="brand-name">LMS Panel</span>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/employee/dashboard" 
            className={location.pathname === "/employee/dashboard" ? "active" : ""}
          >
            🏠 Dashboard
          </Link>
          <Link 
            to="/employee/attendance" 
            className={location.pathname === "/employee/attendance" ? "active" : ""}
          >
            🕒 Attendance
          </Link>
          <Link 
            to="/employee/leave" 
            className={location.pathname === "/employee/leave" ? "active" : ""}
          >
            📝 Leave Requests
          </Link>
          <Link 
            to="/employee/salary" 
            className={location.pathname === "/employee/salary" ? "active" : ""}
          >
            💰 Salary Info
          </Link>
          
          {/* FIXED: Pointing to /employee/settings to match the Route in App.js */}
          <Link 
            to="/employee/settings" 
            className={location.pathname === "/employee/settings" ? "active" : ""}
          >
            ⚙️ Profile Settings
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn-noticeable" onClick={handleLogout}>
              Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeLayout;