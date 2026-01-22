import React, { useState, useEffect } from "react";
import api from "../../api/axios"; 
import "./Leave.css";

const LeaveAdmin = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({}); 
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/employee-leaves");
      const leaves = Array.isArray(res.data) ? res.data : [];
      setLeaveRequests(leaves);

      const uniqueEmpIds = [...new Set(leaves.map(l => l.employee?.empId).filter(id => id))];
      fetchAttendanceStats(uniqueEmpIds);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async (empIds) => {
    const statsMap = {};
    await Promise.all(empIds.map(async (id) => {
      try {
        const res = await api.get(`/attendance/employee/${id}`);
        const workingDays = res.data.filter(a => a.status === "PRESENT").length;
        statsMap[id] = workingDays;
      } catch (e) {
        statsMap[id] = 0;
      }
    }));
    setAttendanceStats(statsMap);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleLeaveAction = async (leaveId, action) => {
    const sessionData = localStorage.getItem("user_session");
    const userSession = sessionData ? JSON.parse(sessionData) : null;
    
    // Attempting to find the admin ID in your session object
    const adminId = userSession?.empId || userSession?.id || userSession?.user?.id;

    if (!adminId) {
      alert("Session Error: Please sign out and sign in again.");
      return;
    }

    try {
      // We use the exact URL structure from your successful logs
      // but let the backend handle the year logic internally to avoid SQL errors
      await api.patch(`/employee-leaves/${leaveId}/status`, null, {
        params: { 
          status: action, 
          adminId: adminId 
        }
      });
      
      alert(`Leave ${action} successfully.`);
      fetchLeaves();
    } catch (err) {
      // This will now catch that JDBC/SQL error and display it clearly
      const errMsg = err.response?.data?.message || err.response?.data || "Server SQL Error";
      console.error("Update failed:", err.response);
      alert("Backend Error: " + errMsg);
    }
  };

  if (loading) return <div className="leave-container">Loading records...</div>;

  return (
    <div className="leave-container">
      <h2 className="leave-header">Admin: Leave & Performance Overview</h2>
      <table className="leave-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Leave Type</th>
            <th>Total Working Days</th>
            <th>Leave Days (This Req)</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {leaveRequests.map((leave) => (
            <tr key={leave.leaveId}>
              <td>
                <strong>{leave.employee?.firstName} {leave.employee?.lastName}</strong>
                <div style={{fontSize: '11px', color: '#666'}}>ID: {leave.employee?.empId}</div>
              </td>
              <td>{leave.leaveType?.typeName}</td>
              <td className="stat-cell">{attendanceStats[leave.employee?.empId] || 0} Days</td>
              <td className="stat-cell">{leave.totalDays || 0} Days</td>
              <td>
                <span className={`status-badge ${leave.status?.toLowerCase()}`}>
                  {leave.status}
                </span>
              </td>
              <td>
                {leave.status === "Pending" ? (
                  <div className="btn-group">
                    <button className="btn-approve" onClick={() => handleLeaveAction(leave.leaveId, "Approved")}>Approve</button>
                    <button className="btn-reject" onClick={() => handleLeaveAction(leave.leaveId, "Rejected")}>Reject</button>
                  </div>
                ) : (
                  <span className="action-done">Processed</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveAdmin;