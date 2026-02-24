import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalWorkforce: 0,
    dailyAttendance: "0%",
    leaveRequests: "00",
    activeNow: 0
  });
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FILTERS STATE (Defaults to Current Date) ---
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate().toString().padStart(2, '0'));
  const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Helper arrays for date selection
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = ["2024", "2025", "2026", "2027"];

  const formatTime = (timeString) => {
    if (!timeString) return "---";
    try {
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

        // 1. Fetch Stats (Passing Date Params to make Cards Dynamic)
        const statsRes = await axios.get('http://localhost:8080/api/dashboard/admin/stats', { 
          headers,
          params: {
            day: selectedDay,
            month: selectedMonth,
            year: selectedYear
          }
        });
        
        // 2. Fetch Attendance Records with filters
        const attendanceRes = await axios.get('http://localhost:8080/api/dashboard/recent-attendance', { 
          headers,
          params: {
            day: selectedDay,
            month: selectedMonth,
            year: selectedYear,
            search: searchTerm
          }
        });

        if (statsRes.data) {
          setStats({
            // These values now come from the backend filtered by the selected date
            totalWorkforce: statsRes.data.totalWorkforce || 0,
            dailyAttendance: statsRes.data.dailyAttendance || "0%",
            leaveRequests: (statsRes.data.leaveRequests || 0).toString().padStart(2, '0'),
            activeNow: Array.isArray(attendanceRes.data) ? attendanceRes.data.length : 0
          });
        }

        if (Array.isArray(attendanceRes.data)) {
          const sortedData = attendanceRes.data.sort((a, b) => {
             const timeA = new Date(a.checkInTime).getTime() || 0;
             const timeB = new Date(b.checkInTime).getTime() || 0;
             return timeB - timeA;
          });
          setRecentAttendance(sortedData);
        }

      } catch (error) {
        console.error("Dashboard failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedDay, selectedMonth, selectedYear, searchTerm]); 

  // Pagination Logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = recentAttendance.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(recentAttendance.length / recordsPerPage);

  const adminStats = [
    { title: "TOTAL WORKFORCE", value: stats.totalWorkforce, icon: "👥", color: "#4f46e5" },
    { title: "DAILY ATTENDANCE", value: stats.dailyAttendance, icon: "📅", color: "#10b981" },
    { title: "LEAVE REQUESTS", value: stats.leaveRequests, icon: "📝", color: "#f59e0b" },
    { title: "ACTIVE (DATE)", value: stats.activeNow, icon: "⚡", color: "#ef4444" }
  ];

  if (loading) return <div className="loader">Loading Dashboard Data...</div>;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard Overview</h1>
          <p>Real-time summary of the Payroll Management System</p>
        </div>

        {/* Top Cards - Now update based on selectedDay/Month/Year */}
        <div className="top-stats-grid">
          {adminStats.map((stat, index) => (
            <div key={index} className="horizontal-stat-card" style={{ borderLeft: `5px solid ${stat.color}` }}>
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
          <div className="section-header-flex">
            <h3 className="section-divider-title">Attendance History</h3>
            
            <div className="filter-controls-row">
              <input 
                type="text" 
                placeholder="Search Emp ID/Name..." 
                className="small-search-input"
                value={searchTerm}
                onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              />
              <div className="date-selectors">
                <select value={selectedDay} onChange={(e) => {setSelectedDay(e.target.value); setCurrentPage(1);}} className="mini-select">
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={selectedMonth} onChange={(e) => {setSelectedMonth(e.target.value); setCurrentPage(1);}} className="mini-select">
                  {months.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={selectedYear} onChange={(e) => {setSelectedYear(e.target.value); setCurrentPage(1);}} className="mini-select">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

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
                {currentRecords.length > 0 ? (
                  currentRecords
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
                                  className="map-link-btn"
                              >
                                  📍 View Map
                              </a>
                          ) : (
                              <span className="no-location-text">{record.workLocation || "No Location"}</span>
                          )}
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">No records found for the selected date.</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pagination-footer">
               <div className="pagination-info">
                  Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, recentAttendance.length)} of {recentAttendance.length} records
               </div>
               <div className="pagination-controls">
                  <button 
                    className="pager-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="page-number">Page {currentPage} of {totalPages || 1}</span>
                  <button 
                    className="pager-btn"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    Next
                  </button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;