<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======
import React, { useState, useEffect, useMemo } from 'react';
>>>>>>> b35b79e1a86c81143135928d8198d847a383043c
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
  const [loading, setLoading] = useState(false);
  
  // State keys now match Backend DTO exactly
  const [stats, setStats] = useState({
<<<<<<< HEAD
    totalGross: 0, totalDeductions: 0, totalNet: 0, departments: []
=======
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    totalTax: 0,
    totalSSF: 0,
    totalOvertime: 0,
    paidCount: 0,
    departments: []
>>>>>>> b35b79e1a86c81143135928d8198d847a383043c
  });
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payrolls/salary-summary', {
        params: { 
          month: months.indexOf(selectedMonth) + 1, 
          year: selectedYear 
        }
      });
      // Directly setting the DTO response into state
      setStats(res.data);
    } catch (err) {
      console.error("Error loading payroll metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
<<<<<<< HEAD
    const fetchSummary = async () => {
      try {
        setLoading(true);
        // This must match the Controller's @RequestMapping + @GetMapping
        const res = await api.get('/payrolls/summary');
        setStats(res.data);
      } catch (err) {
        console.error("Dashboard connection failed:", err);
      } finally {
        setLoading(false);
      }
    };
=======
>>>>>>> b35b79e1a86c81143135928d8198d847a383043c
    fetchSummary();
  }, [selectedMonth, selectedYear]);

<<<<<<< HEAD
  const formatM = (num) => {
    if (!num || isNaN(num)) return "Rs. 0.00M";
    // Sarah & Mike's ~90k will show as 0.09M here. 
    // If you want more detail, use .toLocaleString() instead.
    return `Rs. ${(num / 1000000).toFixed(2)}M`;
=======
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(num || 0).replace("NPR", "Rs.");
>>>>>>> b35b79e1a86c81143135928d8198d847a383043c
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
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Row 1: Primary Metrics */}
      <div className="metrics-grid">
<<<<<<< HEAD
        <div className="metric-card"><span>Total Gross</span><h2>{formatM(stats.totalGross)}</h2></div>
        <div className="metric-card red-border"><span>Deductions</span><h2>{formatM(stats.totalDeductions)}</h2></div>
        <div className="metric-card green-border"><span>Net Disbursement</span><h2>{formatM(stats.totalNet)}</h2></div>
      </div>

      <div className="prof-card">
        <div className="dept-list">
          {stats.departments && stats.departments.length > 0 ? (
            stats.departments.map((d, i) => (
              <div key={i} className="dept-row">
                <div className="dept-info">
                  <h4>{d.name}</h4>
                  <p>Net Distribution: <strong>Rs. {parseFloat(d.net || 0).toLocaleString()}</strong></p>
                </div>
                <div className="dept-progress-container">
                  <div className="progress-bar">
                    <div className="fill" style={{ width: `${stats.totalNet > 0 ? (d.net / stats.totalNet) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No payroll records found.</p>
          )}
        </div>
=======
        <div className="metric-card">
          <span>Total Gross Pay</span>
          <h2>{formatCurrency(stats.totalGross)}</h2>
        </div>
        <div className="metric-card red-border">
          <span>Total Deductions</span>
          <h2>{formatCurrency(stats.totalDeductions)}</h2>
        </div>
        <div className="metric-card green-border">
          <span>Total Net Disbursement</span>
          <h2>{formatCurrency(stats.totalNet)}</h2>
        </div>
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

      <div className="prof-card">
        <div className="card-header">
          <h3>Departmental Breakdown</h3>
        </div>
        {loading ? <div className="loader">Updating Metrics...</div> : (
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
        )}
>>>>>>> b35b79e1a86c81143135928d8198d847a383043c
      </div>
    </div>
  );
};

export default Salary;