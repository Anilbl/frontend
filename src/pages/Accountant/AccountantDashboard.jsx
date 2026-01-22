import React, { useState, useEffect } from 'react';
// IMPORT FIX: We must use the custom 'api' instance to include the JWT token
import api from "../../api/axios"; 
import './AccountantDashboard.css';

const AccountantDashboard = () => {
  const [metrics, setMetrics] = useState({
    monthlyPayrollTotal: 0,
    payrollStatus: "Loading...",
    compliancePercentage: 0,
    pendingVerifications: 0
  });

  useEffect(() => {
    // LOGIC FIX: 
    // 1. Use 'api' instead of 'axios' so the Authorization header is attached.
    // 2. Use the relative path '/salary-summary/command-center' 
    //    because your api config already defines 'http://localhost:8080/api' as the baseURL.
    api.get('/salary-summary/command-center')
      .then(res => {
        // res.data will now contain the metrics from the backend
        setMetrics(res.data);
      })
      .catch(err => {
        console.error("Dashboard data fetch failed:", err);
        setMetrics(prev => ({ ...prev, payrollStatus: "Fetch Error" }));
      });
  }, []);

  /**
   * Formatter for currency display
   * Added a check to prevent errors if monthlyPayrollTotal is undefined
   */
  const formatM = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "Rs. 0.0M";
    return `Rs. ${(num / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="pro-dash-content">
      <header className="pro-dash-header">
        <div className="header-text">
          <h1>Accountant <span className="highlight">Command Center</span></h1>
          <p>Real-time payroll status for NAST System • Fiscal Year 2025/26</p>
        </div>
        <div className="header-date">
          <span className="calendar-icon">📅</span> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </header>

      <section className="kpi-stack-section">
        <div className="section-header-flex">
            <h3 className="sub-section-title">Critical Metrics</h3>
            <span className="live-indicator">● LIVE DATA</span>
        </div>
        
        <div className="vertical-kpi-stack">
          
          {/* Monthly Payroll Row */}
          <div className="kpi-linear-card blue-glow">
            <div className="kpi-icon-container">💰</div>
            <div className="kpi-main-info">
              <span className="kpi-tag">Monthly Payroll</span>
              <h2 className="kpi-amount">{formatM(metrics.monthlyPayrollTotal)}</h2>
            </div>
            <div className="kpi-meta">
              <span className="meta-label">Status</span>
              <span className="status-pill status-active">{metrics.payrollStatus}</span>
            </div>
          </div>

          {/* Tax Compliance Row */}
          <div className="kpi-linear-card indigo-glow">
            <div className="kpi-icon-container">🏛️</div>
            <div className="kpi-main-info">
              <span className="kpi-tag">Tax & SSF Compliance</span>
              <h2 className="kpi-amount">{metrics.compliancePercentage}% Verified</h2>
            </div>
            <div className="kpi-meta">
              <span className="meta-label">Audit</span>
              <span className="status-pill status-secure">Government Compliant</span>
            </div>
          </div>

          {/* Pending Verifications Row */}
          <div className="kpi-linear-card amber-glow">
            <div className="kpi-icon-container">⏳</div>
            <div className="kpi-main-info">
              <span className="kpi-tag">Pending Verifications</span>
              <h2 className="kpi-amount">{metrics.pendingVerifications} Records</h2>
            </div>
            <div className="kpi-meta">
              <span className="meta-label">Action</span>
              <span className="status-pill status-warn">Review Required</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountantDashboard;