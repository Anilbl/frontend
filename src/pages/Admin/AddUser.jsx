import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById, createUser, updateUser } from "../../api/userApi";
import { getRoles } from "../../api/roleApi"; 
import { FaInfoCircle } from "react-icons/fa"; 
import "./AddUser.css"; 

export default function AddUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: { roleId: "" }
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const rolesData = await getRoles();
      const finalRoles = Array.isArray(rolesData) ? rolesData : rolesData.data || [];
      setRoles(finalRoles);

      if (isEditMode) {
        const userRes = await getUserById(id);
        const u = userRes.data || userRes;
        if (u) {
          setFormData({
            username: u.username || "",
            email: u.email || "",
            role: { roleId: u.role?.roleId || u.roleId || "" }
          });
        }
      }
    } catch (err) {
      setStatusMsg({ type: "error", text: "Failed to load roles or user data." });
    } finally {
      setLoading(false);
    }
  }, [id, isEditMode]);

  useEffect(() => { loadInitialData(); }, [loadInitialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Logic: Strip spaces for username field
    let processedValue = value;
    if (name === "username") {
      processedValue = value.replace(/\s+/g, "");
    }

    if (name === "roleId") {
      setFormData(prev => ({ ...prev, role: { roleId: processedValue } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: "", text: "" });

    try {
      const payload = {
        ...(!isEditMode && { username: formData.username }),
        email: formData.email,
        role: { roleId: parseInt(formData.role.roleId) }
      };

      if (isEditMode) {
        await updateUser(id, payload);
        setStatusMsg({ type: "success", text: "User profile updated successfully!" });
      } else {
        await createUser(payload);
        setStatusMsg({ type: "success", text: "User created! Default credentials sent to email." });
      }
      
      setTimeout(() => navigate("/admin/users"), 2000);
    } catch (err) {
      const errorDetail = err.response?.data?.message || "An unexpected error occurred.";
      setStatusMsg({ type: "error", text: errorDetail });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-canvas">
      <header className="page-header">
        <h3>{isEditMode ? "Modify User Account" : "Register New User"}</h3>
      </header>

      {statusMsg.text && (
        <div className={`status-box ${statusMsg.type}`}>{statusMsg.text}</div>
      )}

      <div className="form-card-container">
        {!isEditMode && (
          <div className="info-alert">
            <FaInfoCircle />
            <span>Usernames are automatically stripped of spaces.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-grid">
            
            {/* Username hidden in Edit Mode */}
            {!isEditMode && (
              <div className="form-group">
                <label>Username</label>
                <input 
                  name="username" 
                  placeholder="e.g. jdoe123"
                  value={formData.username} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                placeholder="user@example.com"
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>Organizational Role</label>
              <select name="roleId" value={formData.role.roleId} onChange={handleChange} required>
                <option value="">-- Select Role --</option>
                {roles.map(r => (
                  <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="details-btn" onClick={() => navigate("/admin/users")}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="primary-btn">
              {loading ? "Processing..." : (isEditMode ? "Save Changes" : "Create Account")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}