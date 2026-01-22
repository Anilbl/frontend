import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getEmployees, deleteEmployee } from "../../api/employeeApi";
import ConfirmModal from "../../components/ConfirmModal";
import "./Employees.css";

export default function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [targetId, setTargetId] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (e, id) => {
    e.stopPropagation();
    setTargetId(id);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteEmployee(targetId);
      fetchEmployees();
    } catch (err) {
      alert("Failed to delete employee");
    } finally {
      setShowModal(false);
    }
  };

  const filtered = employees
    .filter(emp =>
      `${emp.firstName} ${emp.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.empId || b.id) - (a.empId || a.id));

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <div className="loader">Loading...</div>;

  return (
    <div className="app-canvas professional-view">
      <ConfirmModal
        show={showModal}
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
      />

      {/* HEADER */}
      <header className="page-header compact">
        <div className="header-left">
          <input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <h3 className="centered-title">Employee Management</h3>

        <div className="header-right">
          <button
            className="primary-btn"
            onClick={() => navigate("/admin/employees/new")}
          >
            + Add Employee
          </button>
        </div>
      </header>

      {/* TABLE HEADER */}
      <div className="list-columns">
        <span>Name / ID</span>
        <span>Email</span>
        <span>Department</span>
        <span>Status</span>
        <span style={{ textAlign: "right" }}>Actions</span>
      </div>

      {/* LIST */}
      <div className="fixed-list-area">
        {currentData.length > 0 ? (
          currentData.map(emp => {
            const id = emp.empId || emp.id;
            return (
              <div key={id} className="list-row-group">
                <div
                  className="row-visible"
                  onClick={() =>
                    setExpandedId(expandedId === id ? null : id)
                  }
                >
                  <span className="bold">
                    #{id} {emp.firstName} {emp.lastName}
                  </span>
                  <span>{emp.email}</span>
                  <span>{emp.department?.deptName || "N/A"}</span>
                  <span>
                    <span
                      className={`status-tag ${
                        emp.isActive ? "active" : "inactive"
                      }`}
                    >
                      {emp.isActive ? "Working" : "On Leave"}
                    </span>
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <button className="view-btn">
                      {expandedId === id ? "Hide" : "View"}
                    </button>
                  </div>
                </div>

                {expandedId === id && (
                  <div className="row-hidden-tray">
                    <div className="details-grid">
                      <span><strong>Contact:</strong> {emp.contact}</span>
                      <span><strong>Position:</strong> {emp.position?.designationTitle || "N/A"}</span>
                      <span><strong>Education:</strong> {emp.education}</span>

                      <div className="tray-actions">
                        <button
                          className="action-link edit"
                          onClick={() => navigate(`/admin/employees/edit/${id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="action-link delete"
                          onClick={(e) => openDeleteModal(e, id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-results">No employees found</div>
        )}
      </div>

      {/* PAGINATION */}
      <footer className="pagination-footer">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(p => p - 1)}
        >
          Prev
        </button>

        <span>
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Next
        </button>
      </footer>
    </div>
  );
}
