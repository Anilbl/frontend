import React, { useEffect, useState } from "react";
import axios from "axios";
import ConfirmModal from "../../../components/ConfirmModal";
import "./PayrollConfig.css";

export default function SalaryGrade() {
  const [grades, setGrades] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({ gradeName: "", description: "" });
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_URL = "http://localhost:8080/api/salary-grades";

  useEffect(() => { fetchGrades(); }, []);

  const fetchGrades = async () => {
    try {
      const res = await axios.get(API_URL);
      setGrades(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Grade fetch failed", err); }
  };

  const saveEdit = async (id) => {
    if (!formData.gradeName.trim()) return;
    try {
      if (addingNew) await axios.post(API_URL, formData);
      else await axios.put(`${API_URL}/${id}`, formData);
      fetchGrades();
      cancel();
    } catch (err) { alert("Save failed. Ensure the grade name is valid."); }
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ gradeName: "", description: "" });
  };

  return (
    <div className="org-section payroll-theme-alt">
      <div className="section-header">
        <h3>Salary Grades</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); setFormData({gradeName:"", description:""}); }}>
          + Add Grade
        </button>
      </div>
      <div className="table-wrapper">
        <table className="org-table">
          <thead>
            <tr>
              <th style={{ width: '12%' }}>ID</th>
              <th style={{ width: '30%' }}>Grade Name</th>
              <th>Description</th>
              <th style={{ textAlign: 'center', width: '25%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {addingNew && (
              <tr className="adding-row">
                <td className="read-only-id">New</td>
                <td><input autoFocus value={formData.gradeName} onChange={e => setFormData({...formData, gradeName: e.target.value})} placeholder="e.g. Grade A" /></td>
                <td><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Description" /></td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn-small save" onClick={() => saveEdit(null)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}
            {grades.map(g => (
              <tr key={g.gradeId}>
                <td className="read-only-id">{g.gradeId}</td>
                <td>{editingId === g.gradeId ? <input value={formData.gradeName} onChange={e => setFormData({...formData, gradeName: e.target.value})} /> : g.gradeName}</td>
                <td>{editingId === g.gradeId ? <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /> : g.description}</td>
                <td style={{ textAlign: 'center' }}>
                  {editingId === g.gradeId ? (
                    <><button className="btn-small save" onClick={() => saveEdit(g.gradeId)}>Save</button><button className="btn-small cancel" onClick={cancel}>Cancel</button></>
                  ) : (
                    <><button className="btn-small update" onClick={() => { setEditingId(g.gradeId); setFormData({gradeName: g.gradeName, description: g.description}); }}>Edit</button>
                    <button className="btn-small delete" onClick={() => { setDeleteId(g.gradeId); setShowConfirm(true); }}>Delete</button></>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal show={showConfirm} onConfirm={async () => { await axios.delete(`${API_URL}/${deleteId}`); fetchGrades(); setShowConfirm(false); }} onCancel={() => setShowConfirm(false)} message="Delete this salary grade?" />
    </div>
  );
}