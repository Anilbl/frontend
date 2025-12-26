import React from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";

const Landing = () => {
  const navigate = useNavigate();

  const portals = [
    {
      id: "admin",
      title: "Admin Portal",
      desc: "Manage employees, payroll, and system configurations.",
      icon: "🛡️",
      path: "/login/admin",
      colorClass: "btn-admin",
    },
    {
      id: "accountant",
      title: "Accountant Portal",
      desc: "Process salaries, generate reports, and manage taxes.",
      icon: "📊",
      path: "/login/accountant",
      colorClass: "btn-accountant",
    },
    {
      id: "employee",
      title: "Employee Portal",
      desc: "View payslips, request leave, and track attendance.",
      icon: "👤",
      path: "/login/employee",
      colorClass: "btn-employee",
    },
  ];

  return (
    <div className="landing-wrapper">
      <div className="landing-overlay">
        <header className="landing-header">
          <div className="logo-brand">NAST</div>
          <h1>Payroll Management System</h1>
          <p>Secure Access to Your Personnel & Financial Gateway</p>
        </header>

        <main className="portal-grid">
          {portals.map((portal) => (
            <div key={portal.id} className="portal-card">
              <div className="portal-icon">{portal.icon}</div>
              <h3>{portal.title}</h3>
              <p>{portal.desc}</p>
              <button 
                className={`portal-btn ${portal.colorClass}`}
                onClick={() => navigate(portal.path)}
              >
                Enter Portal
              </button>
            </div>
          ))}
        </main>

        <footer className="landing-footer">
          <p>&copy; 2025 NAST Payroll System. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Landing;