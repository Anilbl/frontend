import api from "./axios";

// Fetch all roles (Used for the dropdown)
export const getRoles = () => api.get("/roles");

export const getRoleById = (id) => api.get(`/roles/${id}`);

export const createRole = (roleData) => api.post("/roles", roleData);

export const updateRole = (id, roleData) => api.put(`/roles/${id}`, roleData);

export const deleteRole = (id) => api.delete(`/roles/${id}`);