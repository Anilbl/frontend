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
    middleName: "", // NEW FIELD
    lastName: "", 
    gender: "",     // NEW FIELD
    email: "", 
    contact: "", 
    address: "",
    education: "", 
    maritalStatus: "SINGLE", 
    departmentId: "",
    positionId: "", 
    isActive: true, 
    basicSalary: 0,
    joiningDate: new Date().toISOString().split('T')[0],
    bankId: "",
    accountNumber: "",
    accountType: "SALARY",
    currency: "NPR"
  });

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const loadInit = async () => {
      try {
        const [d, p, b] = await Promise.all([
          api.get("/departments"), 
          api.get("/designations"),
          api.get("/banks")
        ]);
        
        setDepartments(d.data); 
        setPositions(p.data);
        setBanks(b.data);
        
        if (isEditMode) {
          const res = await getEmployeeById(id);
          const u = res.data || res;
          setFormData({
            ...u, 
            departmentId: u.department?.deptId || "", 
            positionId: u.position?.designationId || "",
            bankId: u.bankAccount?.[0]?.bank?.bankId || u.bankAccount?.bank?.bankId || "",
            accountNumber: u.bankAccount?.[0]?.accountNumber || u.bankAccount?.accountNumber || "",
            accountType: u.bankAccount?.[0]?.accountType || u.bankAccount?.accountType || "SALARY",
            currency: u.bankAccount?.[0]?.currency || u.bankAccount?.currency || "NPR"
          });
        }
      } catch (e) { 
        console.error("Initialization error:", e); 
      }
    };
    loadInit();
  }, [id, isEditMode]);

  useEffect(() => {
    if (formData.positionId && positions.length > 0) {
      const selectedPos = positions.find(p => String(p.designationId) === String(formData.positionId));
      if (selectedPos) {
        setFormData(prev => ({
          ...prev,
          basicSalary: selectedPos.baseSalary 
        }));
      }
    }
  }, [formData.positionId, positions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!/^\d{10}$/.test(formData.contact)) {
      setErrorMsg("Contact number must be exactly 10 digits.");
      setLoading(false);
      return;
    }

    try {
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
        position: { designationId: parseInt(formData.positionId) },
        bankAccount: [{
          bank: { bankId: parseInt(formData.bankId) },
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
          currency: formData.currency,
          isPrimary: true
        }]
      };

      isEditMode ? await updateEmployee(id, payload) : await createEmployee(payload);
      setSuccessMsg(isEditMode ? "Employee updated successfully!" : "Employee registered successfully!");
      setTimeout(() => navigate("/admin/employees"), 2000); 

    } catch (err) { 
      setErrorMsg(err.response?.data?.message || "Operation failed.");
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

            {/* NEW MIDDLE NAME FIELD */}
            <div className="field-item">
              <label>Middle Name (Optional)</label>
              <input value={formData.middleName || ""} onChange={(e)=>setFormData({...formData, middleName: e.target.value})} disabled={!!successMsg}/>
            </div>
            
            <div className="field-item">
              <label>Last Name</label>
              <input value={formData.lastName} onChange={(e)=>setFormData({...formData, lastName: e.target.value})} required disabled={!!successMsg}/>
            </div>

            {/* NEW GENDER FIELD */}
            <div className="field-item">
              <label>Gender</label>
              <select value={formData.gender} onChange={(e)=>setFormData({...formData, gender: e.target.value})} required disabled={!!successMsg}>
                <option value="">Select Gender...</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div className="field-item">
              <label>Email (Verified)</label>
              <input type="email" value={formData.email} onChange={(e)=>setFormData({...formData, email: e.target.value})} required disabled={!!successMsg}/>
            </div>

            <div className="field-item">
              <label>Contact</label>
              <input type="text" maxLength="10" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value.replace(/\D/g, "")})} required disabled={!!successMsg} />
            </div>

            <div className="field-item">
              <label>Department</label>
              <select value={formData.departmentId} onChange={(e)=>setFormData({...formData, departmentId: e.target.value})} required disabled={!!successMsg}>
                <option value="">Select Dept...</option>
                {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
              </select>
            </div>

            <div className="field-item">
              <label>Position (Designation)</label>
              <select value={formData.positionId} onChange={(e)=>setFormData({...formData, positionId: e.target.value})} required disabled={!!successMsg}>
                <option value="">Select Position...</option>
                {positions.map(p => <option key={p.designationId} value={p.designationId}>{p.designationTitle}</option>)}
              </select>
            </div>

            <div className="field-item highlight-field">
              <label>Basic Salary (Locked)</label>
              <input 
                type="text" 
                value={`Rs. ${formData.basicSalary.toLocaleString()}`} 
                readOnly 
                className="locked-input" 
                style={{ backgroundColor: "#f0f0f0", cursor: "not-allowed", fontWeight: "bold", color: "#2c3e50" }}
              />
            </div>

            <div className="field-item">
              <label>Joining Date</label>
              <input type="date" value={formData.joiningDate} onChange={(e)=>setFormData({...formData, joiningDate: e.target.value})} required disabled={!!successMsg}/>
            </div>

            <div className="field-item">
              <label>Bank Name</label>
              <select value={formData.bankId} onChange={(e)=>setFormData({...formData, bankId: e.target.value})} required disabled={!!successMsg}>
                <option value="">Select Bank...</option>
                {banks.map(b => <option key={b.bankId} value={b.bankId}>{b.bankName}</option>)}
              </select>
            </div>

            <div className="field-item">
              <label>Account Number</label>
              <input value={formData.accountNumber} onChange={(e)=>setFormData({...formData, accountNumber: e.target.value})} required disabled={!!successMsg}/>
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
                </select>
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