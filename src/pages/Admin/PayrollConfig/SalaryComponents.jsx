import React, { useEffect, useState } from "react";
import axios from "axios";
import ConfirmModal from "../../../components/ConfirmModal";
import "./PayrollConfig.css";

export default function SalaryComponents() {
  const [components, setComponents] = useState([]);
  const [types, setTypes] = useState([]); // For the dropdown
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  
  const [formData, setFormData] = useState({
    componentName: "",
    componentType: { componentTypeId: "" },
    calculationMethod: "fixed",
    defaultValue: 0,
    description: "",
    required: false
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_URL = "http://localhost:8080/api/salary-components";
  const TYPES_API = "http://localhost:8080/api/salary-component-types";

  useEffect(() => {
    fetchComponents();
    fetchTypes();
  }, []);

  const fetchComponents = async () => {
    try {
      const res = await axios.get(API_URL);
      setComponents(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Failed to fetch components"); }
  };

  const fetchTypes = async () => {
    try {
      const res = await axios.get(TYPES_API);
      setTypes(res.data);
    } catch (err) { console.error("Failed to fetch types"); }
  };

  const startEdit = (c) => {
    setEditingId(c.componentId);
    setAddingNew(false);
    setFormData({
      componentName: c.componentName,
      componentType: { componentTypeId: c.componentType.componentTypeId },
      calculationMethod: c.calculationMethod,
      defaultValue: c.defaultValue,
      description: c.description,
      required: c.required
    });
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ componentName: "", componentType: { componentTypeId: "" }, calculationMethod: "fixed", defaultValue: 0, description: "", required: false });
  };

  const saveEdit = async (id) => {
    if (!formData.componentName || !formData.componentType.componentTypeId) {
      alert("Name and Type are required");
      return;
    }
    try {
      if (addingNew) await axios.post(API_URL, formData);
      else await axios.put(`${API_URL}/${id}`, formData);
      fetchComponents();
      cancel();
    } catch (err) { alert("Action failed. Check if backend is running."); }
  };

  return (
    <div className="org-section payroll-theme-main">
      <div className="section-header">
        <h3>Salary Components</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); }}>+ Add Component</button>
      </div>

      <div className="table-wrapper">
        <table className="org-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Method</th>
              <th>Value</th>
              <th style={{ textAlign: 'center', width: '20%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(addingNew || editingId) && (
              <tr className="editing-row">
                <td className="read-only-id">{editingId || "New"}</td>
                <td><input value={formData.componentName} onChange={e => setFormData({...formData, componentName: e.target.value})} placeholder="Basic" /></td>
                <td>
                  <select 
                    value={formData.componentType.componentTypeId} 
                    onChange={e => setFormData({...formData, componentType: { componentTypeId: e.target.value }})}
                  >
                    <option value="">Select Type</option>
                    {types.map(t => <option key={t.componentTypeId} value={t.componentTypeId}>{t.name}</option>)}
                  </select>
                </td>
                <td>
                  <select value={formData.calculationMethod} onChange={e => setFormData({...formData, calculationMethod: e.target.value})}>
                    <option value="fixed">Fixed</option>
                    <option value="percentage_of_basic">% of Basic</option>
                    <option value="formula">Formula</option>
                  </select>
                </td>
                <td><input type="number" value={formData.defaultValue} onChange={e => setFormData({...formData, defaultValue: e.target.value})} /></td>
                <td>
                  <button className="btn-small save" onClick={() => saveEdit(editingId)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}
            {components.map(c => (
              editingId !== c.componentId && (
                <tr key={c.componentId}>
                  <td className="read-only-id">{c.componentId}</td>
                  <td>{c.componentName} {c.required && <span className="req-star">*</span>}</td>
                  <td><span className="type-badge">{c.componentType.name}</span></td>
                  <td>{c.calculationMethod}</td>
                  <td>{c.defaultValue}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-small update" onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn-small delete" onClick={() => { setDeleteId(c.componentId); setShowConfirm(true); }}>Delete</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal show={showConfirm} onConfirm={async () => { await axios.delete(`${API_URL}/${deleteId}`); fetchComponents(); setShowConfirm(false); }} onCancel={() => setShowConfirm(false)} message="Delete this component?" />
    </div>
  );
}