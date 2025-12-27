import React, { useEffect, useState } from "react";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "../../../api/departmentApi";
import ConfirmModal from "../../../components/ConfirmModal";
import "./Departments.css";

function MessageModal({ show, type, message, onClose }) {
  if (!show) return null;
  return (
    <div className="message-modal-backdrop">
      <div className={`message-modal ${type}`}>
        <p>{message}</p>
        <button onClick={onClose}>Dismiss</button>
      </div>
    </div>
  );
}

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ deptName: "" });
  const [addingNew, setAddingNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [messageData, setMessageData] = useState({ show: false, type: "", message: "" });

  useEffect(() => { fetchDepartments(); }, []);

  const fetchDepartments = async () => {
    try {
      const data = await getDepartments();
      setDepartments(data || []);
    } catch (err) {
      showMessage("error", "Failed to connect to backend server");
    }
  };

  const showMessage = (type, message) => setMessageData({ show: true, type, message });
  const closeMessage = () => setMessageData({ show: false, type: "", message: "" });

  const startEdit = (dept) => {
    setEditingId(dept.deptId);
    setAddingNew(false);
    setFormData({ deptName: dept.deptName });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ deptName: "" });
  };

  const saveEdit = async (id) => {
    if (!formData.deptName.trim()) {
      showMessage("error", "Department name is required");
      return;
    }
    try {
      if (addingNew) {
        await createDepartment({ deptName: formData.deptName });
        showMessage("success", "Department Created!");
      } else {
        await updateDepartment(id, { deptName: formData.deptName });
        showMessage("success", "Department Updated!");
      }
      fetchDepartments();
      cancelEdit();
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Operation failed");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteDepartment(deleteId);
      showMessage("success", "Deleted successfully");
      fetchDepartments();
    } catch {
      showMessage("error", "Cannot delete: Department might be in use");
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="org-section dept-theme">
      <MessageModal {...messageData} onClose={closeMessage} />
      <div className="section-header">
        <h3>Departments</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); setFormData({deptName: ""}); }}>
          + Add Department
        </button>
      </div>

      <div className="table-wrapper">
        <table className="org-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Department Name</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {addingNew && (
              <tr className="adding-row">
                <td>New</td>
                <td>
                  <input autoFocus value={formData.deptName} onChange={(e) => setFormData({deptName: e.target.value})} />
                </td>
                <td className="actions-col">
                  <button className="btn-small save" onClick={() => saveEdit(null)}>Save</button>
                  <button className="btn-small cancel" onClick={cancelEdit}>Cancel</button>
                </td>
              </tr>
            )}
            {departments.map((dept) => (
              <tr key={dept.deptId}>
                <td>{dept.deptId}</td>
                <td>
                  {editingId === dept.deptId ? (
                    <input value={formData.deptName} onChange={(e) => setFormData({deptName: e.target.value})} />
                  ) : (
                    dept.deptName
                  )}
                </td>
                <td className="actions-col">
                  {editingId === dept.deptId ? (
                    <>
                      <button className="btn-small save" onClick={() => saveEdit(dept.deptId)}>Save</button>
                      <button className="btn-small cancel" onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small update" onClick={() => startEdit(dept)}>Update</button>
                      <button className="btn-small delete" onClick={() => { setDeleteId(dept.deptId); setShowConfirm(true); }}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal show={showConfirm} onConfirm={confirmDelete} onCancel={() => setShowConfirm(false)} message="Are you sure you want to delete this department?" />
    </div>
  );
}