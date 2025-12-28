import React, { useEffect, useState } from "react";
import axios from "axios";
import ConfirmModal from "../../../components/ConfirmModal";

export default function TaxSlabs() {
  const [slabs, setSlabs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    name: "", minAmount: 0, maxAmount: 0, ratePercentage: 0,
    effectiveFrom: "", effectiveTo: "", description: ""
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_URL = "http://localhost:8080/api/tax-slabs";

  useEffect(() => { fetchSlabs(); }, []);

  const fetchSlabs = async () => {
    try {
      const res = await axios.get(API_URL);
      setSlabs(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error("Fetch failed"); }
  };

  const saveAction = async (id) => {
    try {
      if (addingNew) await axios.post(API_URL, formData);
      else await axios.put(`${API_URL}/${id}`, formData);
      fetchSlabs();
      cancel();
    } catch (err) { alert("Save failed"); }
  };

  const cancel = () => { 
    setEditingId(null); 
    setAddingNew(false); 
    setFormData({ name: "", minAmount: 0, maxAmount: 0, ratePercentage: 0, effectiveFrom: "", effectiveTo: "", description: "" }); 
  };

  return (
    <div className="org-section tax-theme">
      <div className="section-header">
        <h3>Tax Slabs</h3>
        <button className="add-btn" onClick={() => {setAddingNew(true); setEditingId(null);}}>+ Add Slab</button>
      </div>
      {/* Horizontal Scroll Wrapper */}
      <div className="table-scroll-container">
        <table className="org-table small-text">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name/Range</th>
              <th>Rate %</th>
              <th>Effective Period</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(addingNew || editingId) && (
              <tr className="editing-row">
                <td className="read-only-id">{editingId || "New"}</td>
                <td>
                  <input placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  <div className="flex-inputs">
                    <input type="number" placeholder="Min" value={formData.minAmount} onChange={e => setFormData({...formData, minAmount: e.target.value})} />
                    <input type="number" placeholder="Max" value={formData.maxAmount} onChange={e => setFormData({...formData, maxAmount: e.target.value})} />
                  </div>
                </td>
                <td><input type="number" value={formData.ratePercentage} onChange={e => setFormData({...formData, ratePercentage: e.target.value})} /></td>
                <td>
                  <input type="date" value={formData.effectiveFrom} onChange={e => setFormData({...formData, effectiveFrom: e.target.value})} />
                  <input type="date" value={formData.effectiveTo} onChange={e => setFormData({...formData, effectiveTo: e.target.value})} />
                </td>
                <td>
                  <button className="btn-small save" onClick={() => saveAction(editingId)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}
            {slabs.map(s => (
              editingId !== s.taxSlabId && (
                <tr key={s.taxSlabId}>
                  <td className="read-only-id">{s.taxSlabId}</td>
                  <td>
                    <strong>{s.name}</strong><br/>
                    <small>{s.minAmount} - {s.maxAmount}</small>
                  </td>
                  <td>{s.ratePercentage}%</td>
                  <td><small>{s.effectiveFrom} to {s.effectiveTo}</small></td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="btn-small update" onClick={() => {setEditingId(s.taxSlabId); setFormData(s);}}>Edit</button>
                    <button className="btn-small delete" onClick={() => {setDeleteId(s.taxSlabId); setShowConfirm(true);}}>Delete</button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmModal show={showConfirm} onConfirm={async () => {await axios.delete(`${API_URL}/${deleteId}`); fetchSlabs(); setShowConfirm(false);}} onCancel={() => setShowConfirm(false)} message="Delete tax slab?" />
    </div>
  );
}