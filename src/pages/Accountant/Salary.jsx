import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Salary.css';

const Salary = () => {
  const [stats, setStats] = useState({
    totalGross: 0,
    totalDeductions: 0,
    totalNet: 0,
    departments: []
  });

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // Retrieve token from storage (set during login)
        const token = localStorage.getItem('token'); 
        
        // Updated URL to match the Controller: /api/payrolls/summary
        const res = await axios.get('http://localhost:8080/api/payrolls/summary', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setStats(res.data);
      } catch (err) {
        console.error("Error loading payroll data:", err);
        // If server is 403, it means the JWT token is missing or expired
      }
    };

    fetchSummary();
  }, []);

  const formatM = (num) => `Rs. ${(num / 1000000).toFixed(2)}M`;

  return (
    <div className="prof-container">
      <div className="prof-header">
        <h1>Salary Summaries</h1>
        <p>Live departmental expenditure from MySQL Database</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <span>Total Gross Pay</span>
          <h2>{formatM(stats.totalGross)}</h2>
        </div>
        <div className="metric-card red-border">
          <span>Total Deductions</span>
          <h2>{formatM(stats.totalDeductions)}</h2>
        </div>
        <div className="metric-card green-border">
          <span>Total Net Disbursement</span>
          <h2>{formatM(stats.totalNet)}</h2>
        </div>
      </div>

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
                  <p>Net Distribution: <strong>Rs. {d.net.toLocaleString()}</strong></p>
                </div>
                <div className="dept-progress-container">
                  <div className="progress-label">Tax (1%): Rs. {d.tax.toLocaleString()}</div>
                  <div className="progress-bar">
                    <div className="fill" style={{ width: `${(d.net / (d.net + d.tax)) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ padding: '20px', textAlign: 'center' }}>No payroll data processed yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Salary;