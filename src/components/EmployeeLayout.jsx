import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import "./EmployeeLayout.css";

const EmployeeLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sessionData = localStorage.getItem("user_session");
    if (!sessionData) {
      navigate("/");
      return;
    }
    setUser(JSON.parse(sessionData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    navigate("/");
  };

  // Check permissions for switching
  const hasAdmin = user?.isAdmin;
  const hasAccountant = user?.isAccountant;

  // Generate page title based on URL
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("dashboard")) return "Employee Dashboard";
    if (path.includes("attendance")) return "My Attendance Records";
    if (path.includes("leave")) return "Leave Management";
    if (path.includes("salary")) return "My Salary Details";
    if (path.includes("settings")) return "Profile Settings";
    return "Employee Portal";
  };

  const menuItems = [
    { path: "dashboard", label: "Dashboard", icon: "🏠" },
    { path: "attendance", label: "Attendance", icon: "🕒" },
    { path: "leave", label: "Leave Requests", icon: "📝" },
    { path: "salary", label: "Salary Info", icon: "💰" },
    { path: "settings", label: "Profile Settings", icon: "⚙️" }
  ];

  return (
    <div className="employee-layout-container">
      {/* SIDEBAR FIXED TO LEFT */}
      <aside className="employee-sidebar">
        <div className="sidebar-header">
          <div className="logo-box">Payroll Management System</div>
          {user && <div className="user-welcome">Hi, {user.username}</div>}
        </div>

        <nav className="sidebar-nav">
          <div className="menu-list">
            {menuItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="sidebar-actions-group">
            {(hasAdmin || hasAccountant) && (
              <div className="portal-switch-area">
                <label className="portal-label">PORTAL NAVIGATION</label>
                {hasAdmin && (
                  <button className="back-nav-btn" onClick={() => navigate("/admin/dashboard")}>
                    🛡️ Admin Portal
                  </button>
                )}
                {hasAccountant && (
                  <button className="back-nav-btn" onClick={() => navigate("/accountant/dashboard")}>
                    💸 Accountant Portal
                  </button>
                )}
              </div>
            )}

            <button className="logout-btn" onClick={handleLogout}>
              <span>🚪</span> Sign Out
            </button>
          </div>
        </nav>
      </aside>

      {/* CONTENT AREA THAT PUSHES FOOTER DOWN */}
      <div className="employee-main-wrapper">
        {/* Sticky Header - Adding a professional top bar like Accountant */}
        <header className="top-sticky-header">
          <h3 className="page-title">{getPageTitle()}</h3>
          <div className="user-indicator" style={{fontSize: '0.8rem', color: '#64748b'}}>
             <span style={{color: '#22c55e'}}>●</span> Online
          </div>
        </header>

        <main className="employee-main">
          <div className="employee-content">
            <Outlet />
          </div>
        </main>

        <footer className="employee-footer">
          &copy; {new Date().getFullYear()} Payroll Management System | NAST Employee Portal
        </footer>
      </div>
    </div>
  );
};

export default EmployeeLayout;