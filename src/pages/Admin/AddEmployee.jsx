import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./AddEmployee.css"; // Ensure you create or update this CSS file

const AddEmployee = () => {
  const { id } = useParams(); // Used for Edit Mode
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    address: "",
    education: "",
    maritalStatus: "Single",
    departmentId: "",
    positionId: "",
    isActive: true
  });

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load Departments and Positions for dropdowns
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const deptRes = await axios.get("http://localhost:8080/api/departments");
        const posRes = await axios.get("http://localhost:8080/api/positions");
        setDepartments(deptRes.data);
        setPositions(posRes.data);
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    };

    const fetchEmployeeData = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const res = await axios.get(`http://localhost:8080/api/employees/${id}`);
          const emp = res.data;
          setFormData({
            ...emp,
            departmentId: emp.department?.deptId || "",
            positionId: emp.position?.posId || ""
          });
        } catch (err) {
          setError("Could not load employee details.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMetadata();
    fetchEmployeeData();
  }, [id, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isEditMode) {
        await axios.put(`http://localhost:8080/api/employees/${id}`, formData);
      } else {
        await axios.post("http://localhost:8080/api/employees", formData);
      }
      navigate("/admin/employees"); // Go back to list after success
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save employee.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) return <div className="loader">Loading...</div>;

  return (
    <div className="form-container">
      <header className="form-header">
        <h2>{isEditMode ? "Update Employee" : "Register New Employee"}</h2>
        <button className="back-btn" onClick={() => navigate("/admin/employees")}>
          Back to List
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="employee-form">
        <div className="form-grid">
          <div className="form-group">
            <label>First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="text"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Department</label>
            <select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              required
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.deptId} value={d.deptId}>{d.deptName}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Position</label>
            <select
              name="positionId"
              value={formData.positionId}
              onChange={handleChange}
              required
            >
              <option value="">Select Position</option>
              {positions.map((p) => (
                <option key={p.posId} value={p.posId}>{p.designationTitle}</option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label>Home Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Saving..." : isEditMode ? "Update Record" : "Register Employee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployee;