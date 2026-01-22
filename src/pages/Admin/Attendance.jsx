import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./Attendance.css";

export default function AdminAttendance() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthName = now.toLocaleString('default', { month: 'long' });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get("/employees");
        setEmployees(res.data);
      } catch (err) {
        console.error("Failed to load employees", err);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchAttendance = async (empId) => {
      setLoading(true);
      try {
        const res = await api.get(`/attendance/employee/${empId}`);
        // Ensure we sort so the latest records appear first
        const sortedData = (res.data || []).sort((a, b) => b.attendanceId - a.attendanceId);
        setAttendance(sortedData);
      } catch (err) {
        console.error("Failed to load attendance", err);
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedEmp) fetchAttendance(parseInt(selectedEmp));
    else setAttendance([]);
  }, [selectedEmp]);

  const summary = attendance.reduce((acc, { status }) => {
    if (status) {
      const s = status.toUpperCase();
      acc[s] = (acc[s] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="attendance-container">
      <header className="attendance-header">
        <h1>Employee Attendance Dashboard</h1>
        <p className="subtitle">Managing records for {monthName} {now.getFullYear()}</p>
      </header>

      <div className="filter-section">
        <div className="search-box">
          <label>Select Staff Member</label>
          <select
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
          >
            <option value="">-- Select Employee --</option>
            {employees.map((emp) => (
              <option key={emp.empId} value={emp.empId}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="loader-ring">Processing Records...</div>}

      {!loading && selectedEmp && (
        <>
          <div className="stats-grid">
            <div className="stat-card total">
              <span className="stat-label">Total Days ({monthName})</span>
              <span className="stat-value">{daysInMonth}</span>
            </div>
            <div className="stat-card present">
              <span className="stat-label">Present Days</span>
              <span className="stat-value">{summary["PRESENT"] || 0}</span>
            </div>
            <div className="stat-card leave">
              <span className="stat-label">Leave Taken</span>
              <span className="stat-value">{summary["LEAVE"] || 0}</span>
            </div>
            <div className="stat-card absent">
              <span className="stat-label">Absent Days</span>
              <span className="stat-value">{summary["ABSENT"] || 0}</span>
            </div>
          </div>

          {attendance.length > 0 ? (
            <div className="history-section">
              <h2>Detailed Attendance History</h2>
              <div className="table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Work Location (GPS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((row) => (
                      <tr key={row.attendanceId}>
                        <td>{row.attendanceDate}</td>
                        <td>
                          <span className={`badge badge-${row.status?.toLowerCase()}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>
                          {row.checkInTime 
                            ? new Date(row.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : "--:--"}
                        </td>
                        <td>
                          {row.checkOutTime 
                            ? new Date(row.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                            : "--:--"}
                        </td>
                        <td>
                          {row.inGpsLat && row.inGpsLong ? (
                            <a 
                              href={`https://www.google.com/maps?q=${row.inGpsLat},${row.inGpsLong}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="location-link"
                            >
                              📍 View on Map ({row.inGpsLat.toFixed(2)}, {row.inGpsLong.toFixed(2)})
                            </a>
                          ) : (
                            <span className="no-location-text">{row.workLocation || "No Location"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="empty-state">No attendance logs found for this employee.</div>
          )}
        </>
      )}
    </div>
  );
}