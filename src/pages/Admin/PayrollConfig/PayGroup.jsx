import React, { useEffect, useState } from "react";
import axios from "axios";
import ConfirmModal from "../../../components/ConfirmModal";
import "./PayrollConfig.css";

export default function PayGroup() {
  const [payGroups, setPayGroups] = useState([]);
  const [editingId, setEditingId] = useState(null); // Added for update functionality
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({ name: "", frequency: "Monthly", nextRunDate: "" });
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_URL = "http://localhost:8080/api/paygroups";

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(API_URL);
      setPayGroups(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("PayGroup fetch failed", err); }
  };

  const startEdit = (p) => {
    setEditingId(p.payGroupId);
    setAddingNew(false);
    setFormData({ name: p.name, frequency: p.frequency, nextRunDate: p.nextRunDate });
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ name: "", frequency: "Monthly", nextRunDate: "" });
  };

  const saveEdit = async (id) => {
    if (!formData.name || !formData.nextRunDate) return;
    try {
      if (addingNew) {
        await axios.post(API_URL, formData);
      } else {
        await axios.put(`${API_URL}/${id}`, formData);
      }
      fetchGroups();
      cancel();
    } catch (err) { alert("Save failed. Ensure the backend PUT method is implemented."); }
  };

  return (
    <div className="org-section leave-theme">
      <div className="section-header">
        <h3>Pay Groups</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); setFormData({name:"", frequency:"Monthly", nextRunDate:""}); }}>
          + Add Group
        </button>
      </div>
      <div className="table-wrapper">
        <table className="org-table">
          <thead>
            <tr>
              <th style={{ width: '10%' }}>ID</th>
              <th>Group Name</th>
              <th>Frequency</th>
              <th>Next Run</th>
              <th style={{ textAlign: 'center', width: '25%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(addingNew || editingId) && (
              <tr className="editing-row">
                <td className="read-only-id">{editingId || "New"}</td>
                <td><input autoFocus value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Staff" /></td>
                <td>
                  <select value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}>
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Biweekly">Biweekly</option>
                  </select>
                </td>
                <td><input type="date" value={formData.nextRunDate} onChange={e => setFormData({...formData, nextRunDate: e.target.value})} /></td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn-small save" onClick={() => saveEdit(editingId)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}
            {payGroups.map(p => (
              editingId !== p.payGroupId && (
                <tr key={p.payGroupId}>
                  <td className="read-only-id">{p.payGroupId}</td>
                  <td>{p.name}</td>
                  <td><span className="type-badge">{p.frequency}</span></td>
                  <td>{p.nextRunDate}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-small update" onClick={() => startEdit(p)}>Edit</button>
                    <button className="btn-small delete" onClick={() => { setDeleteId(p.payGroupId); setShowConfirm(true); }}>Delete</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal 
        show={showConfirm} 
        onConfirm={async () => { await axios.delete(`${API_URL}/${deleteId}`); fetchGroups(); setShowConfirm(false); }} 
        onCancel={() => setShowConfirm(false)} 
        message="Are you sure? Deleting a Pay Group can affect employee payroll processing." 
      />
    </div>
  );
}