import React, { useEffect, useState } from "react";
import axios from "axios";
import ConfirmModal from "../../../components/ConfirmModal";

export default function DeductionHeads() {
  const [heads, setHeads] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: "", defaultRate: 0, isPercentage: true, statutory: true, description: ""
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_URL = "http://localhost:8080/api/deduction-heads";

  useEffect(() => { fetchHeads(); }, []);

  const fetchHeads = async () => {
    try {
      const res = await axios.get(API_URL);
      setHeads(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Fetch failed"); }
  };

  const saveAction = async (id) => {
    try {
      if (addingNew) await axios.post(API_URL, formData);
      else await axios.put(`${API_URL}/${id}`, formData);
      fetchHeads();
      cancel();
    } catch (err) { alert("Save failed"); }
  };

  const cancel = () => { 
    setEditingId(null); 
    setAddingNew(false); 
    setFormData({ name: "", defaultRate: 0, isPercentage: true, statutory: true, description: "" }); 
  };

  return (
    <div className="org-section statutory-theme">
      <div className="section-header">
        <h3>Deduction Heads</h3>
        <button className="add-btn" onClick={() => {setAddingNew(true); setEditingId(null);}}>+ Add Head</button>
      </div>
      <div className="table-scroll-container">
        <table className="org-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Head Name</th>
              <th>Rate (%)</th>
              <th>Statutory</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(addingNew || editingId) && (
              <tr className="editing-row">
                <td className="read-only-id">{editingId || "New"}</td>
                <td>
                  <input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <input placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </td>
                <td>
                  <input type="number" value={formData.defaultRate} onChange={e => setFormData({...formData, defaultRate: e.target.value})} />
                  <label><input type="checkbox" checked={formData.isPercentage} onChange={e => setFormData({...formData, isPercentage: e.target.checked})} /> Is %</label>
                </td>
                <td><input type="checkbox" checked={formData.statutory} onChange={e => setFormData({...formData, statutory: e.target.checked})} /> Yes</td>
                <td>
                  <button className="btn-small save" onClick={() => saveAction(editingId)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}
            {heads.map(h => (
              editingId !== h.deductionHeadId && (
                <tr key={h.deductionHeadId}>
                  <td className="read-only-id">{h.deductionHeadId}</td>
                  <td>
                    <strong>{h.name}</strong><br/>
                    <small>{h.description}</small>
                  </td>
                  <td>{h.defaultRate}{h.isPercentage ? '%' : ''}</td>
                  <td>{h.statutory ? "Statutory" : "Optional"}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-small update" onClick={() => {setEditingId(h.deductionHeadId); setFormData(h);}}>Edit</button>
                    <button className="btn-small delete" onClick={() => {setDeleteId(h.deductionHeadId); setShowConfirm(true);}}>Delete</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal show={showConfirm} onConfirm={async () => {await axios.delete(`${API_URL}/${deleteId}`); fetchHeads(); setShowConfirm(false);}} onCancel={() => setShowConfirm(false)} message="Delete deduction head?" />
    </div>
  );
}