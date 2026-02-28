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
  LineElement,
  Title
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels"; 
import api from "../../api/axios";
import "./Report.css";

// Register ChartJS components and the DataLabels plugin
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Tooltip, 
  Legend, 
  PointElement, 
  LineElement, 
  Title,
  ChartDataLabels
);

export default function Report() {
  const currentYear = new Date().getFullYear();
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const [year, setYear] = useState(currentYear);
  const [monthName, setMonthName] = useState(months[new Date().getMonth()]);
  const [stats, setStats] = useState({ totalGross: 0, totalNet: 0, totalTax: 0, paidCount: 0, departments: [] });
  const [monthlyPaidData, setMonthlyPaidData] = useState(new Array(12).fill(0));

  useEffect(() => {
    fetchReportData();
  }, [year, monthName]);

  const fetchReportData = async () => {
    try {
      const monthNum = months.indexOf(monthName) + 1;
      const [summaryRes, chartRes] = await Promise.all([
        api.get('/payrolls/salary-summary', { params: { month: monthNum, year: year } }),
        api.get(`/reports/analytics/monthly-payroll?year=${year}`)
      ]);

      setStats(summaryRes.data);
      
      const fullYearPaidData = months.map(m => {
        const found = chartRes.data.find(d => d.month === m);
        return found ? found.paidAmount || found.amount : 0; 
      });
      setMonthlyPaidData(fullYearPaidData);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency', currency: 'NPR', minimumFractionDigits: 0
    }).format(num || 0).replace("NPR", "Rs.");
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 35, // Increased padding to ensure 3-decimal labels aren't cut off
        bottom: 10
      }
    },
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true,
        color: "#1e293b",
        anchor: "end",
        align: "top",
        offset: 5,
        font: { 
          weight: "700", 
          size: 10, // Adjusted for longer strings
          family: "'Inter', sans-serif"
        },
        formatter: (value) => {
          if (!value || value === 0) return "";
          // Convert to 'k' and truncate to 3 decimal places without rounding
          const kValue = value / 1000;
          const truncated = (Math.trunc(kValue * 1000) / 1000).toFixed(3);
          return `${truncated}k`;
        }
      },
      tooltip: {
        backgroundColor: '#1e293b',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        callbacks: {
          label: (context) => ` Total Paid: ${formatCurrency(context.raw)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 11, weight: '600' },
          color: '#64748b'
        }
      },
      y: {
        beginAtZero: true,
        grace: '20%', // More space at the top for labels
        grid: { 
          color: '#f1f5f9',
          drawTicks: false
        },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          padding: 10,
          callback: (value) => {
            const kValue = value / 1000;
            // Truncate to 3 decimal places for axis consistency
            return (Math.trunc(kValue * 1000) / 1000).toFixed(3) + 'k';
          }
        }
      }
    }
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
        <StatItem title="Total Gross Paid" value={formatCurrency(stats.totalGross)} icon="💰" color="#10b981" />
        <StatItem title="Statutory Tax" value={formatCurrency(stats.totalTax)} icon="🏛️" color="#f59e0b" />
        <StatItem title="Net Disbursement" value={formatCurrency(stats.totalNet)} icon="🧾" color="#8b5cf6" />
      </div>

      <div className="main-content-grid">
        <div className="content-card chart-card">
          <div className="card-header"><h3>Annual Paid Expenditure ({year})</h3></div>
          <div className="chart-wrapper">
            <Bar 
              options={chartOptions}
              data={{
                labels: months,
                datasets: [{
                  label: 'Paid Amount',
                  data: monthlyPaidData,
                  backgroundColor: "rgba(16, 185, 129, 0.8)",
                  hoverBackgroundColor: "#059669",
                  borderRadius: 6,
                  barPercentage: 0.6,
                  categoryPercentage: 0.8
                }]
              }} 
            />
          </div>
        </div>

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
                <div className="report-progress-bar">
                  <div 
                    className="fill" 
                    style={{ 
                      width: `${d.totalEmployees > 0 ? (d.paidCount / d.totalEmployees) * 100 : 0}%`, 
                      backgroundColor: (d.paidCount === d.totalEmployees && d.totalEmployees > 0) ? '#10b981' : '#6366f1' 
                    }}
                  ></div>
                </div>
              </div>
            ))}
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