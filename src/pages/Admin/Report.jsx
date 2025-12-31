import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from "chart.js";
import api from "../../api/axios"; // Axios instance pointing to localhost:8080
import "./Report.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function Report() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const [payrollSummary, setPayrollSummary] = useState({
    totalEmployees: 0,
    monthlyPayroll: 0,
    totalDeductions: 0,
    totalAllowances: 0,
    pendingLeaves: 0
  });

  const [monthlyPayrollData, setMonthlyPayrollData] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({
    presentDays: 0,
    absentDays: 0,
    leaveDays: 0
  });

  // Fetch payroll data
  useEffect(() => {
    fetchPayrollData();
  }, [year]);

  // Fetch attendance data
  useEffect(() => {
    fetchAttendanceData();
  }, [year, month]);

  const fetchPayrollData = async () => {
    try {
      const summaryRes = await api.get(`/reports/analytics/summary?year=${year}`);
      const monthlyRes = await api.get(`/reports/analytics/monthly-payroll?year=${year}`);

      setPayrollSummary(summaryRes.data);
      setMonthlyPayrollData(monthlyRes.data);
    } catch (error) {
      console.error("Failed to load payroll data", error);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const res = await api.get(`/reports/attendance/summary?year=${year}&month=${month}`);
      setAttendanceSummary(res.data);
    } catch (error) {
      console.error("Failed to load attendance data", error);
    }
  };

  const payrollChart = {
    labels: monthlyPayrollData.map(item => item.month),
    datasets: [
      {
        label: "Total Salary Paid (NPR)",
        data: monthlyPayrollData.map(item => item.amount),
        backgroundColor: "#1976d2"
      }
    ]
  };

  return (
    <div className="report-page">

      {/* LEFT COLUMN */}
      <div className="report-left">
        <header className="report-header">
          <h1>Payroll & Attendance Reports</h1>
          <p>Consolidated payroll and attendance insights</p>

          <div className="filters">
            <label>
              Year: 
              <select value={year} onChange={e => setYear(Number(e.target.value))}>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </label>

            <label>
              Month: 
              <select value={month} onChange={e => setMonth(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>{i+1}</option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="report-summary">
          <SummaryCard title="Total Employees" value={payrollSummary.totalEmployees} icon="👥" />
          <SummaryCard title="Monthly Payroll" value={`NPR ${payrollSummary.monthlyPayroll}`} icon="💰" />
          <SummaryCard title="Total Deductions" value={`NPR ${payrollSummary.totalDeductions}`} icon="📉" />
          <SummaryCard title="Total Allowances" value={`NPR ${payrollSummary.totalAllowances}`} icon="🧾" />
          <SummaryCard title="Pending Leaves" value={payrollSummary.pendingLeaves} icon="🕒" />
        </div>

        <div className="attendance-summary">
          <h3>Attendance Summary ({month}/{year})</h3>
          <SummaryCard title="Present Days" value={attendanceSummary.presentDays} icon="✅" />
          <SummaryCard title="Absent Days" value={attendanceSummary.absentDays} icon="❌" />
          <SummaryCard title="Leave Days" value={attendanceSummary.leaveDays} icon="🛌" />
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="report-right">
        <div className="chart-section">
          <h2>Monthly Payroll Expenditure</h2>
          {monthlyPayrollData.length > 0 ? (
            <Bar
              data={payrollChart}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: "bottom" }
                }
              }}
              height={180}
            />
          ) : (
            <p>No payroll data available</p>
          )}
        </div>
      </div>

    </div>
  );
}

/* Reusable Summary Card */
function SummaryCard({ title, value, icon }) {
  return (
    <div className="summary-card">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}
