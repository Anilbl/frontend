import api from "./axios";

const BASE_URL = "/employees";

/**
 * GET All or GET by ID
 * The fix: Added a check for 'object' to ensure React Events 
 * don't trigger /employees/[object Object] which causes the 400 error.
 */
export const getEmployees = (id) => {
  if (id && typeof id !== 'object' && (typeof id === 'string' || typeof id === 'number')) {
    return api.get(`${BASE_URL}/${id}`);
  }
  return api.get(BASE_URL);
};

export const createEmployee = (employee) => api.post(BASE_URL, employee);

export const updateEmployee = (id, employee) => {
  if (!id) return Promise.reject("Update Error: ID is missing");
  return api.put(`${BASE_URL}/${id}`, employee);
};

export const deleteEmployee = (id) => {
  if (!id) return Promise.reject("Delete Error: ID is missing");
  return api.delete(`${BASE_URL}/${id}`);
};

export const getActiveEmployeeStats = () => api.get(`${BASE_URL}/stats/active-per-month`);

export const getEmployeeById = (id) => {
  if (!id) return Promise.reject("ID is required");
  return api.get(`${BASE_URL}/${id}`);
};