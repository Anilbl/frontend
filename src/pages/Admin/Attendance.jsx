import { useEffect, useState } from "react";
import api from "../../api/axios";
import "../Admin/Attendance.css";

export default function AdminAttendance() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch employees on mount
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

  // Fetch attendance when selected employee changes
  useEffect(() => {
    const fetchAttendance = async (empId) => {
      setLoading(true);
      try {
        const res = await api.get(`/attendance/employee/${empId}`);
        setAttendance(res.data);
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

  // Attendance summary
 
  const summary = attendance.reduce((acc, { status }) => {
  if (status) {
    acc[status] = (acc[status] || 0) + 1; // increment count for the status
  }
  return acc;
}, {});





  return (
    <div className="attendance-container">
      <h1>Admin - Employee Attendance</h1>

      <div className="filter-bar">
        <label>
          Select Employee:{" "}
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
        </label>
      </div>

      {loading && <p>Loading attendance...</p>}

      {!loading && selectedEmp && attendance.length === 0 && (
        <p>No attendance records found.</p>
      )}

      {!loading && attendance.length > 0 && (
        <>
                <div className="attendance-summary">
  <h3>Summary:</h3>
  {Object.keys(summary).length === 0 ? (
    <p>No attendance data</p>
  ) : (
    Object.entries(summary).map(([status, count]) => (
      <p key={status}>
        {status}: {count}
      </p>
    ))
  )}
</div>
          <h2>Attendance History</h2>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>GPS</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a) => (
                <tr key={a.attendanceId}>
                  <td>{new Date(a.attendanceDate).toLocaleDateString()}</td>
                  <td>{a.status || "-"}</td>
                  <td>{a.checkInTime ? a.checkInTime.slice(11, 16) : "-"}</td>
                  <td>{a.checkOutTime ? a.checkOutTime.slice(11, 16) : "-"}</td>
                  <td>
                    {a.inGpsLat && a.inGpsLong
                      ? `${a.inGpsLat}, ${a.inGpsLong}`
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

  

        </>
      )}
    </div>
  );
}
