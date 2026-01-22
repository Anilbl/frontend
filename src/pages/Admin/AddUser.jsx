import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUserById, createUser, updateUser } from "../../api/userApi";
import { getRoles } from "../../api/roleApi"; 
import "./AddUser.css"; 

export default function AddUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: { roleId: "" }, // This matches the @ManyToOne structure
    status: "ACTIVE"
  });

  const [roles, setRoles] = useState([]); // State to store roles from DB
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    loadInitialData();
  }, [id]);

const loadInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Roles
      const rolesData = await getRoles();
      // Since your roleApi.js returns 'response.data', rolesData is the array
      setRoles(Array.isArray(rolesData) ? rolesData : rolesData.data || []);

      // 2. If editing, fetch the specific user
      if (isEditMode) {
        const userRes = await getUserById(id);
        const u = userRes.data;
        setFormData({
          username: u.username,
          email: u.email,
          password: "", 
          role: { roleId: u.role?.roleId || "" },
          status: u.status || "ACTIVE"
        });
      }
    } catch (err) {
      console.error("Initialization error:", err);
      setStatusMsg({ type: "error", text: "Error loading form data." });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for the nested Role object
    if (name === "roleId") {
      setFormData({ 
        ...formData, 
        role: { roleId: parseInt(value) } 
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditMode) {
        await updateUser(id, formData);
        setStatusMsg({ type: "success", text: "User updated successfully!" });
      } else {
        await createUser(formData);
        setStatusMsg({ type: "success", text: "User account created!" });
      }
      setTimeout(() => navigate("/admin/users"), 2000);
    } catch (err) {
      setStatusMsg({ 
        type: "error", 
        text: err.response?.data?.message || "Failed to save user." 
      });
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
              <label>Password {isEditMode && "(Leave blank to keep current)"}</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required={!isEditMode} />
            </div>

            {/* ROLE SELECT DROPDOWN */}
            <div className="form-group">
              <label>Assign Role</label>
              <select 
                name="roleId" 
                value={formData.role.roleId} 
                onChange={handleChange} 
                required
              >
                <option value="">-- Select a Role --</option>
                {roles.map((r) => (
                  <option key={r.roleId} value={r.roleId}>
                    {r.roleName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Account Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="details-btn" onClick={() => navigate("/admin/users")}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={loading}>
              {isEditMode ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}