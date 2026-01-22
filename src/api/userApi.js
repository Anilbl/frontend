import api from "./axios"; 

// Fetch all users
export const getUsers = () => api.get("/users");

// Fetch single user
export const getUserById = (id) => api.get(`/users/${id}`);

// Create user
export const createUser = (userData) => api.post("/users", userData);

// Update user
export const updateUser = (id, userData) => api.put(`/users/${id}`, userData);

// Delete user
export const deleteUser = (id) => api.delete(`/users/${id}`);