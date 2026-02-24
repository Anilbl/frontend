import React, { useState, useEffect } from "react";
import { getDashboardStats } from "../../api/employeeApi"; 
import { getAttendanceByEmployee } from "../../api/attendanceApi";
import "./EmployeeDashboard.css";
import { First } from "react-bootstrap/esm/PageItem";

const EmployeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState({
    name: "name",
    attendance: "0%",
    leaveBalance: "0 Days",
    lastSalary: "Rs. 0",
    tax: "Rs. 0",
    totalAllowances: "Rs. 0"
  });
  
useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);

      const session = JSON.parse(localStorage.getItem("user_session") || "{}");
      const empId = session.empId;
      if (!empId) return;

      const [statsRes, attendanceRes] = await Promise.all([
        getDashboardStats(empId).catch(() => ({ data: {} })),
        getAttendanceByEmployee(empId).catch(() => ({ data: [] }))
      ]);

      const logs = attendanceRes.data || [];

      // ✅ Extract employee name from first attendance record
      let fullName = "Employee";
      if (logs.length > 0 && logs[0].employee) {
        const emp = logs[0].employee;
        fullName = `${emp.firstName} ${emp.lastName}`;
      }

      // Monthly Attendance %
      const now = new Date();
      const totalDays = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

      const currentMonthLogs = logs.filter(log => {
        const d = new Date(log.attendanceDate);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });

      const uniqueDays = new Set(
        currentMonthLogs.map(l => l.attendanceDate)
      ).size;

      const percent =
        totalDays > 0
          ? ((uniqueDays / totalDays) * 100).toFixed(1)
          : 0;

      const stats = statsRes.data || {};

      setEmployeeInfo({
  name: fullName,
  attendance: stats.attendance || "0%",
  leaveBalance: stats.leaveBalance || "0 Days",
  lastSalary: stats.netSalary || "Rs. 0",
  tax: stats.taxableAmount || "Rs. 0",
  totalAllowances: stats.totalAllowances || "Rs. 0"
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
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="dashboard-content-wrapper">
      <header className="dashboard-welcome-header">
        <h1>Welcome Back, {employeeInfo.name}! 👋</h1>
        <p>Here is what's happening with your profile today.</p>
      </header>

      <div className="stats-row">
        <StatCard 
          label="Attendance (Monthly)" 
          value={employeeInfo.attendance} 
          icon="🕒" 
          color="#4f46e5" 
        />
        <StatCard 
          label="Leave Balance" 
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
        backgroundColor: `${color}15` // 15% opacity
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