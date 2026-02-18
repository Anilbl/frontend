import React, { useEffect, useState } from "react";
import api from "../../../api/axios"; // centralized axios instance
import ConfirmModal from "../../../components/ConfirmModal";
import "./PayrollConfig.css";

export default function SalaryComponents() {
  const [components, setComponents] = useState([]);
  const [types, setTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    componentName: "",
    componentTypeId: "",
    calculationMethod: "fixed",
    defaultValue: 0,
    description: "",
    required: false
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const COMPONENT_API = "/salary-components";
  const TYPE_API = "/salary-component-types";

  useEffect(() => {
    fetchComponents();
    fetchTypes();
  }, []);

  const fetchComponents = async () => {
    try {
      const res = await api.get(COMPONENT_API);
      setComponents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching salary components", err);
      setComponents([]); // Set empty array on error to prevent mapping crash
    }
  };

  const fetchTypes = async () => {
    try {
      const res = await api.get(TYPE_API);
      setTypes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching component types", err);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.componentId);
    setAddingNew(false);
    setFormData({
      componentName: item.componentName || "",
      // Optional chaining used here to prevent crash if componentType is missing
      componentTypeId: item.componentType?.componentTypeId || "",
      calculationMethod: item.calculationMethod || "fixed",
      defaultValue: item.defaultValue || 0,
      description: item.description || "",
      required: item.required || false
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
      required: false
    });
  };

  const saveAction = async (id) => {
    if (!formData.componentName || !formData.componentTypeId) {
      alert("Please fill in Component Name and Type.");
      return;
    }
    const payload = {
      ...formData,
      componentType: { componentTypeId: formData.componentTypeId }
    };
    try {
      if (addingNew) await api.post(COMPONENT_API, payload);
      else await api.put(`${COMPONENT_API}/${id}`, payload);
      fetchComponents();
      cancel();
    } catch (err) {
      alert("Save failed. Check input or backend validation.");
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`${COMPONENT_API}/${deleteId}`);
      fetchComponents();
      setShowConfirm(false);
    } catch {
      alert("Cannot delete. Component may be in use.");
      setShowConfirm(false);
    }
  };

  return (
    <div className="org-section payroll-theme-alt column-half">
      <div className="section-header">
        <h3>Salary Components</h3>
        <button
          className="add-btn"
          onClick={() => {
            setAddingNew(true);
            setEditingId(null);
            setFormData({
              componentName: "",
              componentTypeId: "",
              calculationMethod: "fixed",
              defaultValue: 0,
              description: "",
              required: false
            });
          }}
        >
          + Add Component
        </button>
      </div>

      <div className="table-wrapper">
        <table className="org-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Method</th>
              <th>Default</th>
              <th>Description</th>
              <th>Required</th>
              <th style={{ textAlign: "center", width: "20%" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {addingNew && (
              <tr className="adding-row">
                <td>New</td>
                <td>
                  <input
                    autoFocus
                    value={formData.componentName}
                    onChange={(e) =>
                      setFormData({ ...formData, componentName: e.target.value })
                    }
                  />
                </td>
                <td>
                  <select
                    value={formData.componentTypeId}
                    onChange={(e) =>
                      setFormData({ ...formData, componentTypeId: e.target.value })
                    }
                  >
                    <option value="">Select Type</option>
                    {types.map((t) => (
                      <option key={t.componentTypeId} value={t.componentTypeId}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={formData.calculationMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, calculationMethod: e.target.value })
                    }
                  >
                    <option value="fixed">Fixed</option>
                    <option value="percentage_of_basic">Percentage of Basic</option>
                    <option value="formula">Formula</option>
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={formData.defaultValue}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultValue: e.target.value })
                    }
                  />
                </td>
                <td>
                  <input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </td>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) =>
                      setFormData({ ...formData, required: e.target.checked })
                    }
                  />
                </td>
                <td>
                  <button className="btn-small save" onClick={() => saveAction(null)}>
                    Save
                  </button>
                  <button className="btn-small cancel" onClick={cancel}>
                    Cancel
                  </button>
                </td>
              </tr>
            )}

            {components.map((c) => (
              <tr key={c.componentId}>
                <td>{c.componentId}</td>
                <td>
                  {editingId === c.componentId ? (
                    <input
                      value={formData.componentName}
                      onChange={(e) =>
                        setFormData({ ...formData, componentName: e.target.value })
                      }
                    />
                  ) : (
                    c.componentName || "N/A"
                  )}
                </td>
                <td>
                  {editingId === c.componentId ? (
                    <select
                      value={formData.componentTypeId}
                      onChange={(e) =>
                        setFormData({ ...formData, componentTypeId: e.target.value })
                      }
                    >
                      <option value="">Select Type</option>
                      {types.map((t) => (
                        <option key={t.componentTypeId} value={t.componentTypeId}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    // CRITICAL FIX: Optional chaining to prevent "reading name of undefined"
                    c.componentType?.name || "N/A"
                  )}
                </td>
                <td>
                  {editingId === c.componentId ? (
                    <select
                      value={formData.calculationMethod}
                      onChange={(e) =>
                        setFormData({ ...formData, calculationMethod: e.target.value })
                      }
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percentage_of_basic">Percentage of Basic</option>
                      <option value="formula">Formula</option>
                    </select>
                  ) : (
                    c.calculationMethod
                  )}
                </td>
                <td>
                  {editingId === c.componentId ? (
                    <input
                      type="number"
                      value={formData.defaultValue}
                      onChange={(e) =>
                        setFormData({ ...formData, defaultValue: e.target.value })
                      }
                    />
                  ) : (
                    c.defaultValue
                  )}
                </td>
                <td>
                  {editingId === c.componentId ? (
                    <input
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                  ) : (
                    c.description || ""
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  {editingId === c.componentId ? (
                    <input
                      type="checkbox"
                      checked={formData.required}
                      onChange={(e) =>
                        setFormData({ ...formData, required: e.target.checked })
                      }
                    />
                  ) : c.required ? (
                    "✅"
                  ) : (
                    "❌"
                  ) }
                </td>
                <td style={{ textAlign: "center" }}>
                  {editingId === c.componentId ? (
                    <>
                      <button className="btn-small save" onClick={() => saveAction(c.componentId)}>
                        Save
                      </button>
                      <button className="btn-small cancel" onClick={cancel}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn-small update" onClick={() => startEdit(c)}>
                        Edit
                      </button>
                      <button
                        className="btn-small delete"
                        onClick={() => {
                          setDeleteId(c.componentId);
                          setShowConfirm(true);
                        }}
                      >
                        Delete
                      </button>
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
        message="Delete this component? This may affect payroll calculations."
      />
    </div>
  );
}