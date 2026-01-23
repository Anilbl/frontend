import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios"; 
import { getEmployeeById, createEmployee, updateEmployee } from "../../api/employeeApi"; 
import "./AddEmployee.css"; 

const AddEmployee = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    firstName: "", 
    lastName: "", 
    email: "", 
    contact: "", 
    address: "",
    education: "", 
    maritalStatus: "SINGLE", 
    departmentId: "",
    positionId: "", 
    isActive: true, 
    basicSalary: 0,
    joiningDate: new Date().toISOString().split('T')[0]
  });

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const loadInit = async () => {
      try {
        const [d, p] = await Promise.all([api.get("/departments"), api.get("/designations")]);
        setDepartments(d.data); 
        setPositions(p.data);
        
        if (isEditMode) {
          const res = await getEmployeeById(id);
          const u = res.data || res;
          setFormData({
            ...u, 
            departmentId: u.department?.deptId || "", 
            positionId: u.position?.designationId || ""
          });
        }
      } catch (e) { 
        console.error("Initialization error:", e); 
      }
    };
    loadInit();
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // 10-Digit Contact Validation
    if (!/^\d{10}$/.test(formData.contact)) {
      setErrorMsg("Contact number must be exactly 10 digits.");
      setLoading(false);
      return;
    }

    try {
      // Step 1: Verification Logic
      const userRes = await api.get(`/users/search?email=${formData.email}`);
      const userData = userRes.data;
      const foundUser = Array.isArray(userData) ? userData[0] : userData;

      if (!foundUser || !foundUser.userId) {
        setErrorMsg("Email not found in User database. Create User account first.");
        setLoading(false);
        return;
      }
      
      const payload = { 
        ...formData, 
        user: { userId: foundUser.userId }, 
        department: { deptId: parseInt(formData.departmentId) }, 
        position: { designationId: parseInt(formData.positionId) } 
      };

      // Step 2: Save Data
      isEditMode ? await updateEmployee(id, payload) : await createEmployee(payload);
      
      // Step 3: Success Feedback
      setSuccessMsg(isEditMode ? "Employee updated successfully!" : "Employee registered successfully!");
      
      setTimeout(() => {
        navigate("/admin/employees");
      }, 2000); 

    } catch (err) { 
      setErrorMsg(err.response?.data?.message || "Operation failed. Verify database connectivity.");
      setLoading(false); 
    }
  };

  return (
    <div className="app-canvas compact-form-view">
      <div className="form-container">
        <header className="form-header">
          <h3>{isEditMode ? "✎ Edit Employee" : "✚ New Employee"}</h3>
        </header>

        {errorMsg && <div className="error-banner">{errorMsg}</div>}
        {successMsg && <div className="success-banner">{successMsg}</div>}

        <form onSubmit={handleSubmit} className={`compact-form ${successMsg ? "form-fade" : ""}`}>
          <div className="form-grid-4">
            <div className="field-item">
              <label>First Name</label>
              <input value={formData.firstName} onChange={(e)=>setFormData({...formData, firstName: e.target.value})} required disabled={!!successMsg}/>
            </div>
            
            <div className="field-item">
              <label>Last Name</label>
              <input value={formData.lastName} onChange={(e)=>setFormData({...formData, lastName: e.target.value})} required disabled={!!successMsg}/>
            </div>

            <div className="field-item">
              <label>Email (Verified)</label>
              <input type="email" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} required disabled={!!successMsg}/>
            </div>

            <div className="field-item">
              <label>Contact (10 Digits)</label>
              <input 
                type="text" maxLength="10" value={formData.contact} 
                onChange={(e) => setFormData({...formData, contact: e.target.value.replace(/\D/g, "")})} 
                required disabled={!!successMsg}
              />
            </div>

            <div className="field-item">
              <label>Education</label>
              <input value={formData.education} onChange={(e)=>setFormData({...formData, education: e.target.value})} required disabled={!!successMsg}/>
            </div>

            <div className="field-item">
              <label>Marital Status</label>
              <select value={formData.maritalStatus} onChange={(e)=>setFormData({...formData, maritalStatus: e.target.value})} required disabled={!!successMsg}>
                <option value="SINGLE">SINGLE</option>
                <option value="MARRIED">MARRIED</option>
                <option value="DIVORCED">DIVORCED</option>
              </select>
            </div>

            <div className="field-item">
              <label>Department</label>
              <select value={formData.departmentId} onChange={(e)=>setFormData({...formData, departmentId: e.target.value})} required disabled={!!successMsg}>
                <option value="">Select Dept...</option>
                {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
              </select>
            </div>

            <div className="field-item">
              <label>Position</label>
              <select value={formData.positionId} onChange={(e)=>setFormData({...formData, positionId: e.target.value})} required disabled={!!successMsg}>
                <option value="">Select Position...</option>
                {positions.map(p => <option key={p.designationId} value={p.designationId}>{p.designationTitle}</option>)}
              </select>
            </div>

            <div className="field-item">
              <label>Basic Salary</label>
              <input type="number" value={formData.basicSalary} onChange={(e)=>setFormData({...formData, basicSalary: e.target.value})} required disabled={!!successMsg}/>
            </div>

            <div className="field-item">
              <label>Joining Date</label>
              <input type="date" value={formData.joiningDate} onChange={(e)=>setFormData({...formData, joiningDate: e.target.value})} required disabled={!!successMsg}/>
            </div>
          </div>

          <div className="form-bottom-section">
            <div className="addr-side">
              <label>Permanent Address</label>
              <textarea value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} required disabled={!!successMsg}/>
            </div>
            
            <div className="btn-side">
              {!successMsg && (
                <>
                  <button type="button" className="btn-cancel" onClick={() => navigate("/admin/employees")}>Cancel</button>
                  <button type="submit" className="btn-save" disabled={loading}>
                    {loading ? "Processing..." : isEditMode ? "Update Details" : "Save Employee"}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;