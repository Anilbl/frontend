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

  // Dynamically determines the title for the header
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Financial Dashboard';
    if (path.includes('payroll')) return 'Payroll Verification';
    if (path.includes('salary')) return 'Salary Structure';
    return 'Finance Portal';
  };

  return (
    <div className="accountant-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>NAST</h2>
        </div>
        <nav className="sidebar-menu">
          <Link to="dashboard" className={location.pathname.includes('dashboard') ? 'active' : ''}>
            🏠 Dashboard
          </Link>
          <Link to="salary-management" className={location.pathname.includes('salary') ? 'active' : ''}>
            💸 Salary Management
          </Link>
          <Link to="payroll-processing" className={location.pathname.includes('payroll') ? 'active' : ''}>
            💰 Payroll Processing
          </Link>
          <Link to="tax-compliance" className={location.pathname.includes('tax') ? 'active' : ''}>
            📄 Tax & Compliance
          </Link>
        </nav>
        <button className="signout-btn" onClick={handleSignOut}>Sign Out</button>
      </aside>

      <main className="main-content">
        {/* IMPROVED HEADER: Spaced out elements to avoid overlap */}
        <header className="top-header">
          <div className="header-left">
            <h3 className="dynamic-title">{getPageTitle()}</h3>
          </div>
          
          <div className="user-info">
             <div className="status-indicator-active"></div>
             <div className="user-text">
                <span className="u-name">Finance Accountant</span>
                <span className="u-dept">Treasury Dept</span>
             </div>
          </div>
        </header>

        <section className="page-body">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AccountantLayout;