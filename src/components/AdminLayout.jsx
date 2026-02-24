import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    navigate("/");
  };

  const menuItems = [
    { path: "dashboard", label: "Dashboard", icon: "🏠" },
    { path: "users", label: "Users", icon: "👤" }, // Added User Module here
    { path: "employees", label: "Employees", icon: "👥" },
    { path: "attendance", label: "Attendance", icon: "📅" },
    { path: "leave", label: "Leave Requests", icon: "📝" },
    { path: "holidays", label: "Holidays", icon: "🏮" }, // NEW ITEM
    { path: "payroll", label: "Payroll", icon: "💰" },
    { path: "system-config", label: "System Config", icon: "⚙️" },
    { path: "report", label: "Reports", icon: "📊" }
  ];

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo-box">Payroll Management System</div>
        </div>

        <nav className="sidebar-nav">
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
        </nav>

        <button className="signout-btn" onClick={handleLogout}>Sign Out</button>
      </aside>

      {/* Main content + footer */}
      <div className="admin-main">
        <header className="admin-top-bar">
          {/* Optional top bar content */}
        </header>

        <div className="admin-content">
          <Outlet /> {/* Module content renders here */}
        </div>

        <footer className="admin-footer">
          &copy; {new Date().getFullYear()} Payroll Management System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;