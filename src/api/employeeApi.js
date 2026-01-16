// src/api/employeeApi.js
import api from "./axios"; // your axios instance with interceptor

const BASE_URL = "/employees";

export const getEmployees = (id) =>
  id ? api.get(`${BASE_URL}/${id}`) : api.get(BASE_URL);

export const createEmployee = (employee) => api.post(BASE_URL, employee);

export const updateEmployee = (id, employee) => api.put(`${BASE_URL}/${id}`, employee);

export const deleteEmployee = (id) => api.delete(`${BASE_URL}/${id}`);

export const getActiveEmployeeStats = () => api.get(`${BASE_URL}/stats/active-per-month`);
// Add these to your employeeApi.js
export const getEmployeeById = (id) => api.get(`${BASE_URL}/${id}`);