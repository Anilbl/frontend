import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/axios"; 
import "./LeaveManagement.css";

const LeaveManagement = () => {
  const userSession = JSON.parse(localStorage.getItem("user_session") || "{}");
  const currentEmpId = userSession.empId; 

  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [employeeGender, setEmployeeGender] = useState(""); // NEW: State for gender logic
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
      // Fetched Employee details to get Gender, Leave Types, Balances, and History
      const [empRes, typesRes, balRes, histRes] = await Promise.all([
        api.get(`/employees/${currentEmpId}`),
        api.get("/leave-types"),
        api.get(`/leave-balance/employee/${currentEmpId}`),
        api.get("/employee-leaves")
      ]);
      
      setEmployeeGender(empRes.data?.gender || "OTHER"); // Default to OTHER to show all if not found
      setLeaveTypes(typesRes.data || []);
      setBalances(Array.isArray(balRes.data) ? balRes.data : [balRes.data]);
      
      const myHistory = histRes.data.filter(item => item.employee?.empId === currentEmpId);
      setLeaveHistory(myHistory);
    } catch (err) {
      setErrorMsg("Failed to sync data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentEmpId]);

  useEffect(() => { loadLeaveData(); }, [loadLeaveData]);

  // --- GENDER FILTERING LOGIC ---
  const filteredLeaveTypes = leaveTypes.filter(type => {
    const typeName = type.typeName.toLowerCase();
    if (employeeGender === "MALE") {
      return !typeName.includes("maternity");
    }
    if (employeeGender === "FEMALE") {
      return !typeName.includes("paternity");
    }
    return true; // OTHER shows everything
  });

  // --- HELPER CALCULATIONS ---
  const getDisplayQuota = () => {
    if (!formData.leaveTypeId) {
      return balances.reduce((sum, b) => sum + (b.currentBalanceDays || 0), 0);
    }
    const specificBal = balances.find(b => b.leaveType?.leaveTypeId === parseInt(formData.leaveTypeId));
    return specificBal ? specificBal.currentBalanceDays : 0;
  };

  const calculateRequestedDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = end - start;
    if (diffTime < 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const requestedDays = calculateRequestedDays();
  const availableQuota = getDisplayQuota();
  const isOverQuota = formData.leaveTypeId && requestedDays > availableQuota;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOverQuota) return;

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
        <p>Manage requests for <strong>{userSession.username}</strong> ({employeeGender})</p>
      </div>

      {successMsg && <div className="success-toast-message">{successMsg}</div>}
      {errorMsg && <div className="error-toast-message">{errorMsg}</div>}
      
      {isOverQuota && (
        <div className="error-toast-message" style={{marginBottom: '15px', position: 'static'}}>
           ⚠️ You do not have enough available quota for this leave type. (Requested: {requestedDays}, Available: {availableQuota})
        </div>
      )}

      <div className="leave-top-layout">
        <div className={`balance-box-compact ${isOverQuota ? 'quota-error' : ''}`}>
          <span className="box-label">
            {formData.leaveTypeId ? "Selected Type Quota" : "Total Available Quota"}
          </span>
          <div className="days-display">
            {availableQuota}
            <span className="days-unit">Days</span>
          </div>
          <div className="approved-footer">
            Approved this Year: <strong>{leaveHistory.filter(l => l.status === 'Approved').reduce((s, l) => s + (l.totalDays || 0), 0)}</strong>
          </div>
        </div>

        <div className="apply-box-large">
          <h2 className="apply-title">Apply for New Leave</h2>
          <form onSubmit={handleSubmit} className="leave-form-grid">
            {/* Filtered Dropdown based on Gender */}
            <select 
                value={formData.leaveTypeId} 
                onChange={(e) => setFormData({...formData, leaveTypeId: e.target.value})} 
                required
            >
              <option value="">Select Leave Type</option>
              {filteredLeaveTypes.map(t => (
                <option key={t.leaveTypeId} value={t.leaveTypeId}>{t.typeName}</option>
              ))}
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
              <button 
                type="submit" 
                className="btn-apply-gradient" 
                disabled={isOverQuota || !formData.leaveTypeId}
                style={isOverQuota ? {background: '#ccc', cursor: 'not-allowed'} : {}}
              >
                {isOverQuota ? "Insufficient Balance" : "Submit Application"}
              </button>
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