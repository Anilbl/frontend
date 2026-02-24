import React, { useEffect, useState } from "react";
import api from "../../../api/axios"; // Your token-enabled axios instance
import ConfirmModal from "../../../components/ConfirmModal";
import "./System-Config.css";

export default function GlobalSettings() {
  const [configs, setConfigs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [loading, setLoading] = useState(true);

  // Simplified form data: Backend handles ID, updatedBy, and timestamp
  const [formData, setFormData] = useState({
    keyName: "",
    value: "",
    description: ""
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await api.get("/system-config");
      setConfigs(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setLoading(false);
    }
  };

  const saveAction = async () => {
    if (!formData.keyName || !formData.value) {
      alert("Key Name and Value are required");
      return;
    }
    try {
      // We use POST for both create and update. 
      // The backend service now checks if keyName exists and updates accordingly.
      await api.post("/system-config", formData);
      fetchConfigs();
      cancel();
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Check Unique Key and Permissions";
      alert("Save failed: " + errorMsg);
    }
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ keyName: "", value: "", description: "" });
  };

  const startEdit = (conf) => {
    setEditingId(conf.configId);
    setAddingNew(false);
    setFormData({
      keyName: conf.keyName,
      value: conf.value,
      description: conf.description
    });
  };

  const getDisplayName = (conf) => {
    return conf.updatedBy?.username || "System Admin";
  };

  if (loading) return <div className="placeholder-container">Loading...</div>;

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
                    onChange={e => setFormData({ ...formData, keyName: e.target.value.toUpperCase() })}
                    disabled={!!editingId} // Key cannot be changed once created
                  />
                </td>
                <td>
                  <input
                    placeholder="Value"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    placeholder="Description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </td>
                <td className="read-only-id">Session User</td>
                <td className="read-only-id">Auto</td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn-small save" onClick={saveAction}>Save</button>
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
                  <td><span className="user-pill">{getDisplayName(conf)}</span></td>
                  <td><small>{conf.updatedAt ? new Date(conf.updatedAt).toLocaleString() : 'N/A'}</small></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-small update" onClick={() => startEdit(conf)}>Edit</button>
                    <button className="btn-small delete" onClick={() => { setDeleteId(conf.configId); setShowConfirm(true); }}>Delete</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        show={showConfirm}
        onConfirm={async () => {
          try {
            await api.delete(`/system-config/${deleteId}`);
            fetchConfigs();
            setShowConfirm(false);
          } catch (err) {
            alert("Delete failed");
          }
        }}
        onCancel={() => setShowConfirm(false)}
        message="Are you sure? This may affect payroll logic."
      />
    </div>
  );
}