import React, { useState, useEffect } from "react";
import "./Leave.css";

const LeaveAdmin = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const TOTAL_ALLOWED = 30;

  const fetchLeaves = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/employee-leaves');
      if (!response.ok) throw new Error(`Connection Error: ${response.status}`);
      const data = await response.json();
      
      const formattedData = data.map(leave => ({
        ...leave,
        emp_name: leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : "Unknown",
        leave_type_name: leave.leaveType ? leave.leaveType.typeName : "Home Leave",
        totalDays: leave.totalDays || 0 
      }));

      setLeaveRequests(formattedData);
      setLoading(false);
    } catch (err) {
      setError("Could not connect to database. Ensure Spring Boot is running.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const getEmployeeUsedLeaves = (employeeName) => {
    return leaveRequests
      .filter(leave => leave.emp_name === employeeName && leave.status === "Approved")
      .reduce((sum, leave) => sum + leave.totalDays, 0);
  };

  const handleLeaveAction = async (leaveId, action) => {
    // Retrieve the admin user from local storage session
    const userSession = JSON.parse(localStorage.getItem("user"));
    const adminId = userSession?.userId || 1; 

    try {
      const response = await fetch(`http://localhost:8080/api/employee-leaves/${leaveId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            status: action,
            adminId: adminId // Sends the ID to populate the 'Approved By' column
        }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      // Refresh table to show updated audit data
      fetchLeaves();
      
    } catch (err) {
      console.error("Action Error:", err);
      alert("Database connection failed. Please try again.");
    }
  };

  if (loading) return <div className="leave-container">Loading system records...</div>;
  if (error) return <div className="leave-container" style={{color: 'red'}}>{error}</div>;

  return (
    <div className="leave-container">
      <h2 className="leave-header">Employee Leave Management (Nepal Standards)</h2>
      <table className="leave-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Leave Type</th>
            <th>Dates</th>
            <th>Requested</th>
            <th>Status</th>
            <th>Total Taken</th>
            <th>Remaining Days</th>
            <th>Approved By</th>
            <th>Approved At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {leaveRequests.map((leave) => {
            const usedLeaves = getEmployeeUsedLeaves(leave.emp_name);
            const remaining = TOTAL_ALLOWED - usedLeaves;

            return (
              <tr key={leave.leaveId}>
                <td>{leave.leaveId}</td>
                <td>{leave.emp_name}</td>
                <td>{leave.leave_type_name}</td>
                <td>{leave.startDate} to {leave.endDate}</td>
                <td>{leave.totalDays} Days</td>
                <td>
                  <span className={`status-badge ${(leave.status || 'pending').toLowerCase()}`}>
                    {leave.status || 'Pending'}
                  </span>
                </td>
                <td>{usedLeaves}</td>
                <td className="remaining-cell" style={{fontWeight: 'bold'}}>{remaining}</td>
                
                {/* Displays the Admin's User ID instead of just a placeholder */}
                <td>{leave.approvedBy ? `User ID: ${leave.approvedBy.userId}` : "—"}</td>
                
                {/* Formats the timestamp for the 'Approved At' column */}
                <td>{leave.approvedAt ? new Date(leave.approvedAt).toLocaleString() : "—"}</td>

                <td>
                  {(!leave.status || leave.status === "Pending") ? (
                    <div className="btn-group">
                      <button className="btn-approve" onClick={() => handleLeaveAction(leave.leaveId, "Approved")}>Approve</button>
                      <button className="btn-reject" onClick={() => handleLeaveAction(leave.leaveId, "Rejected")}>Reject</button>
                    </div>
                  ) : (
                    <span className={`text-final ${leave.status.toLowerCase()}`}>{leave.status}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveAdmin;