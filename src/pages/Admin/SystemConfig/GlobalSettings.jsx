import React, { useEffect, useState } from "react";
import axios from "axios";
import ConfirmModal from "../../../components/ConfirmModal";

export default function GlobalSettings() {
  const [configs, setConfigs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  
  // Default structure for new entries
  const [formData, setFormData] = useState({
    keyName: "",
    value: "",
    description: "",
    updatedBy: { userId: 1 } // Hardcoded for now; should come from auth context
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // BASE URL check: Ensure this matches your Spring Boot server exactly
  const API_URL = "http://localhost:8080/api/system-config";

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
  try {
    const res = await axios.get("http://localhost:8080/api/system-config");
    console.log("Raw Data from Backend:", res.data); // Look at the console to see the structure
    
    // Ensure we are setting an array
    if (res.data) {
        setConfigs(Array.isArray(res.data) ? res.data : [res.data]);
    }
  } catch (err) {
    console.error("Fetch Error:", err.response?.data || err.message);
  }
};

  const saveAction = async (id) => {
    if (!formData.keyName || !formData.value) {
      alert("Key Name and Value are required");
      return;
    }
    try {
      // Per your backend service impl: handles both create and update
      await axios.post(API_URL, formData);
      fetchConfigs();
      cancel();
    } catch (err) { 
      console.error("Save Error:", err);
      alert("Save failed. Ensure Key Name is unique and UpdatedBy ID is valid."); 
    }
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ keyName: "", value: "", description: "", updatedBy: { userId: 1 } });
  };

  const startEdit = (conf) => {
    setEditingId(conf.configId);
    setAddingNew(false);
    setFormData({
      configId: conf.configId,
      keyName: conf.keyName,
      value: conf.value,
      description: conf.description,
      updatedBy: { userId: conf.updatedBy?.userId || 1 }
    });
  };

  // Improved Helper function with optional chaining to prevent 404/Null crashes
  const getEmployeeName = (conf) => {
    // Navigate: SystemConfig -> User -> Employee -> Name
    const emp = conf.updatedBy?.employee;
    if (emp && emp.firstName) {
      return `${emp.firstName} ${emp.lastName || ""}`;
    }
    // Fallback to username if employee object isn't linked
    return conf.updatedBy?.username || "System Admin";
  };

  return (
    <div className="org-section global-settings-theme">
      <div className="section-header">
        <h3>Global System Parameters</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); }}>+ Add Parameter</button>
      </div>

      <div className="table-scroll-container">
        <table className="org-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>ID</th>
              <th>Key Name</th>
              <th>Value</th>
              <th>Description</th>
              <th>Updated By</th>
              <th>Timestamp</th>
              <th style={{ textAlign: 'center', width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(addingNew || editingId) && (
              <tr className="editing-row">
                <td className="read-only-id">{editingId || "New"}</td>
                <td>
                  <input 
                    placeholder="KEY_NAME" 
                    value={formData.keyName} 
                    onChange={e => setFormData({...formData, keyName: e.target.value.toUpperCase()})}
                    disabled={!!editingId} // KeyName is unique and usually immutable in your backend
                  />
                </td>
                <td>
                  <input 
                    placeholder="Value" 
                    value={formData.value} 
                    onChange={e => setFormData({...formData, value: e.target.value})} 
                  />
                </td>
                <td>
                  <input 
                    placeholder="Description" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </td>
                <td className="read-only-id">Session User</td>
                <td className="read-only-id">Auto</td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn-small save" onClick={() => saveAction(editingId)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}

            {configs.map(conf => (
              editingId !== conf.configId && (
                <tr key={conf.configId}>
                  <td className="read-only-id">{conf.configId}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{conf.keyName}</td>
                  <td><span className="type-badge">{conf.value}</span></td>
                  <td>{conf.description}</td>
                  <td>
                    <span className="user-pill">{getEmployeeName(conf)}</span>
                  </td>
                  <td>
                    <small>
                      {conf.updatedAt ? new Date(conf.updatedAt).toLocaleString() : 'N/A'}
                    </small>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-small update" onClick={() => startEdit(conf)}>Edit</button>
                    <button className="btn-small delete" onClick={() => { setDeleteId(conf.configId); setShowConfirm(true); }}>Delete</button>
                  </td>
                </tr>
              )
            ))}
            {configs.length === 0 && !addingNew && (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                  No system configurations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        show={showConfirm} 
        onConfirm={async () => { 
          try {
            await axios.delete(`${API_URL}/${deleteId}`); 
            fetchConfigs(); 
            setShowConfirm(false); 
          } catch (err) {
            alert("Delete failed");
          }
        }} 
        onCancel={() => setShowConfirm(false)} 
        message="Are you sure you want to delete this configuration? This might affect payroll logic." 
      />
    </div>
  );
}