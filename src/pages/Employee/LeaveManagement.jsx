import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios"; 
import "./LeaveManagement.css";

const LeaveManagement = () => {
  const userSession = JSON.parse(localStorage.getItem("user_session") || "{}");
  const currentEmpId = userSession.empId; 

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

  const loadLeaveData = useCallback(async () => {
    if (!currentEmpId) {
        setLoading(false);
        setErrorMsg("Session Error: Please re-login.");
        return;
    }

    try {
      setLoading(true);
      const [typesRes, balRes, histRes] = await Promise.all([
        api.get("/leave-types"),
        api.get(`/leave-balance/employee/${currentEmpId}`),
        api.get("/employee-leaves")
      ]);
      
      setLeaveTypes(typesRes.data || []);
      setBalances(Array.isArray(balRes.data) ? balRes.data : [balRes.data]);
      
      const myHistory = histRes.data.filter(item => item.employee?.empId === currentEmpId);
      setLeaveHistory(myHistory);
    } catch (err) {
      setErrorMsg("Failed to sync data.");
    } finally {
      setLoading(false);
    }
  }, [currentEmpId]);

  useEffect(() => { loadLeaveData(); }, [loadLeaveData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      loadLeaveData(); 
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      setErrorMsg("Submission failed.");
    }
  };

  if (loading) return <div className="loading-state">Syncing Quota...</div>;

  return (
    <div className="leave-module-wrapper">
      <div className="module-header-center">
        <h1>Employee Leave Portal</h1>
        <p>Manage requests for <strong>{userSession.username}</strong></p>
      </div>

      {successMsg && <div className="success-toast-message">{successMsg}</div>}
      {errorMsg && <div className="error-toast-message">{errorMsg}</div>}

      <div className="leave-top-layout">
        <div className="balance-box-compact">
          <span className="box-label">Available Quota</span>
          <div className="days-display">
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
            <select value={formData.leaveTypeId} onChange={(e) => setFormData({...formData, leaveTypeId: e.target.value})} required>
              <option value="">Select Leave Type</option>
              {leaveTypes.map(t => <option key={t.leaveTypeId} value={t.leaveTypeId}>{t.typeName}</option>)}
            </select>
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
            <textarea placeholder="Reason for leave request..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} required />
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
                <th>Admin Remarks</th>
              </tr>
            </thead>
            <tbody>
              {leaveHistory.length > 0 ? (
                leaveHistory.map((item) => (
                  <tr key={item.leaveId}>
                    <td>#LV-{item.leaveId}</td>
                    <td>{item.leaveType?.typeName}</td>
                    <td>{item.startDate} to {item.endDate}</td>
                    <td>{item.totalDays}</td>
                    <td><span className={`status-pill ${item.status?.toLowerCase()}`}>{item.status}</span></td>
                    <td>{item.rejectionReason || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" style={{textAlign: 'center'}}>No history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;