import React, { useState, useEffect, useMemo } from 'react';
import api from "../../api/axios";
import './Salary.css';

const Salary = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const years = useMemo(() => {
    const y = [];
    for (let i = currentYear; i >= 2020; i--) y.push(i);
    return y;
  }, [currentYear]);

  const [selectedMonth, setSelectedMonth] = useState(months[currentMonthIdx]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(false); // ✅ Single declaration

  const [stats, setStats] = useState({
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    totalTax: 0,
    totalSSF: 0,
    totalOvertime: 0,
    paidCount: 0,
    departments: []
  });

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payrolls/salary-summary', {
        params: {
          month: months.indexOf(selectedMonth) + 1,
          year: selectedYear
        }
      });
      setStats(res.data);
    } catch (err) {
      console.error("Error loading payroll metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth, selectedYear]);

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(num || 0).replace("NPR", "Rs.");
  };

  if (loading) return <div className="loading-state">Connecting to Database...</div>;

  return (
    <div className="prof-container">
      <div className="prof-header">
        <div>
          <h1>Financial Overview</h1>
          <p>Aggregated metrics for <strong>{selectedMonth} {selectedYear}</strong> (Status: PAID)</p>
        </div>

        <div className="date-selectors">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Row 1: Primary Metrics */}
      <div className="metrics-grid">
        <div className="metric-card"><span>Total Gross</span><h2>{formatCurrency(stats.totalGross)}</h2></div>
        <div className="metric-card red-border"><span>Deductions</span><h2>{formatCurrency(stats.totalDeductions)}</h2></div>
        <div className="metric-card green-border"><span>Net Disbursement</span><h2>{formatCurrency(stats.totalNet)}</h2></div>
      </div>

      {/* Row 2: Statutory & Operations */}
      <div className="metrics-grid secondary-metrics">
        <div className="metric-card orange-border">
          <span>Total Tax Collected</span>
          <h3>{formatCurrency(stats.totalTax)}</h3>
        </div>
        <div className="metric-card blue-border">
          <span>Total SSF Amount</span>
          <h3>{formatCurrency(stats.totalSSF)}</h3>
        </div>
        <div className="metric-card purple-border">
          <span>Total Overtime Pay</span>
          <h3>{formatCurrency(stats.totalOvertime)}</h3>
        </div>
        <div className="metric-card dark-border">
          <span>Paid Payrolls</span>
          <h3>{stats.paidCount} Records</h3>
        </div>
      </div>

      {/* Departmental Breakdown */}
      <div className="prof-card">
        <div className="card-header">
          <h3>Departmental Breakdown</h3>
        </div>
        <div className="dept-list">
          {stats.departments && stats.departments.length > 0 ? (
            stats.departments.map((d, i) => (
              <div key={i} className="dept-row">
                <div className="dept-info">
                  <h4>{d.name}</h4>
                  <p>Net Distribution: <strong>{formatCurrency(d.net)}</strong></p>
                </div>
                <div className="dept-progress-container">
                  <div className="progress-label">Tax Contribution: {formatCurrency(d.tax)}</div>
                  <div className="progress-bar">
                    <div
                      className="fill"
                      style={{ width: `${d.net ? (d.tax / (d.net + d.tax)) * 100 + 10 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              No records found for {selectedMonth} {selectedYear}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Salary;