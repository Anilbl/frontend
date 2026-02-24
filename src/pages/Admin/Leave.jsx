import React, { useState, useEffect } from "react";
import api from "../../api/axios"; 
import leaveApi from "../../api/leaveApi"; 
import "./Leave.css";

const LeaveAdmin = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({}); 
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
      const sortedLeaves = leaves.sort((a, b) => b.leaveId - a.leaveId);
      setLeaveRequests(sortedLeaves);

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
    setCurrentPage(1); 
  }, [selectedMonth, selectedYear, selectedStatus, searchTerm]);

  const handleLeaveAction = (leaveId, action) => {
    if (action === "Rejected") {
      setSelectedLeaveId(leaveId);
      setShowRejectModal(true);
    } else {
      submitStatusUpdate(leaveId, "Approved", "");
    }
  };

  const submitStatusUpdate = async (leaveId, action, reason) => {
    const sessionData = localStorage.getItem("user_session");
    const userSession = sessionData ? JSON.parse(sessionData) : null;
    const adminId = userSession?.empId;

    if (!adminId) {
        alert("Session error: ID not found.");
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
        alert("Failed: " + (err.response?.data?.message || "Error"));
    }
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = leaveRequests.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(leaveRequests.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="leave-container">
      <div className="leave-header-section">
        <h2 className="leave-header">Leave Management</h2>
        
        <div className="leave-filter-bar">
          {/* SEARCH BAR COMES FIRST AND GROWS */}
          <input 
            type="text" 
            placeholder="Search Name or ID..." 
            className="filter-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {/* STATUS IS SMALL */}
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-select">
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="All">All</option>
          </select>

          {/* DATES ARE SMALL */}
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
        Showing <strong>{selectedStatus}</strong> requests for <strong>{new Date(0, selectedMonth-1).toLocaleString('default', {month: 'long'})} {selectedYear}</strong> — {leaveRequests.length} records
      </div>

      <div className="leave-table-wrapper">
        {loading ? (
          <div className="table-loader">Fetching latest records...</div>
        ) : (
          <table className="leave-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Working Days</th>
                <th>Leave Days</th>
                <th>Status</th>
                <th>Action</th>
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
                    <td className="stat-cell">{attendanceStats[leave.employee?.empId] || 0}</td>
                    <td className="stat-cell">{leave.totalDays || 0}</td>
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
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '3rem', color: '#94a3b8'}}>
                    No records found.
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
            <h3>Reject Request</h3>
            <textarea 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason..."
              required
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>Cancel</button>
              <button 
                className="btn-confirm-reject" 
                onClick={() => submitStatusUpdate(selectedLeaveId, "Rejected", rejectionReason)}
                disabled={!rejectionReason.trim()}
              >Confirm</button>
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