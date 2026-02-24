import React, { useState, useEffect, useMemo } from 'react';
import api from "../../api/axios"; 
import './AccountantDashboard.css';

const AccountantDashboard = () => {
  // --- 1. Date Configuration ---
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const years = useMemo(() => {
    const y = [];
    for (let i = currentYear; i >= 2020; i--) y.push(i);
    return y;
  }, [currentYear]);

  // --- 2. State Management ---
  const [selectedMonth, setSelectedMonth] = useState(months[currentMonthIdx]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  
  const [metrics, setMetrics] = useState({
    totalNet: 0,
    totalTax: 0,
    totalSSF: 0,
    paidCount: 0,
    totalGross: 0,
    totalDeductions: 0,
    payrollStatus: "Active"
  });

  // --- 3. Data Fetching ---
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payrolls/salary-summary', {
        params: { 
          month: months.indexOf(selectedMonth) + 1, 
          year: selectedYear 
        }
      });
      
      setMetrics({
        ...res.data,
        payrollStatus: res.data.paidCount > 0 ? "Processed" : "Pending"
      });
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
      setMetrics(prev => ({ ...prev, payrollStatus: "Fetch Error" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedMonth, selectedYear]);

  // --- 4. Helper Functions ---
  const formatCurrency = (num) => {
    if (!num || isNaN(num)) return "Rs. 0.00";
    return new Intl.NumberFormat('en-NP', { 
      style: 'currency', 
      currency: 'NPR',
      minimumFractionDigits: 0 
    }).format(num).replace("NPR", "Rs.");
  };

  return (
    <div className="pro-dash-content">
      {/* Header Section */}
      <header className="pro-dash-header">
        <div className="header-text">
          <h1>Accountant <span className="highlight">Command Center</span></h1>
          <p>Real-time payroll status  • Fiscal Year {selectedYear}</p>
        </div>
        
        <div className="header-controls">
          <div className="dashboard-selectors">
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="header-date">
             📅 {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </header>

      {/* Main KPI Section */}
      <section className="kpi-stack-section">
        <div className="section-header-flex">
            <h3 className="sub-section-title">Critical Metrics ({selectedMonth})</h3>
            <span className={`live-indicator ${loading ? 'syncing' : ''}`}>
              {loading ? '● SYNCING...' : '● LIVE DATA'}
            </span>
        </div>
        
        <div className="vertical-kpi-stack">
          
          {/* Net Disbursement */}
          <div className="kpi-linear-card blue-glow">
            <div className="kpi-icon-container">💰</div>
            <div className="kpi-main-info">
              <span className="kpi-tag">Net Disbursement</span>
              <h2 className="kpi-amount">{formatCurrency(metrics.totalNet)}</h2>
            </div>
            <div className="kpi-meta">
              <span className="meta-label">Status</span>
              <span className={`status-pill ${metrics.paidCount > 0 ? 'status-active' : 'status-warn'}`}>
                {metrics.payrollStatus}
              </span>
            </div>
          </div>

          {/* Statutory Obligations */}
          <div className="kpi-linear-card indigo-glow">
            <div className="kpi-icon-container">🏛️</div>
            <div className="kpi-main-info">
              <span className="kpi-tag">Tax & SSF Liabilities</span>
              <h2 className="kpi-amount">{formatCurrency(metrics.totalTax + metrics.totalSSF)}</h2>
            </div>
            <div className="kpi-meta">
              <span className="meta-label">Compliance</span>
              <span className="status-pill status-secure">Govt. Compliant</span>
            </div>
          </div>

          {/* Processed Records */}
          <div className="kpi-linear-card amber-glow">
            <div className="kpi-icon-container">📄</div>
            <div className="kpi-main-info">
              <span className="kpi-tag">Processed Payrolls</span>
              <h2 className="kpi-amount">{metrics.paidCount} Records</h2>
            </div>
            <div className="kpi-meta">
              <span className="meta-label">Action</span>
              <span className="status-pill status-active">Verified</span>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default AccountantDashboard;