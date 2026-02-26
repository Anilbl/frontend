import React, { useEffect, useState } from "react";
import api from "../../../api/axios"; // Your axios instance
import ConfirmModal from "../../../components/ConfirmModal";

export default function TaxSlabs() {
  const [slabs, setSlabs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  
  // Updated formData to include previousLimit and taxpayerStatus
  const [formData, setFormData] = useState({
    name: "",
    minAmount: 0,
    maxAmount: 0,
    previousLimit: 0, 
    ratePercentage: 0,
    effectiveFrom: "",
    effectiveTo: "",
    description: "",
    taxpayerStatus: "Single", 
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const API_URL = "/tax-slabs";

  useEffect(() => {
    fetchSlabs();
  }, []);

  const fetchSlabs = async () => {
    try {
      const res = await api.get(API_URL);
      setSlabs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch failed:", err.response?.data || err.message);
    }
  };

  const saveAction = async (id) => {
    // 1. Get the current user ID from the session
    const userSession = JSON.parse(localStorage.getItem("user_session") || "{}");
    const userId = userSession.userId || userSession.empId; 

    if (!userId) {
      alert("Session Error: Please log in again to save changes.");
      return;
    }

    try {
      // 2. Append userId as a Query Parameter to match Backend @RequestParam
      if (addingNew) {
        await api.post(`${API_URL}?userId=${userId}`, formData);
      } else {
        await api.put(`${API_URL}/${id}?userId=${userId}`, formData);
      }
      
      fetchSlabs();
      cancel();
    } catch (err) {
      console.error("Save failed:", err.response?.data || err.message);
      alert("Save failed. Make sure all fields are filled correctly.");
    }
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({
      name: "",
      minAmount: 0,
      maxAmount: 0,
      previousLimit: 0,
      ratePercentage: 0,
      effectiveFrom: "",
      effectiveTo: "",
      description: "",
      taxpayerStatus: "Single",
    });
  };

  return (
    <div className="org-section tax-theme">
      <div className="section-header">
        <h3>Tax Slabs Management</h3>
        <button
          className="add-btn"
          onClick={() => {
            setAddingNew(true);
            setEditingId(null);
          }}
        >
          + Add Slab
        </button>
      </div>

      <div className="table-scroll-container">
        <table className="org-table small-text">
          <thead>
            <tr>
              <th>ID</th>
              <th>Details & Range</th>
              <th>Status</th>
              <th>Rate %</th>
              <th>Effective Period</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(addingNew || editingId) && (
              <tr className="editing-row">
                <td className="read-only-id">{editingId || "New"}</td>
                <td>
                  <input
                    placeholder="Slab Name (e.g. Social Security)"
                    value={formData.name}
                    className="full-width-input"
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <div className="flex-inputs">
                    <input
                      type="number"
                      placeholder="Min"
                      value={formData.minAmount}
                      onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={formData.maxAmount}
                      onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                    />
                  </div>
                  <input
                    placeholder="Description"
                    value={formData.description}
                    style={{marginTop: '5px'}}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </td>
                <td>
                  <select 
                    value={formData.taxpayerStatus}
                    onChange={(e) => setFormData({ ...formData, taxpayerStatus: e.target.value })}
                  >
                    <option value="Single">Single</option>
                    <option value="Couple">Couple</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={formData.ratePercentage}
                    onChange={(e) => setFormData({ ...formData, ratePercentage: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={formData.effectiveFrom}
                    onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                  />
                  <input
                    type="date"
                    value={formData.effectiveTo}
                    onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                  />
                </td>
                <td>
                  <div className="action-btns-vertical">
                    <button className="btn-small save" onClick={() => saveAction(editingId)}>Save</button>
                    <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                  </div>
                </td>
              </tr>
            )}

            {slabs.map((s) => (
              editingId !== s.taxSlabId && (
                <tr key={s.taxSlabId}>
                  <td className="read-only-id">{s.taxSlabId}</td>
                  <td>
                    <strong>{s.name}</strong>
                    <br />
                    <small className="amount-range">
                      {s.minAmount?.toLocaleString()} - {s.maxAmount?.toLocaleString()}
                    </small>
                    <div className="dim-text">{s.description}</div>
                  </td>
                  <td><span className="badge">{s.taxpayerStatus}</span></td>
                  <td className="rate-cell">{s.ratePercentage}%</td>
                  <td>
                    <small>
                      {s.effectiveFrom} <br/> to <br/> {s.effectiveTo}
                    </small>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      className="btn-small update"
                      onClick={() => {
                        setEditingId(s.taxSlabId);
                        setFormData(s);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-small delete"
                      onClick={() => {
                        setDeleteId(s.taxSlabId);
                        setShowConfirm(true);
                      }}
                    >
                      Delete
                    </button>
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
            await api.delete(`${API_URL}/${deleteId}`);
            fetchSlabs();
            setShowConfirm(false);
          } catch (err) {
            alert("Delete failed");
          }
        }}
        onCancel={() => setShowConfirm(false)}
        message="Are you sure you want to delete this tax slab?"
      />
    </div>
  );
}