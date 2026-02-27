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
    middleName: "", 
    lastName: "", 
    gender: "",      
    email: "", 
    contact: "", 
    address: "",
    education: "", 
    maritalStatus: "SINGLE", 
    isSsfEnrolled: false,
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
  
  // Validation States
  const [accNumError, setAccNumError] = useState(""); 
  const [emailError, setEmailError] = useState("");

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
            isSsfEnrolled: u.isSsfEnrolled || false,
            departmentId: u.department?.deptId || "", 
            positionId: u.position?.designationId || "",
            basicSalary: u.basicSalary || 0,
            bankId: u.bankAccount?.[0]?.bank?.bankId || u.bankAccount?.bank?.bankId || "",
            accountNumber: String(u.bankAccount?.[0]?.accountNumber || u.bankAccount?.accountNumber || ""),
          });
        }
      } catch (e) { console.error("Initialization error:", e); }
    };
    loadInit();
  }, [id, isEditMode]);

  const handlePositionChange = (e) => {
    const selectedId = e.target.value;
    const selectedPos = positions.find(p => String(p.designationId) === String(selectedId));
    setFormData(prev => ({
      ...prev,
      positionId: selectedId,
      basicSalary: selectedPos ? (selectedPos.baseSalary || selectedPos.defaultSalary) : prev.basicSalary
    }));
  };

  // Gmail Constraint Logic
  const handleEmailChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, email: val });
    
    const gmailRegex = /^[a-z0-9](\.?[a-z0-9]){5,}@gmail\.com$/;
    if (val && !gmailRegex.test(val)) {
      setEmailError("Must be a valid @gmail.com address");
    } else {
      setEmailError("");
    }
  };

  // Account Number Constraint Logic (14-16 digits)
  const handleAccountNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); 
    if (value.length <= 16) {
      setFormData({ ...formData, accountNumber: value });
      if (value.length > 0 && value.length < 14) {
        setAccNumError("Minimum 14 digits required.");
      } else {
        setAccNumError("");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final check for constraints
    if (formData.accountNumber.length < 14) {
      setErrorMsg("Account number must be 14-16 digits.");
      return;
    }
    if (emailError) {
      setErrorMsg("Please provide a valid Gmail address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const userRes = await api.get(`/users/search?email=${formData.email}`);
      const foundUser = Array.isArray(userRes.data) ? userRes.data[0] : userRes.data;

      if (!foundUser) throw new Error("Email not found in User records.");
      
      const payload = { 
        ...formData, 
        user: { userId: foundUser.userId }, 
        department: { deptId: parseInt(formData.departmentId) }, 
        position: { designationId: parseInt(formData.positionId) },
        bankAccount: [{
          bank: { bankId: parseInt(formData.bankId) },
          accountNumber: formData.accountNumber,
          isPrimary: true
        }]
      };

      isEditMode ? await updateEmployee(id, payload) : await createEmployee(payload);
      setSuccessMsg("Success! Employee record saved.");
      setTimeout(() => navigate("/admin/employees"), 1500); 

    } catch (err) { 
      setErrorMsg(err.message || "Operation failed.");
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

        <form onSubmit={handleSubmit} className="compact-form">
          <div className="form-grid-4">
            <div className="field-item">
              <label>First Name</label>
              <input value={formData.firstName} onChange={(e)=>setFormData({...formData, firstName: e.target.value})} required />
            </div>
            <div className="field-item">
              <label>Middle Name</label>
              <input value={formData.middleName || ""} onChange={(e)=>setFormData({...formData, middleName: e.target.value})} />
            </div>
            <div className="field-item">
              <label>Last Name</label>
              <input value={formData.lastName} onChange={(e)=>setFormData({...formData, lastName: e.target.value})} required />
            </div>
            <div className="field-item">
              <label>Gender</label>
              <select value={formData.gender} onChange={(e)=>setFormData({...formData, gender: e.target.value})} required>
                <option value="">Select...</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            {/* EMAIL WITH GMAIL CONSTRAINT */}
            <div className="field-item">
              <label>Gmail Address</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={handleEmailChange} 
                placeholder="example@gmail.com"
                required 
              />
              {emailError && <span className="field-helper" style={{color: '#dc2626'}}>{emailError}</span>}
            </div>

            <div className="field-item">
              <label>Contact</label>
              <input type="text" maxLength="10" value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value.replace(/\D/g, "")})} required />
            </div>
            <div className="field-item">
              <label>Department</label>
              <select value={formData.departmentId} onChange={(e)=>setFormData({...formData, departmentId: e.target.value})} required>
                <option value="">Select...</option>
                {departments.map(d => <option key={d.deptId} value={d.deptId}>{d.deptName}</option>)}
              </select>
            </div>
            <div className="field-item">
              <label>Position</label>
              <select value={formData.positionId} onChange={handlePositionChange} required>
                <option value="">Select...</option>
                {positions.map(p => <option key={p.designationId} value={p.designationId}>{p.designationTitle}</option>)}
              </select>
            </div>
            <div className="field-item">
                <label>Marital Status</label>
                <select value={formData.maritalStatus} onChange={(e)=>setFormData({...formData, maritalStatus: e.target.value})}>
                    <option value="SINGLE">SINGLE</option>
                    <option value="MARRIED">MARRIED</option>
                </select>
            </div>
            <div className="field-item ssf-toggle-box">
                <label>SSF Enrollment</label>
                <div className="ssf-switch-wrapper">
                    <input type="checkbox" id="ssf-enroll" checked={formData.isSsfEnrolled} onChange={(e) => setFormData({...formData, isSsfEnrolled: e.target.checked})}/>
                    <label htmlFor="ssf-enroll" className="ssf-switch-label"> {formData.isSsfEnrolled ? "✅ Enrolled" : "❌ No"} </label>
                </div>
            </div>
            <div className="field-item">
              <label>Joining Date</label>
              <input type="date" value={formData.joiningDate} onChange={(e)=>setFormData({...formData, joiningDate: e.target.value})} required/>
            </div>
            <div className="field-item">
              <label>Bank</label>
              <select value={formData.bankId} onChange={(e)=>setFormData({...formData, bankId: e.target.value})} required>
                <option value="">Select...</option>
                {banks.map(b => <option key={b.bankId} value={b.bankId}>{b.bankName}</option>)}
              </select>
            </div>

            {/* ACCOUNT NUMBER (14-16 DIGITS) */}
            <div className="field-item">
              <label>Account Number</label>
              <input 
                type="text" 
                value={formData.accountNumber} 
                onChange={handleAccountNumberChange} 
                placeholder="14-16 digits"
                required 
              />
              {accNumError && <span className="field-helper" style={{color: '#dc2626'}}>{accNumError}</span>}
            </div>

            <div className="field-item">
              <label>Basic Salary</label>
              <input type="number" value={formData.basicSalary} onChange={(e) => setFormData({...formData, basicSalary: e.target.value})} required />
            </div>
          </div>

          <div className="form-bottom-section">
            <div className="addr-side">
              <label>Permanent Address</label>
              <textarea value={formData.address} onChange={(e)=>setFormData({...formData, address: e.target.value})} required />
            </div>
            <div className="btn-side">
              <button type="button" className="btn-cancel" onClick={() => navigate("/admin/employees")}>Cancel</button>
              <button 
                type="submit" 
                className="btn-save" 
                disabled={loading || formData.accountNumber.length < 14 || !!emailError}
              >
                {loading ? "Processing..." : isEditMode ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;