import React, { useState, useEffect } from "react";
import api from "../../api/axios"; 
import leaveApi from "../../api/leaveApi"; 
import "./Leave.css";

const LeaveAdmin = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState((today.getMonth() + 1).toString().padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(today.getFullYear().toString());
  const [selectedStatus, setSelectedStatus] = useState("Pending");
  const [searchTerm, setSearchTerm] = useState("");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = ["2024", "2025", "2026", "2027"];

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await api.get("/employee-leaves/filter", {
        params: {
          month: selectedMonth,
          year: selectedYear,
          status: selectedStatus,
          search: searchTerm
        }
      });
      
      const leaves = Array.isArray(res.data) ? res.data : [];
      // Ensuring newest requests stay at the top
      const sortedLeaves = leaves.sort((a, b) => b.leaveId - a.leaveId);
      setLeaveRequests(sortedLeaves);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
    setCurrentPage(1); 
  }, [selectedMonth, selectedYear, selectedStatus, searchTerm]);

  const handleLeaveAction = (leaveId, action) => {
    if (action === "Rejected") {
      setSelectedLeaveId(leaveId);
      setShowRejectModal(true);
    } else {
      if(window.confirm("Are you sure you want to approve this leave request?")) {
        submitStatusUpdate(leaveId, "Approved", "");
      }
    }
  };

  const submitStatusUpdate = async (leaveId, action, reason) => {
    const sessionData = localStorage.getItem("user_session");
    const userSession = sessionData ? JSON.parse(sessionData) : null;
    const adminId = userSession?.empId;

    if (!adminId) {
        alert("Session error: Admin ID not found. Please log in again.");
        return;
    }

    try {
        const payload = {
            status: action,
            adminId: adminId,
            rejectionReason: reason
        };

        await leaveApi.updateLeaveStatus(leaveId, payload);
        setShowRejectModal(false);
        setRejectionReason("");
        fetchLeaves(); 
    } catch (err) {
        alert("Failed to update: " + (err.response?.data?.message || "Internal error"));
    }
  };

  // Pagination Logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = leaveRequests.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(leaveRequests.length / recordsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  // Helper to format date strings nicely
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="leave-container">
      <div className="leave-header-section">
        <h2 className="leave-header">Leave Management</h2>
        
        <div className="leave-filter-bar">
          <input 
            type="text" 
            placeholder="Search Name or ID..." 
            className="filter-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-select">
            <option value="Pending">Pending Approvals</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="All">All Requests</option>
          </select>

          <div className="date-group">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="filter-select-mini">
              {months.map(m => (
                <option key={m} value={m}>
                  {new Date(0, m-1).toLocaleString('default', {month: 'short'})}
                </option>
              ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="filter-select-mini">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="record-summary-line">
        Showing <strong>{selectedStatus}</strong> requests for <strong>{new Date(0, selectedMonth-1).toLocaleString('default', {month: 'long'})} {selectedYear}</strong> — Total: {leaveRequests.length}
      </div>

      <div className="leave-table-wrapper">
        {loading ? (
          <div className="table-loader">Fetching latest records...</div>
        ) : (
          <table className="leave-table">
            <thead>
              <tr>
                <th style={{width: '20%'}}>Employee</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th style={{textAlign: 'right'}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length > 0 ? (
                currentRecords.map((leave) => (
                  <tr key={leave.leaveId}>
                    <td>
                      <div className="emp-info">
                        <strong>{leave.employee?.firstName} {leave.employee?.lastName}</strong>
                        <span className="emp-id-sub">EMP ID: {leave.employee?.empId}</span>
                      </div>
                    </td>
                    <td>{leave.leaveType?.typeName}</td>
                    <td><span className="date-text">{formatDate(leave.startDate)}</span></td>
                    <td><span className="date-text">{formatDate(leave.endDate)}</span></td>
                    <td className="stat-cell">{leave.totalDays}</td>
                    <td>
                      <div className="status-cell-wrapper">
                        <span className={`status-badge ${leave.status?.toLowerCase()}`}>
                          {leave.status}
                        </span>
                        {leave.status === "Rejected" && leave.rejectionReason && (
                          <div className="rejection-reason-text">
                            <strong>Reason:</strong> {leave.rejectionReason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{textAlign: 'right'}}>
                      {/* FIXED: Comparing status to show buttons only when Pending */}
                      {String(leave.status).toLowerCase() === "pending" ? (
                        <div className="btn-group">
                          <button className="btn-approve" onClick={() => handleLeaveAction(leave.leaveId, "Approved")}>Approve</button>
                          <button className="btn-reject" onClick={() => handleLeaveAction(leave.leaveId, "Rejected")}>Reject</button>
                        </div>
                      ) : (
                        <span className="action-done">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '3rem', color: '#94a3b8'}}>
                    No leave requests found for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="rejection-modal">
            <h3>Reject Leave Request</h3>
            <textarea 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for the rejection (Required)..."
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button 
                className="btn-confirm-reject" 
                onClick={() => submitStatusUpdate(selectedLeaveId, "Rejected", rejectionReason)}
                disabled={!rejectionReason.trim()}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination-container">
          <div style={{fontSize: '0.85rem', color: '#64748b'}}>Page {currentPage} of {totalPages}</div>
          <div className="pagination-buttons">
            <button className="pg-btn" disabled={currentPage === 1} onClick={() => paginate(currentPage - 1)}>Prev</button>
            {[...Array(totalPages)].map((_, index) => (
              <button key={index + 1} className={`pg-num ${currentPage === index + 1 ? 'active' : ''}`} onClick={() => paginate(index + 1)}>{index + 1}</button>
            ))}
            <button className="pg-btn" disabled={currentPage === totalPages} onClick={() => paginate(currentPage + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveAdmin;