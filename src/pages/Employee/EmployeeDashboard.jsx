import React, { useState, useEffect } from "react";
import { getDashboardStats } from "../../api/employeeApi"; 
import { getAttendanceByEmployee } from "../../api/attendanceApi";
import "./EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [employeeInfo, setEmployeeInfo] = useState({
    name: "Employee",
    attendance: "0%",
    leaveBalance: "0 Days",
    lastSalary: "Rs. 0"
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const session = JSON.parse(localStorage.getItem("user_session") || "{}");
        const id = session.empId || session.userId;

        if (!id) return setLoading(false);

        const [statsRes, attendanceRes] = await Promise.all([
          getDashboardStats(id).catch(() => ({ data: {} })),
          getAttendanceByEmployee(id).catch(() => ({ data: [] }))
        ]);

        const now = new Date();
        const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const logs = attendanceRes.data || [];
        const currentMonthLogs = logs.filter(log => {
            const d = new Date(log.attendanceDate);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        const uniqueDays = new Set(currentMonthLogs.map(l => l.attendanceDate)).size;
        const percent = totalDays > 0 ? ((uniqueDays / totalDays) * 100).toFixed(1) : 0;

        setEmployeeInfo({
          name: session.firstName ? `${session.firstName} ${session.lastName}` : "Employee",
          attendance: `${percent}%`,
          leaveBalance: `${statsRes.data?.remainingLeaves || 0} Days`,
          lastSalary: `Rs. ${statsRes.data?.lastSalary || 0}`
        });
      } catch (err) {
        console.error("Dashboard Load Failed", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <div className="loading-text">Loading Dashboard...</div>;

  return (
    <div className="dashboard-content-wrapper">
      <h1>Welcome Back, {employeeInfo.name}! 👋</h1>
      
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
    <div className="kpi-icon-container" style={{ color, backgroundColor: `${color}15` }}>
      {icon}
    </div>
    <div className="kpi-data">
      <span className="kpi-label">{label}</span>
      <h2 className="kpi-value">{value}</h2>
    </div>
  </div>
);

export default EmployeeDashboard;