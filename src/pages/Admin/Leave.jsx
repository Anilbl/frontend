import React, { useState, useEffect } from "react";
import api from "../../api/axios"; 
import "./Leave.css";

const LeaveAdmin = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaves = async () => {
    try {
      const res = await api.get("/employee-leaves");
      setLeaveRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

 const handleLeaveAction = async (leaveId, action) => {
  // 1. Get session from storage
  const sessionData = localStorage.getItem("user_session");
  const userSession = sessionData ? JSON.parse(sessionData) : null;
  
  // 2. Flexible ID lookup (checks different possible paths in your object)
  const adminId = userSession?.userId || userSession?.user?.userId || userSession?.id;

  if (!adminId) {
    console.error("Session data found:", userSession);
    alert("Error: Admin ID not found in session. Please sign out and sign in again.");
    return;
  }

  try {
    // 3. Send the request
    const response = await api.patch(`/employee-leaves/${leaveId}/status`, null, {
      params: { 
        status: action, 
        adminId: adminId 
      }
    });
    
    alert(`Leave ${action} successfully.`);
    fetchLeaves(); // Refresh the table list
  } catch (err) {
    console.error("Server Error:", err.response?.data);
    const errorMsg = err.response?.data?.message || err.response?.data || "Check console for details";
    alert("Failed to update: " + errorMsg);
  }
};

  if (loading) return <div className="leave-container">Loading leave requests...</div>;

  return (
    <div className="leave-container">
      <h2 className="leave-header">Employee Leave Management</h2>
      <table className="leave-table">
        <thead>
          <tr>
            <th>ID</th><th>Employee</th><th>Leave Type</th><th>Dates</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {leaveRequests.length > 0 ? (
            leaveRequests.map((leave) => (
              <tr key={leave.leaveId}>
                <td>#LV-{leave.leaveId}</td>
                <td>{leave.employee?.firstName} {leave.employee?.lastName}</td>
                <td>{leave.leaveType?.typeName}</td>
                <td>{leave.startDate} to {leave.endDate}</td>
                <td>
                  <span className={`status-badge ${(leave.status || "pending").toLowerCase()}`}>
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
                    <span className={`text-final ${leave.status.toLowerCase()}`}>Actioned: {leave.status}</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="6" style={{textAlign: 'center'}}>No leave requests found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveAdmin;