import React, { useEffect, useState } from "react";
import { getLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from "../../../api/leaveTypeApi";
import ConfirmModal from "../../../components/ConfirmModal";
import "./LeaveType.css";

export default function LeaveType() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({ typeName: "", defaultDaysPerYear: "", paid: true });
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { fetchLeaveTypes(); }, []);

  const fetchLeaveTypes = async () => {
    try {
      const data = await getLeaveTypes();
      setLeaveTypes(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Database connection failed"); }
  };

  const startEdit = (lt) => {
    setEditingId(lt.leaveTypeId);
    setAddingNew(false);
    setFormData({ typeName: lt.typeName, defaultDaysPerYear: lt.defaultDaysPerYear, paid: lt.paid });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ typeName: "", defaultDaysPerYear: "", paid: true });
  };

  const saveEdit = async (id) => {
    if (!formData.typeName.trim() || !formData.defaultDaysPerYear) return;
    try {
      if (addingNew) {
        await createLeaveType(formData);
      } else {
        await updateLeaveType(id, formData);
      }
      fetchLeaveTypes();
      cancelEdit();
    } catch (err) { alert("Action failed"); }
  };

  return (
    <div className="org-section leave-theme">
      <div className="section-header">
        <h3>Leave Types</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); setFormData({typeName: "", defaultDaysPerYear: "", paid: true}); }}>
          + Add Type
        </button>
      </div>

      <div className="table-wrapper">
        <table className="org-table">
          <thead>
            <tr>
              <th style={{ width: '10%' }}>ID</th>
              <th>Name</th>
              <th style={{ width: '15%' }}>Days</th>
              <th style={{ width: '15%' }}>Paid</th>
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
                    value={formData.typeName} 
                    onChange={e => setFormData({...formData, typeName: e.target.value})} 
                    placeholder="E.g. Sick Leave" 
                  />
                </td>
                <td>
                  <input 
                    type="number" 
                    value={formData.defaultDaysPerYear} 
                    onChange={e => setFormData({...formData, defaultDaysPerYear: e.target.value})} 
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.paid} 
                    onChange={e => setFormData({...formData, paid: e.target.checked})} 
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn-small save" onClick={() => saveEdit(null)}>Save</button>
                  <button className="btn-small cancel" onClick={cancelEdit}>Cancel</button>
                </td>
              </tr>
            )}

            {/* List Rows */}
            {leaveTypes.map((lt) => (
              <tr key={lt.leaveTypeId}>
                <td className="read-only-id">{lt.leaveTypeId}</td>
                <td>
                  {editingId === lt.leaveTypeId ? (
                    <input 
                      value={formData.typeName} 
                      onChange={e => setFormData({...formData, typeName: e.target.value})} 
                    />
                  ) : (
                    lt.typeName
                  )}
                </td>
                <td>
                  {editingId === lt.leaveTypeId ? (
                    <input 
                      type="number" 
                      value={formData.defaultDaysPerYear} 
                      onChange={e => setFormData({...formData, defaultDaysPerYear: e.target.value})} 
                    />
                  ) : (
                    lt.defaultDaysPerYear
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {editingId === lt.leaveTypeId ? (
                    <input 
                      type="checkbox" 
                      checked={formData.paid} 
                      onChange={e => setFormData({...formData, paid: e.target.checked})} 
                    />
                  ) : (
                    lt.paid ? "✅" : "❌"
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {editingId === lt.leaveTypeId ? (
                    <>
                      <button className="btn-small save" onClick={() => saveEdit(lt.leaveTypeId)}>Save</button>
                      <button className="btn-small cancel" onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small update" onClick={() => startEdit(lt)}>Update</button>
                      <button className="btn-small delete" onClick={() => { setDeleteId(lt.leaveTypeId); setShowConfirm(true); }}>Delete</button>
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
        onConfirm={async () => { await deleteLeaveType(deleteId); fetchLeaveTypes(); setShowConfirm(false); }} 
        onCancel={() => setShowConfirm(false)} 
        message="Are you sure you want to delete this leave type?"
      />
    </div>
  );
}