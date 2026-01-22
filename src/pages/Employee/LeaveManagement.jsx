import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios"; 
import "./LeaveManagement.css";

const LeaveManagement = () => {
  // 1. DATA FIX: Prioritize empId from session to avoid "ID 35" identity mismatch
  const userSession = JSON.parse(localStorage.getItem("user_session") || "{}");
  const currentEmpId = userSession.empId || userSession.user?.employee?.empId || userSession.userId; 

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState(""); 
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const today = new Date().toISOString().split("T")[0];

  // 2. DATA FETCHING: Load real values from your SQL database
  const loadLeaveData = useCallback(async () => {
    if (!currentEmpId) return;
    try {
      setLoading(true);
      setErrorMsg("");

      const [typesRes, balRes, histRes] = await Promise.all([
        api.get("/leave-types"),
        api.get(`/leave-balance/employee/${currentEmpId}`), // Fetches real SQL balance
        api.get("/employee-leaves")
      ]);
      
      setLeaveTypes(typesRes.data || []);
      // Ensure balances is an array even if database is empty for new employee
      setBalances(Array.isArray(balRes.data) ? balRes.data : [balRes.data]);
      
      // Filter history strictly for this employee ID (e.g., 7 or 13)
      const myHistory = histRes.data.filter(item => 
        (item.employee?.empId === currentEmpId) || (item.empId === currentEmpId)
      );
      setLeaveHistory(myHistory);
    } catch (err) {
      console.error("Fetch Error:", err);
      setErrorMsg("Failed to sync leave data. Using cached or empty records.");
    } finally {
      setLoading(false);
    }
  }, [currentEmpId]);

  useEffect(() => {
    loadLeaveData();
  }, [loadLeaveData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");
    
    const payload = {
      employee: { empId: currentEmpId },
      leaveType: { leaveTypeId: parseInt(formData.leaveTypeId) },
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: "Pending"
    };

    try {
      await api.post("/employee-leaves", payload);
      setSuccessMsg("Application Sent Successfully!");
      setFormData({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
      
      // AUTO-REFRESH: Updates UI with latest database state immediately
      loadLeaveData(); 
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Submission error:", err);
      const msg = err.response?.data?.message || "Check your network connection.";
      setErrorMsg(`Failed: ${msg}`);
    }
  };

  if (loading) return <div className="loading-state">Syncing Quota with Server...</div>;

  return (
    <div className="leave-module-wrapper">
      <div className="module-header-center">
        <h1>Employee Leave Portal</h1>
        <p>Manage requests for <strong>{userSession.username || "Employee"}</strong></p>
      </div>

      {successMsg && <div className="success-toast-message">{successMsg}</div>}
      {errorMsg && <div className="error-toast-message">{errorMsg}</div>}

      <div className="leave-top-layout">
        {/* 3. DYNAMIC QUOTA: No longer hardcoded to 25. Shows actual SQL data */}
        <div className="balance-box-compact">
          <span className="box-label">Available Quota</span>
          <div className="days-display">
            {/* Sums up currentBalanceDays from all leave categories for this specific employee */}
            {balances.length > 0 ? balances.reduce((sum, b) => sum + (b.currentBalanceDays || 0), 0) : "0"}
            <span className="days-unit">Days</span>
          </div>
          <div className="approved-footer">
            Approved this Year: <strong>{leaveHistory.filter(l => l.status === 'Approved').reduce((s, l) => s + (l.totalDays || 0), 0)}</strong>
          </div>
        </div>

        <div className="apply-box-large">
          <h2 className="apply-title">Apply for New Leave</h2>
          <form onSubmit={handleSubmit} className="leave-form-grid">
            <div className="form-field">
              <select 
                value={formData.leaveTypeId} 
                onChange={(e) => setFormData({...formData, leaveTypeId: e.target.value})}
                required
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map(t => <option key={t.leaveTypeId} value={t.leaveTypeId}>{t.typeName}</option>)}
              </select>
            </div>

            <div className="form-field-row">
              <div className="date-group">
                <label>From Date</label>
                <input type="date" value={formData.startDate} min={today} onChange={(e)=>setFormData({...formData, startDate: e.target.value})} required />
              </div>
              <div className="date-group">
                <label>To Date</label>
                <input type="date" value={formData.endDate} min={formData.startDate || today} onChange={(e)=>setFormData({...formData, endDate: e.target.value})} required />
              </div>
            </div>

            <div className="form-field">
              <textarea placeholder="Reason for leave request..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} required />
            </div>

            <div className="submit-action-center">
              <button type="submit" className="btn-apply-gradient">Submit Application</button>
            </div>
          </form>
        </div>
      </div>

      <div className="leave-history-container">
        <h2 className="history-section-title">Your Leave History</h2>
        <div className="table-wrapper-scroll">
          <table className="leave-data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Dates</th>
                <th>Days</th>
                <th>Status</th>
                <th>Approved By</th>
              </tr>
            </thead>
            <tbody>
              {leaveHistory.length > 0 ? (
                leaveHistory.map((item) => (
                  <tr key={item.leaveId}>
                    <td>#LV-{item.leaveId}</td>
                    <td>{item.leaveType?.typeName}</td>
                    <td>{item.startDate} to {item.endDate}</td>
                    <td className="bold-days">{item.totalDays}</td>
                    <td><span className={`status-pill ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                    <td>{item.approvedBy?.username || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{textAlign: 'center'}}>No personal history records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;