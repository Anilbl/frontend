import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalWorkforce: 0,
    dailyAttendance: "0%",
    leaveRequests: "00"
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatTime = (timeString) => {
    if (!timeString) return "---";
    try {
      // Handles both ISO strings and HH:mm:ss formats
      const date = timeString.includes('T') ? new Date(timeString) : new Date(`1970-01-01T${timeString}`);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return timeString;
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const session = JSON.parse(localStorage.getItem("user_session") || "{}");
        const token = session.jwt || session.token;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch Stats
        const statsRes = await axios.get('http://localhost:8080/api/dashboard/admin/stats', { headers });
        if (statsRes.data) {
          setStats({
            totalWorkforce: statsRes.data.totalWorkforce || 0,
            dailyAttendance: statsRes.data.dailyAttendance ? `${statsRes.data.dailyAttendance}` : "0",
            leaveRequests: (statsRes.data.leaveRequests || 0).toString().padStart(2, '0')
          });
        }

        // Fetch Attendance
        const attendanceRes = await axios.get('http://localhost:8080/api/dashboard/recent-attendance', { headers });
        setRecentAttendance(Array.isArray(attendanceRes.data) ? attendanceRes.data : []); 

      } catch (error) {
        console.error("Dashboard failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const adminStats = [
    { title: "TOTAL WORKFORCE", value: stats.totalWorkforce, icon: "👥" },
    { title: "DAILY ATTENDANCE", value: stats.dailyAttendance, icon: "📅" },
    { title: "LEAVE REQUESTS", value: stats.leaveRequests, icon: "📝" }
  ];

  if (loading) return <div className="loader">Loading Dashboard Data...</div>;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Real-time summary of the Payroll Management System</p>
        </div>

        <div className="top-stats-grid">
          {adminStats.map((stat, index) => (
            <div key={index} className="horizontal-stat-card">
              <div className="stat-icon-container">
                <span className="icon-main">{stat.icon}</span>
              </div>
              <div className="stat-text-content">
                <span className="stat-label-top">{stat.title}</span>
                <h2 className="stat-value-large">{stat.value}</h2>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-recent-section">
          <h3 className="section-divider-title">Recent Attendance (Today)</h3>
          <div className="recent-table-container">
            <table className="recent-attendance-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Designation</th>
                  <th>Check-In Time</th>
                  <th>Status</th>
                  <th>Location (GPS)</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.length > 0 ? (
                  recentAttendance
                    .filter(record => record.employee && record.employee.isActive !== false)
                    .map((record, index) => (
                      <tr key={index}>
                        <td>{record.employee.firstName} {record.employee.lastName}</td>
                        <td>{record.employee.position?.designationTitle || "Staff"}</td>
                        <td className="time-cell">{formatTime(record.checkInTime)}</td>
                        <td>
                           <span className={`status-badge ${record.status?.toLowerCase() || 'present'}`}>
                              {record.status || "PRESENT"}
                           </span>
                        </td>
                        <td>
                          {record.inGpsLat && record.inGpsLong ? (
                              <a 
                                  href={`https://www.google.com/maps?q=${record.inGpsLat},${record.inGpsLong}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  style={{ color: '#10b981', fontWeight: 'bold', textDecoration: 'none' }}
                              >
                                  📍 View Map
                              </a>
                          ) : (
                              <span style={{ color: '#999' }}>{record.workLocation || "No Location"}</span>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">No attendance recorded today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;