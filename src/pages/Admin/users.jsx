import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, deleteUser } from "../../api/userApi"; 
import ConfirmModal from "../../components/ConfirmModal";
import "./users.css";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Confirmation Modal State
  const [showModal, setShowModal] = useState(false);
  const [targetId, setTargetId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data || res || []);
    } catch (err) {
      console.error("Error fetching users", err);
      setStatusMsg({ type: "error", text: "Failed to sync with database." });
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (id) => setExpandedId(expandedId === id ? null : id);

  // Triggered from the hidden tray delete button
  const openDeleteModal = (e, id) => {
    e.stopPropagation();
    setTargetId(id);
    setShowModal(true);
  };

  // Logic for the Modal "Yes" action
  const confirmDelete = async () => {
    setShowModal(false);
    if (!targetId) return;

    try {
      await deleteUser(targetId);
      setStatusMsg({ type: "success", text: "User deleted successfully." });
      fetchData(); // Refresh list
      setTimeout(() => setStatusMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setStatusMsg({ type: "error", text: "Operation failed." });
    } finally {
      setTargetId(null);
    }
  };

  const filteredUsers = users
    .filter(u => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.userId.toString().includes(searchTerm)
    )
    .sort((a, b) => b.userId - a.userId); 

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentData = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <div className="loader">Initializing Records...</div>;

  return (
    <div className="app-canvas professional-view">
      {/* Your Existing Confirm Modal */}
      <ConfirmModal 
        show={showModal}
        message="Are you sure you want to permanently delete this user account?"
        onConfirm={confirmDelete}
        onCancel={() => setShowModal(false)}
      />

      <header className="page-header compact">
        <div className="header-left">
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search by username or ID..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        <h3 className="centered-title">User Management</h3>

        <div className="header-right">
          <button className="primary-btn" onClick={() => navigate("/admin/users/new")}>
            + Create New User
          </button>
        </div>
      </header>

      {/* Inline Status Message */}
      {statusMsg.text && (
        <div className={`status-box ${statusMsg.type}`}>
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg({ type: "", text: "" })}>×</button>
        </div>
      )}

      <div className="data-list-container no-scroll-container">
        <div className="list-columns">
          <span>Username / ID</span>
          <span>Email Address</span>
          <span>Role</span>
          <span>Status</span>
          <span style={{ textAlign: "right" }}>Actions</span>
        </div>

        <div className="fixed-list-area">
          {currentData.length > 0 ? (
            currentData.map((user) => (
              <div key={user.userId} className="list-row-group">
                <div className="row-visible" onClick={() => toggleRow(user.userId)}>
                  <span className="bold">#{user.userId} - {user.username}</span>
                  <span>{user.email}</span>
                  <span>{user.role?.roleName || "N/A"}</span>
                  <span>
                    <span className={`status-tag ${user.status?.toLowerCase()}`}>
                      {user.status || "UNKNOWN"}
                    </span>
                  </span>
                  <div style={{ textAlign: "right" }}>
                    <button className="view-btn">
                      {expandedId === user.userId ? "Close" : "View"}
                    </button>
                  </div>
                </div>

                {expandedId === user.userId && (
                  <div className="row-hidden-tray">
                    <div className="details-grid">
                      <span><strong>Username:</strong> {user.username}</span>
                      <span><strong>User ID:</strong> {user.userId}</span>
                      <span><strong>Role Name:</strong> {user.role?.roleName || "N/A"}</span>
                      <div className="tray-actions">
                        <button className="action-link edit" onClick={() => navigate(`/admin/users/edit/${user.userId}`)}>
                          Edit User
                        </button>
                        <button className="action-link delete" onClick={(e) => openDeleteModal(e, user.userId)}>
                          Delete User
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">No matching users found.</div>
          )}
        </div>

        <footer className="pagination-footer">
          <div className="page-info">
            Showing {currentData.length} of {filteredUsers.length} entries
          </div>
          <div className="pagination-controls">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
            <span className="page-indicator">{currentPage} / {totalPages || 1}</span>
            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
          </div>
        </footer>
      </div>
    </div>
  );
}