import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById, createUser, updateUser } from "../../api/userApi";
import { getRoles } from "../../api/roleApi"; 
import { FaEye, FaEyeSlash } from "react-icons/fa"; // npm install react-icons
import "./AddUser.css"; 

export default function AddUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: { roleId: "" }, 
    status: "ACTIVE"
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const rolesData = await getRoles();
      const finalRoles = Array.isArray(rolesData) ? rolesData : rolesData.data || [];
      setRoles(finalRoles);

      if (isEditMode) {
        const userRes = await getUserById(id);
        const u = userRes.data ? userRes.data : userRes;
        if (u) {
          setFormData({
            username: u.username || "",
            email: u.email || "",
            password: "", 
            role: { roleId: u.role?.roleId || u.roleId || "" },
            status: u.status || "ACTIVE"
          });
        }
      }
    } catch (err) {
      console.error("Init error:", err);
      setStatusMsg({ type: "error", text: "Failed to load roles." });
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "roleId") {
      setFormData(prev => ({ ...prev, role: { roleId: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      // Constructing clean payload
      const payload = {
        username: formData.username,
        email: formData.email,
        status: formData.status,
        role: { roleId: parseInt(formData.role.roleId) }
      };

      if (isEditMode) {
        if (formData.password) payload.password = formData.password;
        await updateUser(id, payload);
        setStatusMsg({ type: "success", text: "User updated successfully!" });
      } else {
        payload.password = formData.password;
        await createUser(payload);
        setStatusMsg({ type: "success", text: "User created successfully!" });
      }
      
      // Success Redirect Logic
      setTimeout(() => navigate("/admin/users"), 2000);

    } catch (err) {
      console.error("Submit error:", err);
      // Extracts message from your GlobalExceptionHandler
      const errorDetail = err.response?.data?.message || "Check your network connection.";
      setStatusMsg({ type: "error", text: errorDetail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-canvas">
      <header className="page-header">
        <h3>{isEditMode ? "Update User" : "Create New User"}</h3>
      </header>

      {statusMsg.text && (
        <div className={`status-box ${statusMsg.type}`}>{statusMsg.text}</div>
      )}

      <div className="form-card-container">
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Username</label>
              <input name="username" value={formData.username} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Password {isEditMode && "(Optional)"}</label>
              <div style={{ position: "relative" }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  required={!isEditMode}
                  style={{ width: "100%", paddingRight: "40px" }}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#666"
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Assign Role</label>
              <select name="roleId" value={formData.role.roleId} onChange={handleChange} required>
                <option value="">-- Select --</option>
                {roles.map(r => <option key={r.roleId} value={r.roleId}>{r.roleName}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate("/admin/users")}>Cancel</button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? "Processing..." : (isEditMode ? "Save" : "Create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}