import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees, deleteEmployee } from "../../api/employeeApi";
import ConfirmModal from "../../components/ConfirmModal"; // Ensure path is correct
import "./Employees.css";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  
  // Custom Modal State
  const [showModal, setShowModal] = useState(false);
  const [targetId, setTargetId] = useState(null);

  // Status Message State
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getEmployees();
      const data = res.data || res || [];
      setEmployees(data);
    } catch (err) {
      setStatusMsg({ type: "error", text: "Sync error: Could not reach database." });
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Triggered when user clicks "Delete" in the tray
  const openDeleteModal = (e, id) => {
    e.stopPropagation();
    setTargetId(id);
    setShowModal(true);
  };

  // Triggered when user clicks "Yes" in your Custom Modal
  const confirmDelete = async () => {
    setShowModal(false);
    if (!targetId) return;

    try {
      await deleteEmployee(targetId);
      setStatusMsg({ type: "success", text: "Employee record removed successfully." });
      fetchData();
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed.";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setTargetId(null);
    }
  };

  if (loading) return <div className="loader">Initializing Records...</div>;

  return (
    <div className="app-canvas">
      {/* Custom Confirmation Modal */}
      <ConfirmModal 
        show={showModal}
        message="Are you sure you want to permanently delete this employee record?"
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
      />

      <header className="page-header">
        <h3>Employee Management</h3>
        <button 
          className="primary-btn" 
          onClick={() => navigate("/admin/employees/new")}
        >
          + Register Employee
        </button>
      </header>

      {/* Message Box */}
      {statusMsg.text && (
        <div className={`status-box ${statusMsg.type}`} style={{ marginBottom: "20px" }}>
          <span>{statusMsg.text}</span>
          <button className="close-btn" onClick={() => setStatusMsg({ type: "", text: "" })}>×</button>
        </div>
      )}

      <div className="dashboard-stats">
        <div className="stat-pill">
          <span className="month-label">Total Staff</span>
          <span className="count-label">{employees.length}</span>
        </div>
        <div className="stat-pill">
          <span className="month-label">Active</span>
          <span className="count-label">
            {employees.filter(e => e.isActive).length}
          </span>
        </div>
      </div>

      <div className="data-list-container">
        <div className="list-columns">
          <span>Name</span>
          <span>Email</span>
          <span>Department</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Details</span>
        </div>

        <div className="scrollable-list-area">
          {employees.map((emp) => {
            const currentId = emp.empId || emp.id;

            return (
              <div key={currentId} className="list-row-card">
                <div className="row-visible">
                  <span style={{ fontWeight: "600" }}>{emp.firstName} {emp.lastName}</span>
                  <span>{emp.email}</span>
                  <span>{emp.department?.deptName || "N/A"}</span>
                  <span>
                    <span className={`status-tag ${emp.isActive ? "active" : "inactive"}`}>
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <button className="details-btn" onClick={() => toggleRow(currentId)}>
                      {expandedId === currentId ? "Close" : "View"}
                    </button>
                  </div>
                </div>

                {expandedId === currentId && (
                  <div className="row-hidden-tray">
                    <div className="details-box">
                      <div><strong>Contact:</strong> {emp.contact}</div>
                      <div><strong>Designation:</strong> {emp.position?.designationTitle || "N/A"}</div>
                      <div><strong>Education:</strong> {emp.education}</div>
                      <div><strong>Marital Status:</strong> {emp.maritalStatus}</div>
                      <div style={{ gridColumn: "span 2" }}>
                          <strong>Address:</strong> {emp.address}
                      </div>
                    </div>

                    <div className="action-tray">
                      <button 
                        className="btn-link edit" 
                        onClick={() => navigate(`/admin/employees/edit/${currentId}`)}
                      >
                        Edit Profile
                      </button>
                      <button 
                        className="btn-link delete" 
                        onClick={(e) => openDeleteModal(e, currentId)}
                      >
                        Delete Record
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}