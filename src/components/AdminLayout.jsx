import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { getRoles } from "../api/roleApi"; 
import "./AdminLayout.css";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(null);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionData = localStorage.getItem("user_session");
    if (!sessionData) {
      navigate("/");
      return;
    }
    const parsedUser = JSON.parse(sessionData);
    setUser(parsedUser);

    const fetchPermissions = async () => {
      try {
        const response = await getRoles();
        setAvailableRoles(response.data);
      } catch (err) {
        console.error("Could not verify roles:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPermissions();
  }, [navigate]);

  const hasAdmin = user?.isAdmin;
  const hasAccountant = user?.isAccountant;
  const hasEmployee = user?.hasEmployeeRole;

  const isInsideAdmin = location.pathname.includes("/admin");
  const isInsideAccountant = location.pathname.includes("/accountant");
  const isInsideEmployee = location.pathname.includes("/employee");
  const currentPortal = isInsideAdmin ? "ADMIN" : isInsideAccountant ? "ACCOUNTANT" : "EMPLOYEE";

  const handleRoleSwitch = (e) => {
    const selectedPortal = e.target.value;
    if (!selectedPortal || selectedPortal === currentPortal) return;
    
    if (selectedPortal === "ADMIN") navigate("/admin/dashboard");
    else if (selectedPortal === "ACCOUNTANT") navigate("/accountant/dashboard");
    else if (selectedPortal === "EMPLOYEE") navigate("/employee/dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    navigate("/");
  };

  const menuItems = [
    { path: "dashboard", label: "Dashboard", icon: "🏠" },
    { path: "users", label: "Users", icon: "👤" },
    { path: "employees", label: "Employees", icon: "👥" },
    { path: "attendance", label: "Attendance", icon: "📅" },
    { path: "leave", label: "Leave Requests", icon: "📝" },
    { path: "holidays", label: "Holidays", icon: "🏮" },
    { path: "payroll", label: "Payroll", icon: "💰" },
    { path: "system-config", label: "System Config", icon: "⚙️" },
    { path: "report", label: "Reports", icon: "📊" }
  ];

  if (isLoading) return <div className="loading-screen">Verifying Permissions...</div>;

  return (
    <div className="admin-layout-wrapper">
      {/* SIDEBAR FIXED TO LEFT */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo-box">Admin Payroll Portal</div>
          {user && <div className="user-welcome">Welcome, {user.username}</div>}
        </div>

        <nav className="sidebar-nav">
          <div className="menu-list">
            {menuItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="sidebar-actions-group">
            <div className="role-switcher-container">
              <label htmlFor="role-switch">PORTAL NAVIGATION</label>
              <select id="role-switch" className="role-select" onChange={handleRoleSwitch} value={currentPortal}>
                {availableRoles.map((role) => {
                  const rName = role.roleName.toUpperCase();
                  if (rName === "ADMIN" && hasAdmin) return <option key={role.roleId} value="ADMIN">Admin Portal</option>;
                  if (rName === "ACCOUNTANT" && hasAccountant) return <option key={role.roleId} value="ACCOUNTANT">Accountant Portal</option>;
                  if (rName === "EMPLOYEE" && hasEmployee) return <option key={role.roleId} value="EMPLOYEE">Employee Portal</option>;
                  return null;
                })}
              </select>
            </div>

            {((isInsideAccountant && hasAdmin) || (isInsideEmployee && hasAccountant)) && (
              <div className="back-nav-container">
                 {isInsideAccountant && hasAdmin && <button className="back-nav-btn" onClick={() => navigate("/admin/dashboard")}>⬅ Back to Admin</button>}
                 {isInsideEmployee && hasAccountant && <button className="back-nav-btn" onClick={() => navigate("/accountant/dashboard")}>⬅ Back to Accountant</button>}
              </div>
            )}

            <button className="signout-btn" onClick={handleLogout}>
              <span className="signout-icon">🚪</span> Sign Out
            </button>
          </div>
        </nav>
      </aside>

      {/* CONTENT AREA THAT PUSHES FOOTER DOWN */}
      <div className="admin-main-wrapper">
        <main className="admin-main">
          <div className="admin-content">
            <Outlet />
          </div>
        </main>

        <footer className="admin-footer">
          &copy; {new Date().getFullYear()} Payroll Management System. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default AdminLayout;