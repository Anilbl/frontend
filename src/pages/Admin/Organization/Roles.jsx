import React, { useEffect, useState } from "react";
import { getRoles, createRole, updateRole, deleteRole } from "../../../api/roleApi";
import ConfirmModal from "../../../components/ConfirmModal";
import "./Roles.css";

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

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ roleName: "" });
  const [addingNew, setAddingNew] = useState(false);
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [messageData, setMessageData] = useState({ show: false, type: "", message: "" });

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      showMessage("error", "Failed to connect to Role database");
    }
  };

  const showMessage = (type, message) => setMessageData({ show: true, type, message });
  const closeMessage = () => setMessageData({ show: false, type: "", message: "" });

  const startEdit = (role) => {
    setEditingId(role.roleId);
    setAddingNew(false);
    setFormData({ roleName: role.roleName });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({ roleName: "" });
  };

  const saveEdit = async (id) => {
    if (!formData.roleName.trim()) {
      showMessage("error", "Role name is required");
      return;
    }
    try {
      const payload = { roleName: formData.roleName };
      if (addingNew) {
        await createRole(payload);
        showMessage("success", "Role Created!");
      } else {
        await updateRole(id, payload);
        showMessage("success", "Role Updated!");
      }
      fetchRoles();
      cancelEdit();
    } catch (err) {
      showMessage("error", "Action failed: Name might already exist");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteRole(deleteId);
      showMessage("success", "Role Deleted!");
      fetchRoles();
    } catch {
      showMessage("error", "Cannot delete: Role is assigned to users");
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="org-section role-theme">
      <MessageModal {...messageData} onClose={closeMessage} />
      
      <div className="section-header">
        <h3>User Roles</h3>
        <button className="add-btn" onClick={() => { setAddingNew(true); setEditingId(null); setFormData({roleName: ""}); }}>
          + Add New Role
        </button>
      </div>

      <div className="table-wrapper">
        <table className="org-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>ID</th>
              <th>Role Name</th>
              <th style={{ textAlign: 'center', width: '25%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {addingNew && (
              <tr className="adding-row">
                <td>New</td>
                <td>
                  <input 
                    autoFocus 
                    value={formData.roleName} 
                    onChange={(e) => setFormData({roleName: e.target.value})} 
                    placeholder="E.g. ROLE_ADMIN"
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button className="btn-small save" onClick={() => saveEdit(null)}>Save</button>
                  <button className="btn-small cancel" onClick={cancelEdit}>Cancel</button>
                </td>
              </tr>
            )}
            {roles.map((role) => (
              <tr key={role.roleId}>
                <td>{role.roleId}</td>
                <td>
                  {editingId === role.roleId ? (
                    <input 
                      value={formData.roleName} 
                      onChange={(e) => setFormData({roleName: e.target.value})} 
                    />
                  ) : (
                    role.roleName
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {editingId === role.roleId ? (
                    <>
                      <button className="btn-small save" onClick={() => saveEdit(role.roleId)}>Save</button>
                      <button className="btn-small cancel" onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small update" onClick={() => startEdit(role)}>Update</button>
                      <button className="btn-small delete" onClick={() => { setDeleteId(role.roleId); setShowConfirm(true); }}>Delete</button>
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
        onConfirm={confirmDelete} 
        onCancel={() => setShowConfirm(false)} 
        message="Delete this role? This may affect user permissions."
      />
    </div>
  );
}