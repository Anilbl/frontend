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

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await getEmployees();
      const data = Array.isArray(res.data) ? res.data : (res.data?.content || []);
      setEmployees(data);
    } catch (err) { 
      console.error("Fetch Error:", err); 
      setEmployees([]); 
    } finally { 
      setLoading(false); 
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteEmployee(targetId);
      fetchEmployees();
    } catch (err) { console.error(err); } 
    finally { setShowModal(false); }
  };

  const filtered = employees.filter(emp => {
    const firstName = emp.firstName || "";
    const middleName = emp.middleName ? emp.middleName + " " : "";
    const lastName = emp.lastName || "";
    const fullName = `${firstName} ${middleName}${lastName}`.toLowerCase();
    const idStr = (emp.empId || emp.id || "").toString();
    return fullName.includes(searchTerm.toLowerCase()) || idStr.includes(searchTerm.toLowerCase());
  }).sort((a, b) => (b.empId || b.id) - (a.empId || a.id));

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) return <div className="loader">Loading Employee Data...</div>;

  return (
    <div className="emp-page-container">
      <ConfirmModal show={showModal} onConfirm={confirmDelete} onCancel={() => setShowModal(false)} />

      <header className="emp-header">
        <input 
          className="emp-search" 
          placeholder="Search Name or ID..." 
          value={searchTerm} 
          onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} 
        />
        <h3 className="emp-title">Employee Management</h3>
        <button className="emp-add-btn" onClick={() => navigate("/admin/employees/new")}>+ Add New</button>
      </header>

      <div className="emp-table-card">
        <div className="emp-columns-head">
          <span>Employee (ID)</span>
          <span>Email Address</span>
          <span>Department</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        <div className="emp-list-content">
          {currentData.length === 0 ? (
            <div className="emp-no-data" style={{textAlign: 'center', padding: '40px', color: '#888'}}>
              <p>No employees found.</p>
              <small>Check backend logs if you expected data here.</small>
            </div>
          ) : (
            currentData.map(emp => {
              const id = emp.empId || emp.id;
              
              // Correctly extract bank details from the array
              const primaryBank = Array.isArray(emp.bankAccount) ? emp.bankAccount[0] : emp.bankAccount;
              const bankName = primaryBank?.bank?.bankName || "Not Linked";
              const accountNo = primaryBank?.accountNumber || "N/A";

              return (
                <div key={id} className="emp-row-group">
                  <div className="emp-row-main">
                    <span className="emp-bold">
                        #{id} {emp.firstName} {emp.middleName ? emp.middleName + " " : ""}{emp.lastName}
                    </span>
                    <span className="emp-muted">{emp.email}</span>
                    <span>{emp.department?.deptName || "N/A"}</span>
                    <span>
                      <span className={`emp-status-tag ${emp.isActive ? "active" : "inactive"}`}>
                        {emp.isActive ? "Active" : "On Leave"}
                      </span>
                    </span>
                    <div style={{ textAlign: "right" }}>
                      <button className="emp-view-trigger" onClick={() => setExpandedId(expandedId === id ? null : id)}>
                        {expandedId === id ? "Hide" : "Details"}
                      </button>
                    </div>
                  </div>

                  {expandedId === id && (
                    <div className="emp-details-tray">
                      <div className="emp-details-grid">
                        <span><strong>Contact:</strong> {emp.contact || "N/A"}</span>
                        <span><strong>Education:</strong> {emp.education || "N/A"}</span>
                        <span><strong>Position:</strong> {emp.position?.designationTitle || "N/A"}</span>
                        <span><strong>Basic Salary:</strong> {emp.basicSalary?.toLocaleString() || "0"}</span>
                        
                        {/* Corrected Bank Details section */}
                        <span><strong>Bank:</strong> {bankName}</span>
                        <span><strong>A/C No:</strong> {accountNo}</span>
                        
                        {/* Marital Status (Added for completeness) */}
                        <span><strong>Marital Status:</strong> {emp.maritalStatus || "N/A"}</span>

                        <div className="emp-tray-actions">
                          <button className="emp-action-edit" onClick={() => navigate(`/admin/employees/edit/${id}`)}>✎ Edit</button>
                          <button className="emp-action-delete" onClick={() => { setTargetId(id); setShowModal(true); }}>🗑 Delete</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <footer className="emp-pagination">
          <div className="emp-pagination-info">Showing {currentData.length} of {filtered.length} entries</div>
          <div className="emp-pagination-ctrl">
            <button className="emp-pg-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
            <span className="emp-pg-text">Page {currentPage} of {totalPages || 1}</span>
            <button className="emp-pg-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
          </div>
        </footer>
      </div>
    </div>
  );
}