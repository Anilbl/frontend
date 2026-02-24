import React, { useEffect, useState } from "react";
import api from "../../../api/axios"; // centralized axios instance
import ConfirmModal from "../../../components/ConfirmModal";
import "./PayrollConfig.css";

export default function SalaryComponents() {
  const [components, setComponents] = useState([]);
  const [types, setTypes] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

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
      setComponents([]);
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

  // Pagination Logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = components.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(components.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const startEdit = (item) => {
    setEditingId(item.componentId);
    setAddingNew(false);
    setFormData({
      componentName: item.componentName || "",
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
              {/* Type Column Removed */}
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
                  {/* Hidden type selector needed for payload even if column is hidden */}
                  <div style={{fontSize: '10px', marginTop: '5px'}}>
                    <select
                      value={formData.componentTypeId}
                      onChange={(e) =>
                        setFormData({ ...formData, componentTypeId: e.target.value })
                      }
                    >
                      <option value="">Select Category</option>
                      {types.map((t) => (
                        <option key={t.componentTypeId} value={t.componentTypeId}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
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

            {currentRecords.map((c) => (
              <tr key={c.componentId}>
                <td>{c.componentId}</td>
                <td>
                  {editingId === c.componentId ? (
                    <>
                      <input
                        value={formData.componentName}
                        onChange={(e) =>
                          setFormData({ ...formData, componentName: e.target.value })
                        }
                      />
                      <select
                        style={{display: 'block', marginTop: '5px', fontSize: '11px'}}
                        value={formData.componentTypeId}
                        onChange={(e) =>
                          setFormData({ ...formData, componentTypeId: e.target.value })
                        }
                      >
                        {types.map((t) => (
                          <option key={t.componentTypeId} value={t.componentTypeId}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : (
                    c.componentName || "N/A"
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
                  )}
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

      {/* Pagination Controls */}
      {components.length > recordsPerPage && (
        <div className="pagination-bar" style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '5px' }}>
          <button 
            disabled={currentPage === 1} 
            onClick={() => paginate(currentPage - 1)}
            className="btn-small"
          >
            Prev
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              style={{
                backgroundColor: currentPage === index + 1 ? '#4a90e2' : '#f4f4f4',
                color: currentPage === index + 1 ? 'white' : 'black',
                border: '1px solid #ddd',
                padding: '5px 10px',
                cursor: 'pointer'
              }}
            >
              {index + 1}
            </button>
          ))}
          <button 
            disabled={currentPage === totalPages} 
            onClick={() => paginate(currentPage + 1)}
            className="btn-small"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmModal
        show={showConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        message="Delete this component? This may affect payroll calculations."
      />
    </div>
  );
}