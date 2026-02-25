import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import './AccountantLayout.css';

const AccountantLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sessionData = localStorage.getItem("user_session");
    if (sessionData) {
      setUser(JSON.parse(sessionData));
    } else {
      navigate("/");
    }
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.removeItem("user_session");
    navigate("/");
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Financial Dashboard';
    if (path.includes('salary')) return 'Salary Structure';
    if (path.includes('payroll')) return 'Payroll Verification';
    if (path.includes('tax')) return 'Tax & Compliance';
    return 'Finance Portal';
  };

  // Permission Checks
  const canGoToAdmin = user?.isAdmin === true;
  const canGoToEmployee = user?.hasEmployeeRole === true;

  return (
    <div className="accountant-container">
      {/* SIDEBAR SECTION */}
      <aside className="sidebar">
        <div className="sidebar-top-section">
          <div className="sidebar-logo">
            <h2>NAST</h2>
            <p>Finance Management</p>
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

            {/* DYNAMIC PORTAL SWITCH AREA */}
            {(canGoToAdmin || canGoToEmployee) && (
              <div className="portal-switch-area">
                <span className="switch-label">SWITCH PORTAL</span>
                {canGoToAdmin && (
                  <button className="switch-btn admin-link" onClick={() => navigate("/admin/dashboard")}>
                    🛡️ Admin Portal
                  </button>
                )}
                {canGoToEmployee && (
                  <button className="switch-btn employee-link" onClick={() => navigate("/employee/dashboard")}>
                    👤 My Employee Self
                  </button>
                )}
              </div>
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="signout-btn" onClick={handleSignOut}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-content-wrapper">
        <header className="top-header">
          <div className="header-left">
            <h3 className="dynamic-title">{getPageTitle()}</h3>
          </div>
          
          <div className="user-info">
             <div className="status-indicator-active"></div>
             <div className="user-text">
                <span className="u-name">{user?.username || "Accountant"}</span>
                <span className="u-dept">Treasury Dept</span>
             </div>
          </div>
        </header>

        <main className="page-body">
          <Outlet />
        </main>

        <footer className="accountant-footer">
          &copy; {new Date().getFullYear()} Payroll Management System | Developed by NAST
        </footer>
      </div>
    </div>
  );
};

export default AccountantLayout;