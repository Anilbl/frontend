import React, { useState, useEffect } from 'react';
import { Upload, FileText, Eye, X, Loader } from 'lucide-react';
import api from '../../api/axios';
import './UserProfile.css';

// ✅ HARDCODED — no API needed
const DOC_TYPES = {
  "Citizenship":            ["Front", "Back"],
  "Passport":               ["Single Page", "Full Booklet"],
  "PAN Card":               ["Single Page"],
  "Driving License":        ["Front", "Back"],
  "Academic Certificate":   ["Bachelor", "Master", "SLC", "Plus Two"],
  "Experience Letter":      ["Single Page"],
  "Offer Letter":           ["Single Page"],
};

// ✅ STATUS BADGE CONFIG — hardcoded
const DOC_STATUSES = {
  PENDING:   { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: '📝 Draft' },
  SUBMITTED: { bg: '#dbeafe', color: '#1e40af', border: '#93c5fd', label: '📤 Submitted' },
  APPROVED:  { bg: '#dcfce7', color: '#166534', border: '#86efac', label: '✅ Approved' },
  REJECTED:  { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', label: '❌ Rejected' },
};

const UserProfile = () => {
  const [documents, setDocuments] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedDocSubType, setSelectedDocSubType] = useState('');
  const [subTypes, setSubTypes] = useState([]);
  const [submitting, setSubmitting] = useState(false); // ✅ NEW

  const session = JSON.parse(localStorage.getItem('user_session') || '{}');
  const token = session.jwt || session.token;
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const empId = session.empId;

  useEffect(() => {
    fetchEmployeeProfile();
    fetchEmployeeDocuments();
  }, []);

  const loadPreviewUrl = async (doc) => {
    setPreviewUrl(null);
    try {
      const response = await api.get(
        `/employee-documents/${doc.documentId}/file`,
        { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' }
      );
      setPreviewUrl(URL.createObjectURL(response.data));
    } catch (err) {
      console.error('Error loading preview:', err);
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPreviewDoc(null);
  };

  const fetchEmployeeProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get(`/employees/${empId}`, authHeader);
      setUserDetails(response.data);
      setEditData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
      setLoading(false);
    }
  };

  const fetchEmployeeDocuments = async () => {
    try {
      const response = await api.get(`/employee-documents`, authHeader);
      const empDocs = response.data.filter(doc => doc.employee?.empId === parseInt(empId));
      setDocuments(empDocs);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    setDragActive(e.type !== 'dragleave');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files[0]) {
      if (!selectedDocType) {
        setMessage({ type: 'error', text: 'Please select document type first' });
        return;
      }
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const generateDocumentName = () => {
    if (!selectedDocType || !selectedDocSubType) return '';
    const count = documents.filter(d =>
      d.documentType === selectedDocType && d.title.includes(selectedDocSubType)
    ).length + 1;
    return `${selectedDocType} - ${selectedDocSubType} (${count})`;
  };

  const handleFileUpload = async (file) => {
    try {
      setUploadingFile(true);
      setMessage({ type: '', text: '' });

      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size exceeds 5MB' });
        return;
      }

      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Only PDF, JPG, PNG allowed' });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('empId', empId);
      formData.append('documentType', selectedDocType);
      formData.append('title', generateDocumentName());
      formData.append('uploadedBy', session.userId);

      const response = await api.post('/employee-documents/upload', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      setDocuments([...documents, response.data]);
      setMessage({ type: 'success', text: `✅ ${selectedDocType} uploaded successfully!` });
      setShowUploadModal(false);
      setSelectedDocType('');
      setSelectedDocSubType('');
      setSubTypes([]);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setUploadingFile(false);
    }
  };

  // ✅ NEW — Submit all PENDING docs for admin review
  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      await api.post(`/employee-documents/submit-review/${empId}`, {}, authHeader);
      setMessage({ type: 'success', text: '✅ Documents submitted for review!' });
      fetchEmployeeDocuments();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Submit failed. Try again.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setMessage({ type: '', text: '' });
      await api.put(`/employees/${empId}`, editData, authHeader);
      setUserDetails(editData);
      setIsEditing(false);
      setMessage({ type: 'success', text: '✅ Profile updated successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const getStatusBadge = (status) => {
    const s = status?.toUpperCase() || 'PENDING';
    const cfg = DOC_STATUSES[s] || DOC_STATUSES.PENDING;
    return (
      <span style={{
        background: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.border}`,
        padding: '2px 10px', borderRadius: '999px',
        fontSize: '0.72rem', fontWeight: '600',
        whiteSpace: 'nowrap',
      }}>
        {cfg.label}
      </span>
    );
  };

  // ✅ Only show Submit button if there are PENDING docs
  const hasPendingDocs = documents.some(d => d.status === 'PENDING');

  if (loading) {
    return (
      <div className="user-profile-page">
        <div className="loading-container">
          <Loader size={48} className="spinner" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !userDetails) {
    return (
      <div className="user-profile-page">
        <div className="error-container">
          <p className="error-message">⚠️ {error}</p>
          <button className="btn btn-edit" onClick={fetchEmployeeProfile}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-page">
      {message.text && (
        <div className={`message-toast ${message.type}`}>
          {message.text}
        </div>
      )}

      {userDetails && (
        <>
          {/* ===== PERSONAL DETAILS ===== */}
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">Personal Details</h2>
            
            </div>

            {isEditing ? (
              <div className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input type="text" value={editData?.firstName || ''} onChange={(e) => handleEditChange('firstName', e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input type="text" value={editData?.lastName || ''} onChange={(e) => handleEditChange('lastName', e.target.value)} className="form-input" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" value={editData?.email || ''} onChange={(e) => handleEditChange('email', e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Contact Number</label>
                    <input type="tel" value={editData?.contact || ''} onChange={(e) => handleEditChange('contact', e.target.value)} className="form-input" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Marital Status</label>
                    <input type="text" value={editData?.maritalStatus || ''} onChange={(e) => handleEditChange('maritalStatus', e.target.value)} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Education</label>
                    <input type="text" value={editData?.education || ''} onChange={(e) => handleEditChange('education', e.target.value)} className="form-input" />
                  </div>
                </div>
                <div className="form-group full">
                  <label className="form-label">Address</label>
                  <input type="text" value={editData?.address || ''} onChange={(e) => handleEditChange('address', e.target.value)} className="form-input" />
                </div>
              </div>
            ) : (
              <div className="details-grid">
                <div className="detail-card">
                  <div className="detail-icon">👤</div>
                  <div className="detail-content">
                    <span className="detail-label">FULL NAME</span>
                    <span className="detail-value">{userDetails.firstName} {userDetails.lastName}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">📧</div>
                  <div className="detail-content">
                    <span className="detail-label">EMAIL</span>
                    <span className="detail-value">{userDetails.email}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">📞</div>
                  <div className="detail-content">
                    <span className="detail-label">CONTACT</span>
                    <span className="detail-value">{userDetails.contact || 'N/A'}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">📍</div>
                  <div className="detail-content">
                    <span className="detail-label">ADDRESS</span>
                    <span className="detail-value">{userDetails.address || 'N/A'}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">💍</div>
                  <div className="detail-content">
                    <span className="detail-label">MARITAL STATUS</span>
                    <span className="detail-value">{userDetails.maritalStatus || 'N/A'}</span>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="detail-icon">📚</div>
                  <div className="detail-content">
                    <span className="detail-label">EDUCATION</span>
                    <span className="detail-value">{userDetails.education || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ===== EMPLOYMENT INFO ===== */}
          <div className="profile-section">
            <h2 className="section-title">Employment Information</h2>
            <div className="details-grid">
              <div className="detail-card">
                <div className="detail-icon">👤</div>
                <div className="detail-content">
                  <span className="detail-label">EMPLOYEE ID</span>
                  <span className="detail-value">EMP-{userDetails.empId}</span>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-icon">🏢</div>
                <div className="detail-content">
                  <span className="detail-label">DEPARTMENT</span>
                  <span className="detail-value">{userDetails.department?.deptName || 'N/A'}</span>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-icon">💼</div>
                <div className="detail-content">
                  <span className="detail-label">POSITION</span>
                  <span className="detail-value">{userDetails.position?.designationTitle || 'N/A'}</span>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-icon">💰</div>
                <div className="detail-content">
                  <span className="detail-label">BASIC SALARY</span>
                  <span className="detail-value">Rs. {userDetails.basicSalary?.toLocaleString() || '0'}</span>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-icon">📅</div>
                <div className="detail-content">
                  <span className="detail-label">JOINING DATE</span>
                  <span className="detail-value">{userDetails.joiningDate || 'N/A'}</span>
                </div>
              </div>
              <div className="detail-card">
                <div className="detail-icon">✓</div>
                <div className="detail-content">
                  <span className="detail-label">STATUS</span>
                  <span className="detail-value">{userDetails.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== DOCUMENTS ===== */}
          <div className="profile-section">
            <div className="section-header">
              <h2 className="section-title">Documents & Verification</h2>
              <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
                + Upload Document
              </button>
            </div>

            <div className="documents-container">
              <h3 className="documents-title">Uploaded Documents ({documents.length})</h3>

              {documents.length === 0 ? (
                <p className="no-documents">No documents uploaded yet. Click "Upload Document" to add your documents.</p>
              ) : (
                <>
                  <div className="documents-list">
                    {documents.map((doc) => (
                      <div key={doc.documentId} className="document-row">
                        <div className="doc-info">
                          <div className="doc-icon"><FileText size={24} /></div>
                          <div className="doc-details">

                            {/* TITLE + STATUS BADGE */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <p className="doc-name">{doc.title}</p>
                              {getStatusBadge(doc.status)}
                            </div>

                            <div className="doc-meta">
                              <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>Expires: {doc.expiryDate}</span>
                            </div>

                            {/* REJECTION REASON */}
                            {doc.status === 'REJECTED' && doc.reviewNote && (
                              <p style={{ color: '#991b1b', fontSize: '0.78rem', marginTop: '4px' }}>
                                ❗ Reason: {doc.reviewNote}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* PREVIEW BUTTON ONLY */}
                        <div className="doc-actions">
                          <button
                            className="action-btn"
                            onClick={() => { setPreviewDoc(doc); loadPreviewUrl(doc); }}
                            title="Preview"
                          >
                            <Eye size={20} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ✅ SUBMIT FOR REVIEW — only if PENDING docs exist */}
                  {hasPendingDocs && (
                    <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                      <button
                        className="btn btn-primary"
                        onClick={handleSubmitForReview}
                        disabled={submitting}
                      >
                        {submitting ? '⏳ Submitting...' : '📤 Submit for Review'}
                      </button>
                      <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px' }}>
                        Submit all uploaded documents to admin for approval.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* ===== UPLOAD MODAL ===== */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content modal-upload" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Document</h3>
              <button className="modal-close" onClick={() => setShowUploadModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body upload-modal">

              {/* ✅ HARDCODED DOC TYPE DROPDOWN */}
              <div className="form-group">
                <label className="form-label">Select Document Type</label>
                <select
                  value={selectedDocType}
                  onChange={(e) => {
                    setSelectedDocType(e.target.value);
                    setSelectedDocSubType('');
                    setSubTypes(DOC_TYPES[e.target.value] || []);
                  }}
                  className="form-input"
                >
                  <option value="">-- Choose Document Type --</option>
                  {Object.keys(DOC_TYPES).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* SUB TYPE BUTTONS */}
              {selectedDocType && subTypes.length > 0 && (
                <div className="form-group">
                  <label className="form-label">Select Sub-Type</label>
                  <div className="subtype-buttons">
                    {subTypes.map(subType => (
                      <button
                        key={subType}
                        className={`subtype-btn ${selectedDocSubType === subType ? 'active' : ''}`}
                        onClick={() => setSelectedDocSubType(subType)}
                      >
                        {subType}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocType && selectedDocSubType && (
                <>
                  <div className="document-preview">
                    <p className="preview-text">Document will be named as:</p>
                    <p className="preview-name">{generateDocumentName()}</p>
                  </div>
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`upload-zone-modal ${dragActive ? 'drag-active' : ''}`}
                  >
                    {uploadingFile ? (
                      <>
                        <Loader size={48} className="upload-icon spinner" />
                        <p className="upload-title">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload size={48} className="upload-icon" />
                        <p className="upload-title">Upload {selectedDocSubType}</p>
                        <p className="upload-subtitle">Drag and drop or click to select</p>
                        <label className="file-input-label">
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(e.target.files[0])}
                            className="file-input-hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={uploadingFile}
                          />
                          <span className="btn btn-select">📁 Select File</span>
                        </label>
                        <p className="upload-note">Supported: PDF, JPG, PNG (Max 5MB)</p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== PREVIEW MODAL ===== */}
      {previewDoc && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{previewDoc.title}</h3>
              <button className="modal-close" onClick={closePreview}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <p><strong>Uploaded:</strong> {new Date(previewDoc.uploadedAt).toLocaleDateString()}</p>
              <p><strong>Expires:</strong> {previewDoc.expiryDate}</p>
              <div style={{ marginTop: '1rem' }}>
                {!previewUrl ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    <Loader size={32} className="spinner" />
                    <p>Loading preview...</p>
                  </div>
                ) : previewDoc.contentType === 'application/pdf' ? (
                  <iframe
                    src={previewUrl}
                    width="100%"
                    height="500px"
                    title={previewDoc.title}
                    style={{ border: 'none', borderRadius: '0.5rem' }}
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt={previewDoc.title}
                    style={{ width: '100%', borderRadius: '0.5rem', maxHeight: '500px', objectFit: 'contain' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;