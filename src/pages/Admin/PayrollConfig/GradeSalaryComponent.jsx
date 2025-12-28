import React, { useEffect, useState } from "react";
import axios from "axios";
import ConfirmModal from "../../../components/ConfirmModal";
import "./PayrollConfig.css";

export default function GradeSalaryComponent() {
  const [data, setData] = useState([]);
  const [grades, setGrades] = useState([]);
  const [components, setComponents] = useState([]);
  
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  
  const [formData, setFormData] = useState({
    grade: { gradeId: "" },
    component: { componentId: "" },
    value: 0
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_URL = "http://localhost:8080/api/grade-salary-components";

  useEffect(() => {
    fetchMainData();
    fetchDropdowns();
  }, []);

  const fetchMainData = async () => {
    try {
      const res = await axios.get(API_URL);
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Error fetching assignments"); }
  };

  const fetchDropdowns = async () => {
    try {
      const gRes = await axios.get("http://localhost:8080/api/salary-grades");
      const cRes = await axios.get("http://localhost:8080/api/salary-components");
      setGrades(gRes.data);
      setComponents(cRes.data);
    } catch (err) { console.error("Error fetching dropdown data"); }
  };

  const startEdit = (item) => {
    setEditingId(item.gscId);
    setAddingNew(false);
    setFormData({
      grade: { gradeId: item.grade.gradeId },
      component: { componentId: item.component.componentId },
      value: item.value
    });
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ grade: { gradeId: "" }, component: { componentId: "" }, value: 0 });
  };

  const saveAction = async (id) => {
    if (!formData.grade.gradeId || !formData.component.componentId) return;
    try {
      if (addingNew) {
        await axios.post(API_URL, formData);
      } else {
        await axios.put(`${API_URL}/${id}`, formData);
      }
      fetchMainData();
      cancel();
    } catch (err) { alert("Save failed. Ensure selection is valid."); }
  };

  return (
    <div className="org-section payroll-theme-main full-width-table">
      <div className="section-header">
        <h3>Grade Salary Assignments</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); }}>
          + Assign Component
        </button>
      </div>

      <div className="table-wrapper">
        <table className="org-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>ID</th>
              <th>Grade</th>
              <th>Component</th>
              <th>Value</th>
              <th style={{ textAlign: 'center', width: '20%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Adding Row */}
            {addingNew && (
              <tr className="adding-row">
                <td className="read-only-id">New</td>
                <td>
                  <select value={formData.grade.gradeId} onChange={e => setFormData({...formData, grade: {gradeId: e.target.value}})}>
                    <option value="">Select Grade</option>
                    {grades.map(g => <option key={g.gradeId} value={g.gradeId}>{g.gradeName}</option>)}
                  </select>
                </td>
                <td>
                  <select value={formData.component.componentId} onChange={e => setFormData({...formData, component: {componentId: e.target.value}})}>
                    <option value="">Select Component</option>
                    {components.map(c => <option key={c.componentId} value={c.componentId}>{c.componentName}</option>)}
                  </select>
                </td>
                <td><input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} /></td>
                <td>
                  <button className="btn-small save" onClick={() => saveAction(null)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}

            {/* Existing Rows */}
            {data.map(item => (
              <tr key={item.gscId}>
                <td className="read-only-id">{item.gscId}</td>
                <td>
                  {editingId === item.gscId ? (
                    <select value={formData.grade.gradeId} onChange={e => setFormData({...formData, grade: {gradeId: e.target.value}})}>
                      {grades.map(g => <option key={g.gradeId} value={g.gradeId}>{g.gradeName}</option>)}
                    </select>
                  ) : item.grade.gradeName}
                </td>
                <td>
                  {editingId === item.gscId ? (
                    <select value={formData.component.componentId} onChange={e => setFormData({...formData, component: {componentId: e.target.value}})}>
                      {components.map(c => <option key={c.componentId} value={c.componentId}>{c.componentName}</option>)}
                    </select>
                  ) : item.component.componentName}
                </td>
                <td>
                  {editingId === item.gscId ? (
                    <input type="number" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} />
                  ) : <strong>{item.value}</strong>}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {editingId === item.gscId ? (
                    <><button className="btn-small save" onClick={() => saveAction(item.gscId)}>Save</button>
                    <button className="btn-small cancel" onClick={cancel}>Cancel</button></>
                  ) : (
                    <><button className="btn-small update" onClick={() => startEdit(item)}>Edit</button>
                    <button className="btn-small delete" onClick={() => { setDeleteId(item.gscId); setShowConfirm(true); }}>Delete</button></>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        show={showConfirm} 
        onConfirm={async () => { await axios.delete(`${API_URL}/${deleteId}`); fetchMainData(); setShowConfirm(false); }} 
        onCancel={() => setShowConfirm(false)} 
        message="Remove this salary assignment?"
      />
    </div>
  );
}