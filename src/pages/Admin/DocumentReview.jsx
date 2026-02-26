import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import "./Leave.css";
import { X, Loader } from "lucide-react";

const AdminDocumentReview = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("SUBMITTED");
  const [searchTerm, setSearchTerm] = useState("");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // ✅ NEW — preview state
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const sessionData = localStorage.getItem("user_session");
  const userSession = sessionData ? JSON.parse(sessionData) : null;
  const adminId = userSession?.userId;
  const token = userSession?.jwt || userSession?.token;

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/employee-documents/admin/all", {
        params: { status: selectedStatus, search: searchTerm },
      });
      const docs = Array.isArray(res.data) ? res.data : [];
      setDocuments(docs.sort((a, b) => b.documentId - a.documentId));
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    setCurrentPage(1);
  }, [selectedStatus, searchTerm]);

  // ✅ NEW — load file as blob for preview
  const loadPreviewUrl = async (doc) => {
    setPreviewUrl(null);
    setPreviewDoc(doc);
    try {
      const response = await api.get(
        `/employee-documents/${doc.documentId}/file`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        }
      );
      setPreviewUrl(URL.createObjectURL(response.data));
    } catch (err) {
      console.error("Error loading preview:", err);
    }
  };

  // ✅ NEW — close preview and free memory
  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewDoc(null);
  };

  const handleAction = (docId, action) => {
    if (action === "REJECTED") {
      setSelectedDocId(docId);
      setShowRejectModal(true);
    } else {
      submitReview(docId, "APPROVED", "");
    }
  };

  const submitReview = async (docId, status, note) => {
    if (!adminId) {
      alert("Session error: Admin ID not found.");
      return;
    }
    try {
      await api.patch(`/employee-documents/admin/${docId}/review`, {
        status: status,
        reviewNote: note,
        reviewedBy: String(adminId),
      });
      setShowRejectModal(false);
      setRejectionReason("");
      fetchDocuments();
    } catch (err) {
      alert("Failed: " + (err.response?.data?.message || "Error"));
    }
  };

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = documents.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(documents.length / recordsPerPage);

  return (
    <div className="leave-container">

      {/* HEADER + FILTERS */}
      <div className="leave-header-section">
        <h2 className="leave-header">Document Verification</h2>
        <div className="leave-filter-bar">
          <input
            type="text"
            placeholder="Search Name or ID..."
            className="filter-search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="filter-select"
          >
            <option value="SUBMITTED">Submitted</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="PENDING">Pending (Draft)</option>
            <option value="ALL">All</option>
          </select>
        </div>
      </div>

      <div className="record-summary-line">
        Showing <strong>{selectedStatus}</strong> documents — <strong>{documents.length}</strong> records
      </div>

      {/* TABLE */}
      <div className="leave-table-wrapper">
        {loading ? (
          <div className="table-loader">Fetching latest records...</div>
        ) : (
          <table className="leave-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Document Type</th>
                <th>Uploaded Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentRecords.length > 0 ? (
                currentRecords.map((doc) => (
                  <tr key={doc.documentId}>

                    <td>
                      <div className="emp-info">
                        <strong>{doc.employee?.firstName} {doc.employee?.lastName}</strong>
                        <span className="emp-id-sub">EMP ID: {doc.employee?.empId}</span>
                      </div>
                    </td>

                    <td>{doc.title}</td>

                    <td>{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : "—"}</td>

                    <td>{doc.expiryDate}</td>

                    <td>
                      <span className={`status-badge ${doc.status?.toLowerCase()}`}>
                        {doc.status}
                      </span>
                    </td>

                    {/* ✅ ACTION — View + Approve + Reject */}
                    <td>
                      <div className="btn-group">

                        {/* VIEW BUTTON — always visible */}
                        <button
                          className="btn-view"
                          onClick={() => loadPreviewUrl(doc)}
                          style={{
                            background: "#e0f2fe",
                            color: "#0369a1",
                            border: "none",
                            padding: "5px 12px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "0.82rem",
                          }}
                        >
                          👁 View
                        </button>

                        {/* APPROVE / REJECT — only for SUBMITTED */}
                        {doc.status === "SUBMITTED" && (
                          <>
                            <button
                              className="btn-approve"
                              onClick={() => handleAction(doc.documentId, "APPROVED")}
                            >
                              Approve
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleAction(doc.documentId, "REJECTED")}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* PROCESSED label for non-submitted */}
                        {doc.status !== "SUBMITTED" && (
                          <span className="action-done">Processed</span>
                        )}

                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "#94a3b8" }}>
                    No records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="rejection-modal">
            <h3>Reject Document</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              required
            />
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button
                className="btn-confirm-reject"
                onClick={() => submitReview(selectedDocId, "REJECTED", rejectionReason)}
                disabled={!rejectionReason.trim()}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ PREVIEW MODAL */}
      {previewDoc && (
        <div className="modal-overlay" onClick={closePreview}>
          <div
            className="rejection-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "700px", maxWidth: "95vw" }}
          >
            {/* HEADER */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>{previewDoc.title}</h3>
              <button
                onClick={closePreview}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={22} />
              </button>
            </div>

            {/* META INFO */}
            <p style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "1rem" }}>
              <strong>Employee:</strong> {previewDoc.employee?.firstName} {previewDoc.employee?.lastName} &nbsp;|&nbsp;
              <strong>Uploaded:</strong> {previewDoc.uploadedAt ? new Date(previewDoc.uploadedAt).toLocaleDateString() : "—"} &nbsp;|&nbsp;
              <strong>Expires:</strong> {previewDoc.expiryDate}
            </p>

            {/* FILE PREVIEW */}
            {!previewUrl ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
                <Loader size={32} className="spinner" />
                <p>Loading document...</p>
              </div>
            ) : previewDoc.contentType === "application/pdf" ? (
              <iframe
                src={previewUrl}
                width="100%"
                height="500px"
                title={previewDoc.title}
                style={{ border: "none", borderRadius: "0.5rem" }}
              />
            ) : (
              <img
                src={previewUrl}
                alt={previewDoc.title}
                style={{ width: "100%", borderRadius: "0.5rem", maxHeight: "500px", objectFit: "contain" }}
              />
            )}

            {/* CLOSE BUTTON */}
            <div style={{ textAlign: "right", marginTop: "1rem" }}>
              <button className="btn-cancel" onClick={closePreview}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div style={{ fontSize: "0.85rem", color: "#64748b" }}>
            Page {currentPage} of {totalPages}
          </div>
          <div className="pagination-buttons">
            <button className="pg-btn" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
              Prev
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                className={`pg-num ${currentPage === i + 1 ? "active" : ""}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button className="pg-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDocumentReview;