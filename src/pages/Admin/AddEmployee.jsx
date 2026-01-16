import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createEmployee, getEmployeeById, updateEmployee } from "../../api/employeeApi";
import { getDepartments } from "../../api/departmentApi";
import { getDesignations } from "../../api/designationApi";
import "./AddEmployee.css";

export default function AddEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Custom message state for dismissal box
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contact: "",
    deptId: "",
    designationId: "",
    address: "",
    education: "",
    maritalStatus: "SINGLE",
    isActive: true
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptRes, desigRes] = await Promise.all([getDepartments(), getDesignations()]);
        setDepartments(deptRes.data || deptRes || []);
        setDesignations(desigRes.data || desigRes || []);

        if (isEditMode) {
          const empRes = await getEmployeeById(id);
          const emp = empRes.data;
          
          setFormData({
            firstName: emp.firstName || "",
            lastName: emp.lastName || "",
            email: emp.email || "",
            contact: emp.contact || "",
            deptId: emp.department?.deptId || "",
            designationId: emp.position?.designationId || "",
            address: emp.address || "",
            education: emp.education || "",
            maritalStatus: emp.maritalStatus || "SINGLE",
            isActive: emp.isActive ?? true
          });
        }
      } catch (err) {
        setStatusMsg({ type: "error", text: "Error loading initial data. Please refresh." });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg({ type: "loading", text: isEditMode ? "Updating record..." : "Registering & Sending Email..." });

    const payload = {
      ...formData,
      department: { deptId: parseInt(formData.deptId) },
      position: { designationId: parseInt(formData.designationId) },
      employmentStatus: "FULL_TIME", 
      basicSalary: 0.0, 
    };

    try {
      if (isEditMode) {
        await updateEmployee(id, payload);
        setStatusMsg({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => navigate("/admin/employees"), 2000);
      } else {
        // GENERATE PASSWORD HERE IN FRONTEND
        const tempPassword = "NAST" + Math.floor(1000 + Math.random() * 9000);
        
        // Attach the frontend-generated password to the payload
        const createPayload = { 
            ...payload, 
            password: tempPassword, 
            role: "ROLE_EMPLOYEE" 
        };
        
        // Send this specific password to the backend
        await createEmployee(createPayload);
        
        setStatusMsg({ 
          type: "success", 
          text: `Account created! Credentials (Pass: ${tempPassword}) sent to ${formData.email}.` 
        });
        
        setTimeout(() => navigate("/admin/employees"), 4000);
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || "Check connection or mandatory fields.";
      setStatusMsg({ type: "error", text: serverMsg });
    }
  };
  if (loading) return <div className="loader">Preparing employee profile...</div>;

  return (
    <div className="registration-canvas">
      <div className="form-card">
        
        {/* DISMISSAL MESSAGE BOX */}
        {statusMsg.text && (
          <div className={`status-box ${statusMsg.type}`}>
            <span>{statusMsg.text}</span>
            <button className="close-btn" type="button" onClick={() => setStatusMsg({ type: "", text: "" })}>×</button>
          </div>
        )}

        <header className="form-header">
          <h3>{isEditMode ? "Edit Employee Profile" : "Employee Registration"}</h3>
          <p>{isEditMode ? "Modify existing employee details." : "Register a new employee and send login credentials."}</p>
        </header>

        <form onSubmit={handleSubmit} className="compact-grid-form">
          <div className="input-group">
            <label>First Name</label>
            <input 
              required 
              value={formData.firstName} 
              onChange={e => setFormData({...formData, firstName: e.target.value})} 
            />
          </div>

          <div className="input-group">
            <label>Last Name</label>
            <input 
              required 
              value={formData.lastName} 
              onChange={e => setFormData({...formData, lastName: e.target.value})} 
            />
          </div>

          <div className="input-group">
            <label>Email (Login ID)</label>
            <input 
              type="email" 
              required 
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>

          <div className="input-group">
            <label>Contact Number</label>
            <input 
              required 
              value={formData.contact} 
              onChange={e => setFormData({...formData, contact: e.target.value})} 
              pattern="[0-9]{10}"
            />
          </div>
          
          <div className="input-group">
            <label>Department</label>
            <select 
              required 
              value={formData.deptId} 
              onChange={e => setFormData({...formData, deptId: e.target.value})}
            >
              <option value="">-- Select --</option>
              {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Designation</label>
            <select 
              required 
              value={formData.designationId} 
              onChange={e => setFormData({...formData, designationId: e.target.value})}
            >
              <option value="">-- Select --</option>
              {designations.map(d => <option key={d.designationId} value={d.designationId}>{d.designationTitle}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Marital Status</label>
            <select 
              required 
              value={formData.maritalStatus} 
              onChange={e => setFormData({...formData, maritalStatus: e.target.value})}
            >
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
            </select>
          </div>

          <div className="input-group">
            <label>Education</label>
            <input 
              required 
              value={formData.education} 
              onChange={e => setFormData({...formData, education: e.target.value})} 
            />
          </div>

          <div className="input-group full-width">
            <label>Address</label>
            <textarea 
              required 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})} 
            />
          </div>

          <div className="form-footer">
            <button 
              type="submit" 
              className="btn-register" 
              disabled={statusMsg.type === "loading"}
            >
              {isEditMode ? "Save Changes" : "Register & Send Email"}
            </button>
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={() => navigate("/admin/employees")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}