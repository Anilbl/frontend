import React, { useEffect, useState } from "react";
import api from "../../../api/axios"; // centralized axios instance
import ConfirmModal from "../../../components/ConfirmModal";
import "./PayrollConfig.css";

export default function SalaryComponents() {
  const [components, setComponents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    componentName: "",
    componentTypeId: "",
    calculationMethod: "fixed",
    defaultValue: 0,
    description: "",
    required: false,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [types, setTypes] = useState([]); // dropdown for component types

  const API_URL = "/salary-components";
  const TYPE_URL = "/salary-component-types";

  useEffect(() => {
    fetchComponents();
    fetchTypes();
  }, []);

  const fetchComponents = async () => {
    try {
      const res = await api.get(API_URL);
      setComponents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch salary components", err);
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await api.get(TYPE_URL);
      setTypes(res.data || []);
    } catch (err) {
      console.error("Failed to fetch component types", err);
    }
  };

  const startEdit = (c) => {
    setEditingId(c.componentId);
    setAddingNew(false);
    setFormData({
      componentName: c.componentName,
      componentTypeId: c.getComponentTypeId(),
      calculationMethod: c.calculationMethod,
      defaultValue: c.defaultValue,
      description: c.description,
      required: c.required,
    });
  };

  const cancel = () => {
    setEditingId(null);
    setAddingNew(false);
    setFormData({
      componentName: "",
      componentTypeId: "",
      calculationMethod: "fixed",
      defaultValue: 0,
      description: "",
      required: false,
    });
  };

  const saveEdit = async (id) => {
    if (!formData.componentName || !formData.componentTypeId) return;
    try {
      if (addingNew) await api.post(API_URL, formData);
      else await api.put(`${API_URL}/${id}`, formData);
      fetchComponents();
      cancel();
    } catch (err) {
      alert("Save failed. Check data validity.");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`${API_URL}/${deleteId}`);
      fetchComponents();
    } catch {
      alert("Cannot delete: Component may be in use");
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="org-section payroll-theme-main column-half">
      <div className="section-header">
        <h3>Salary Components</h3>
        <button className="add-btn" onClick={() => setAddingNew(true)}>+ Add Component</button>
      </div>

      <div className="table-wrapper">
        <table className="org-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Method</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {addingNew && (
              <tr>
                <td>New</td>
                <td><input autoFocus value={formData.componentName} onChange={e => setFormData({...formData, componentName: e.target.value})} /></td>
                <td>
                  <select value={formData.componentTypeId} onChange={e => setFormData({...formData, componentTypeId: e.target.value})}>
                    <option value="">Select Type</option>
                    {types.map(t => <option key={t.componentTypeId} value={t.componentTypeId}>{t.name}</option>)}
                  </select>
                </td>
                <td>
                  <select value={formData.calculationMethod} onChange={e => setFormData({...formData, calculationMethod: e.target.value})}>
                    <option value="fixed">Fixed</option>
                    <option value="percentage_of_basic">Percentage of Basic</option>
                    <option value="formula">Formula</option>
                  </select>
                </td>
                <td><input type="number" value={formData.defaultValue} onChange={e => setFormData({...formData, defaultValue: e.target.value})} /></td>
                <td><input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></td>
                <td><input type="checkbox" checked={formData.required} onChange={e => setFormData({...formData, required: e.target.checked})} /></td>
                <td>
                  <button className="btn-small save" onClick={() => saveEdit(null)}>Save</button>
                  <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                </td>
              </tr>
            )}

            {components.map(c => (
              <tr key={c.componentId}>
                <td>{c.componentId}</td>
                <td>{editingId === c.componentId ? <input value={formData.componentName} onChange={e => setFormData({...formData, componentName: e.target.value})} /> : c.componentName}</td>
                <td>{editingId === c.componentId ? (
                  <select value={formData.componentTypeId} onChange={e => setFormData({...formData, componentTypeId: e.target.value})}>
                    {types.map(t => <option key={t.componentTypeId} value={t.componentTypeId}>{t.name}</option>)}
                  </select>
                ) : c.componentType?.name}</td>
                <td>{editingId === c.componentId ? (
                  <select value={formData.calculationMethod} onChange={e => setFormData({...formData, calculationMethod: e.target.value})}>
                    <option value="fixed">Fixed</option>
                    <option value="percentage_of_basic">Percentage of Basic</option>
                    <option value="formula">Formula</option>
                  </select>
                ) : c.calculationMethod}</td>
                <td>{editingId === c.componentId ? <input type="number" value={formData.defaultValue} onChange={e => setFormData({...formData, defaultValue: e.target.value})} /> : c.defaultValue}</td>
                <td>{editingId === c.componentId ? <input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /> : c.description}</td>
                <td>{editingId === c.componentId ? <input type="checkbox" checked={formData.required} onChange={e => setFormData({...formData, required: e.target.checked})} /> : (c.required ? "✅" : "❌")}</td>
                <td>
                  {editingId === c.componentId ? (
                    <>
                      <button className="btn-small save" onClick={() => saveEdit(c.componentId)}>Save</button>
                      <button className="btn-small cancel" onClick={cancel}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small update" onClick={() => startEdit(c)}>Edit</button>
                      <button className="btn-small delete" onClick={() => { setDeleteId(c.componentId); setShowConfirm(true); }}>Delete</button>
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
        message="Are you sure? Deleting a component may affect payroll calculations."
      />
    </div>
  );
}
