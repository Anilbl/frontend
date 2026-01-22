import React, { useState, useEffect } from "react";
import axios from "axios";
import "./EmployeeDashboard.css";

// --- REMOVED THE DUPLICATE IMPORTS THAT WERE HERE ---

const EmployeeDashboard = () => {
  const [employeeInfo, setEmployeeInfo] = useState({
    name: "Employee",
    role: "Staff Member",
    attendance: "0%",
    leaveBalance: "0 Days",
    lastSalary: "Rs. 0"
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const sessionData = localStorage.getItem("user_session");
        if (!sessionData) return;

        const session = JSON.parse(sessionData);
        const id = session.userId;
        const token = session.token;

        if (!id) {
          console.error("CRITICAL: userId missing from session.");
          return;
        }

        // Endpoint matching the fixed Controller below
        const response = await axios.get(`http://localhost:8080/api/employee/dashboard/stats/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setEmployeeInfo({
          name: session.username || "Employee",
          role: session.role || "Staff Member",
          attendance: response.data.attendanceRate || "0%",
          leaveBalance: `${response.data.remainingLeaves} Days`,
          lastSalary: `Rs. ${response.data.lastSalary}`
        });
      } catch (error) {
        console.error("Dashboard fetch failed:", error);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = [
    { label: "Attendance", value: employeeInfo.attendance, icon: "🕒", color: "#4f46e5" },
    { label: "Leave Balance", value: employeeInfo.leaveBalance, icon: "📝", color: "#0891b2" },
    { label: "Net Salary", value: employeeInfo.lastSalary, icon: "💰", color: "#059669" },
  ];

  return (
    <div className="dashboard-content-wrapper">
      <header className="dashboard-welcome-header">
        <div className="greeting-box">
          <h1>Welcome Back, {employeeInfo.name}! 👋</h1>
          <p>Here is your real-time performance and payroll summary.</p>
        </div>
      </header>

      <div className="stats-row">
        {stats.map((stat, index) => (
          <div key={index} className="status-kpi-card">
            <div className="kpi-icon-container" style={{ color: stat.color, backgroundColor: `${stat.color}15` }}>
              {stat.icon}
            </div>
            <div className="kpi-data">
              <span className="kpi-label">{stat.label}</span>
              <h2 className="kpi-value">{stat.value}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EmployeeDashboard;