import React, { useEffect, useState } from "react";
import axios from "axios";
import ConfirmModal from "../../../components/ConfirmModal";
import "./PayrollConfig.css";

export default function SalaryComponentType() {
  const [types, setTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_URL = "http://localhost:8080/api/salary-component-types";

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await axios.get(API_URL);
      setTypes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch salary component types", err);
    }
  };

  const startEdit = (type) => {
    setEditingId(type.componentTypeId);
    setAddingNew(false);
    setFormData({ name: type.name, description: type.description });
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ name: "", description: "" });
  };

  const saveEdit = async (id) => {
    if (!formData.name.trim()) return;
    try {
      if (addingNew) {
        await axios.post(API_URL, formData);
      } else {
        await axios.put(`${API_URL}/${id}`, formData);
      }
      fetchTypes();
      cancel();
    } catch (err) {
      alert("Error saving component type. Ensure name is unique.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/${deleteId}`);
      fetchTypes();
      setShowConfirm(false);
    } catch (err) {
      alert("Cannot delete: Type might be in use by Salary Components.");
      setShowConfirm(false);
    }
  };

  return (
    <div className="org-section payroll-theme-alt">
      <div className="section-header">
        <h3>Component Types</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); setFormData({name:"", description:""}); }}>
          + Add Type
        </button>
      </div>

      <div className="table-wrapper">
        <table className="org-table">
          <thead>
            <tr>
              <th style={{ width: '12%' }}>ID</th>
              <th style={{ width: '30%' }}>Name</th>
              <th>Description</th>
              <th style={{ textAlign: 'center', width: '25%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Adding New Row */}
            {addingNew && (
              <tr className="adding-row">
                <td className="read-only-id">New</td>
                <td>
                  <input 
                    autoFocus
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. Allowance"
                  />
                </td>
                <td>
                  <input 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    placeholder="Short description..."
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn-small save" onClick={() => saveEdit(null)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}

            {/* Existing Data Rows */}
            {types.map((type) => (
              <tr key={type.componentTypeId}>
                <td className="read-only-id">{type.componentTypeId}</td>
                <td>
                  {editingId === type.componentTypeId ? (
                    <input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  ) : (
                    type.name
                  )}
                </td>
                <td>
                  {editingId === type.componentTypeId ? (
                    <input 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                    />
                  ) : (
                    type.description
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {editingId === type.componentTypeId ? (
                    <>
                      <button className="btn-small save" onClick={() => saveEdit(type.componentTypeId)}>Save</button>
                      <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small update" onClick={() => startEdit(type)}>Edit</button>
                      <button className="btn-small delete" onClick={() => { setDeleteId(type.componentTypeId); setShowConfirm(true); }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        show={showConfirm} 
        onConfirm={handleDelete} 
        onCancel={() => setShowConfirm(false)} 
        message="Are you sure? This will remove this classification type."
      />
    </div>
  );
}