import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import './AccountantLayout.css';

const AccountantLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    localStorage.removeItem("user_session");
    navigate("/");
  };

  const menuItems = [
    { path: 'dashboard', label: 'Dashboard', icon: '📊' },
    { path: 'salary-management', label: 'Salary Management', icon: '💸' },
    { path: 'payroll-processing', label: 'Payroll Center', icon: '⚙️' },
    { path: 'tax-compliance', label: 'Tax & Compliance', icon: '📋' },
    { path: 'financial-reports', label: 'Reports', icon: '📈' },
  ];

  const getPageTitle = () => {
    const path = location.pathname.split('/').pop();
    return path.replace(/-/g, ' ').toUpperCase();
  };

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">N</div>
          <h1>NAST Payroll</h1>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname.includes(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-action" onClick={handleSignOut}>Sign Out</button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-header">
          <div className="header-context">
            <span className="breadcrumb">Accountant / {getPageTitle()}</span>
          </div>
          <div className="header-profile">
            <div className="profile-pill-accountant">
              <span className="online-status"></span>
              <div className="profile-meta">
                <strong>Finance Accountant</strong>
                <small>Treasury Dept</small>
              </div>
            </div>
          </div>
        </header>

        <section className="app-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AccountantLayout;