import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  PointElement,
  LineElement
} from "chart.js";
import api from "../../api/axios";
import "./Report.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, PointElement, LineElement);

export default function Report() {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const [year, setYear] = useState(currentYear);
  const [monthName, setMonthName] = useState(months[currentMonthIdx]);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalGross: 0,
    totalNet: 0,
    totalTax: 0,
    paidCount: 0, // This is the global count of paid records
    departments: [] 
  });

  const [monthlyPayrollData, setMonthlyPayrollData] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [year, monthName]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const monthNum = months.indexOf(monthName) + 1;
      const [summaryRes, chartRes] = await Promise.all([
        api.get('/payrolls/salary-summary', { params: { month: monthNum, year: year } }),
        api.get(`/reports/analytics/monthly-payroll?year=${year}`)
      ]);

      setStats(summaryRes.data);
      setMonthlyPayrollData(chartRes.data);
    } catch (error) {
      console.error("Error fetching report analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency', currency: 'NPR', minimumFractionDigits: 0
    }).format(num || 0).replace("NPR", "Rs.");
  };

  return (
    <div className="report-container">
      <div className="report-toolbar">
        <div className="text-content">
          <h1>Analytics Overview</h1>
          <p>Financial Distribution for <strong>{monthName} {year}</strong></p>
        </div>

        <div className="filter-group">
          <div className="select-box">
            <span>Year</span>
            <select value={year} onChange={e => setYear(Number(e.target.value))}>
              {[0, 1, 2, 3, 4].map(i => <option key={i} value={currentYear - i}>{currentYear - i}</option>)}
            </select>
          </div>
          <div className="select-box">
            <span>Month</span>
            <select value={monthName} onChange={e => setMonthName(e.target.value)}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="stats-ribbon">
        <StatItem title="Global Paid Count" value={stats.paidCount} icon="👥" color="#3b82f6" />
        <StatItem title="Total Gross Payroll" value={formatCurrency(stats.totalGross)} icon="💰" color="#10b981" />
        <StatItem title="Statutory Tax" value={formatCurrency(stats.totalTax)} icon="🏛️" color="#f59e0b" />
        <StatItem title="Net Disbursement" value={formatCurrency(stats.totalNet)} icon="🧾" color="#8b5cf6" />
      </div>

      <div className="main-content-grid">
        <div className="content-card chart-card">
          <div className="card-header"><h3>Annual Expenditure Trend</h3></div>
          <div className="chart-wrapper">
            <Bar data={{
              labels: monthlyPayrollData.map(item => item.month),
              datasets: [{
                label: "Expenditure (NPR)",
                data: monthlyPayrollData.map(item => item.amount),
                backgroundColor: "rgba(25, 118, 210, 0.8)",
                borderRadius: 6
              }]
            }} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>

        {/* DEPARTMENTAL BREAKDOWN WITH DUAL COUNTS */}
        <div className="content-card attendance-card">
          <div className="card-header">
            <h3>Departmental Workforce</h3>
            <span className="date-tag">Paid vs Total</span>
          </div>

          <div className="attendance-list">
            {stats.departments?.map((d, i) => (
              <div key={i} className="dept-report-row">
                <div className="dept-main-info">
                  <span className="dept-name-label">{d.name}</span>
                  <div className="dept-badge-group">
                    <span className="count-badge paid">{d.paidCount || 0} Paid</span>
                    <span className="count-badge total">/ {d.totalEmployees || 0} Total</span>
                  </div>
                </div>
                
                <div className="dept-financial-detail">
                  <div className="detail-item">
                    <span className="tiny-label">Department Net</span>
                    <span className="value-bold">{formatCurrency(d.net)}</span>
                  </div>
                </div>
                
                <div className="report-progress-bar">
                  <div 
                    className="fill" 
                    style={{ 
                      // Progress bar shows how many are paid vs total in that department
                      width: `${d.totalEmployees > 0 ? (d.paidCount / d.totalEmployees) * 100 : 0}%`,
                      backgroundColor: (d.paidCount === d.totalEmployees && d.totalEmployees > 0) ? '#10b981' : '#6366f1'
                    }}
                  ></div>
                </div>
              </div>
            ))}
            
            {(!stats.departments || stats.departments.length === 0) && (
              <div className="empty-state">No departmental records for this period.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ title, value, icon, color }) {
  return (
    <div className="stat-item" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>{icon}</div>
      <div className="stat-info">
        <span className="stat-title">{title}</span>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  );
}