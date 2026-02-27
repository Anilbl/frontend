import React, { useState, useEffect } from "react";
import { getDashboardStats } from "../../api/employeeApi";
import { getAttendanceByEmployee } from "../../api/attendanceApi";
import api from "../../api/axios"; // Import the same axios instance used in Leave Management
import "./EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState({
    name: "Employee",
    attendance: "0%",
    leaveBalance: "0 Days",
    lastSalary: "Rs. 0",
    tax: "Rs. 0",
    totalAllowances: "Rs. 0",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const session = JSON.parse(localStorage.getItem("user_session") || "{}");
        const empId = session.empId;
        if (!empId) return;

        // FETCH DATA: 
        // 1. Stats (Attendance/Salary)
        // 2. Attendance Logs (For fallback % calculation)
        // 3. Leave Balances (The same call used in Leave Management portal)
        const [statsRes, attendanceRes, balanceRes] = await Promise.all([
          getDashboardStats(empId).catch(() => ({ data: {} })),
          getAttendanceByEmployee(empId).catch(() => ({ data: [] })),
          api.get(`/leave-balance/employee/${empId}`).catch(() => ({ data: [] }))
        ]);

        const stats = statsRes.data || {};
        const logs = attendanceRes.data || [];
        const balances = Array.isArray(balanceRes.data) ? balanceRes.data : [balanceRes.data];

        // --- 1. Resolve Name ---
        let fullName = session.firstName
          ? `${session.firstName} ${session.lastName}`
          : "Employee";

        if (fullName === "Employee" && logs.length > 0 && logs[0].employee) {
          const emp = logs[0].employee;
          fullName = `${emp.firstName} ${emp.lastName}`;
        }

        // --- 2. Calculate Attendance % (Fallback logic if stats doesn't provide it) ---
        const now = new Date();
        const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentMonthLogs = logs.filter((log) => {
          const d = new Date(log.attendanceDate);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        const uniqueDays = new Set(currentMonthLogs.map((l) => l.attendanceDate)).size;
        const calculatedPercent = totalDaysInMonth > 0 ? ((uniqueDays / totalDaysInMonth) * 100).toFixed(1) : 0;

        // --- 3. Calculate Total Leave Quota (Replicating LeaveManagement logic) ---
        // This sums up all currentBalanceDays from all leave types (Casual, Sick, etc.)
        const totalAvailableQuota = balances.reduce((sum, b) => sum + (b.currentBalanceDays || 0), 0);

        // --- 4. Update State ---
        setEmployeeInfo({
          name: fullName,
          attendance: stats.attendance || `${calculatedPercent}%`,
          leaveBalance: `${totalAvailableQuota} Days`, 
          lastSalary: stats.netSalary || `Rs. ${stats.lastSalary || 0}`,
          tax: `Rs. ${stats.taxableAmount || 0}`,
          totalAllowances: `Rs. ${stats.totalAllowances || 0}`,
        });

      } catch (err) {
        console.error("Dashboard Load Failed", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-content-wrapper">
        <div className="loading-text">Loading Dashboard Data...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-content-wrapper">
      <header className="dashboard-welcome-header">
        <h1>Welcome Back, {employeeInfo.name}! 👋</h1>
        <p>Your current workspace status at a glance.</p>
      </header>

      <div className="stats-row">
        <StatCard
          label="Attendance (Monthly)"
          value={employeeInfo.attendance}
          icon="🕒"
          color="#4f46e5"
        />
        <StatCard
          label="Total Available Quota"
          value={employeeInfo.leaveBalance}
          icon="📝"
          color="#0891b2"
        />
        <StatCard
          label="Net Salary"
          value={employeeInfo.lastSalary}
          icon="💰"
          color="#059669"
        />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="status-kpi-card">
    <div
      className="kpi-icon-container"
      style={{
        color: color,
        backgroundColor: `${color}15`,
      }}
    >
      {icon}
    </div>
    <div className="kpi-data">
      <span className="kpi-label">{label}</span>
      <h2 className="kpi-value">{value}</h2>
    </div>
  </div>
);

export default EmployeeDashboard;