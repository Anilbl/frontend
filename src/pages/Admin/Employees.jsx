import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees, deleteEmployee } from "../../api/employeeApi";
import ConfirmModal from "../../components/ConfirmModal";
import "./Employees.css";

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data || res || []);
    } catch (err) {
      setStatusMsg({ type: "error", text: "Connection error." });
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => setExpandedId(expandedId === id ? null : id);

  const openDeleteModal = (e, id) => {
    e.stopPropagation();
    setTargetId(id);
    setShowModal(true);
  };

  const filtered = employees
    .filter(emp => `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (b.empId || b.id) - (a.empId || a.id));

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const confirmDelete = async () => {
    setShowModal(false);
    try {
      await deleteEmployee(targetId);
      setStatusMsg({ type: "success", text: "Record removed." });
      fetchData();
    } catch (err) {
      setStatusMsg({ type: "error", text: "Delete failed." });
    }
  };

  if (loading) return <div className="loader">Loading...</div>;

  return (
    <div className="app-canvas professional-view">
      <ConfirmModal show={showModal} onConfirm={confirmDelete} onCancel={() => setShowModal(false)} />

      <header className="page-header compact">
        <div className="header-left">
          <div className="search-container">
            <input 
              placeholder="Search employee by username or ID..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>
        <h3 className="centered-title">Employee Management</h3>
        <div className="header-right">
          <button className="primary-btn" onClick={() => navigate("/admin/employees/new")}>+ Register</button>
        </div>
      </header>

      <div className="data-list-container no-scroll-container">
        <div className="list-columns">
          <span>Name / ID</span>
          <span>Email</span>
          <span>Department</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        <div className="fixed-list-area">
          {currentData.map((emp) => {
            const cId = emp.empId || emp.id;
            return (
              <div key={cId} className="list-row-group">
                <div className="row-visible" onClick={() => toggleRow(cId)}>
                  <span className="bold">#{cId} {emp.firstName}</span>
                  <span>{emp.email}</span>
                  <span>{emp.department?.deptName || "N/A"}</span>
                  <span>
                    <span className={`status-tag ${emp.isActive ? "active" : "inactive"}`}>
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <button className="view-btn">{expandedId === cId ? "Close" : "View"}</button>
                  </div>
                </div>

                {expandedId === cId && (
                  <div className="row-hidden-tray">
                    <div className="details-grid">
                      <span><strong>Contact:</strong> {emp.contact}</span>
                      <span><strong>Position:</strong> {emp.position?.designationTitle || "N/A"}</span>
                      <span><strong>Education:</strong> {emp.education}</span>
                      <div className="tray-actions">
                        <button className="action-link edit" onClick={() => navigate(`/admin/employees/edit/${cId}`)}>Edit Profile</button>
                        <button className="action-link delete" onClick={(e) => openDeleteModal(e, cId)}>Delete Record</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <footer className="pagination-footer">
          <div className="page-info">Total: {filtered.length} employees</div>
          <div className="pagination-controls">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <span className="page-indicator">{currentPage} / {totalPages || 1}</span>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </footer>
      </div>
    </div>
  );
}