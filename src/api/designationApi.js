import axios from "axios";

const BASE_URL = "http://localhost:8080/api/designations"; // Change this to your backend endpoint

// Get all designations
export const getDesignations = async () => {
  const res = await axios.get(BASE_URL);
  return res.data;
};

// Create a new designation
export const createDesignation = async (data) => {
  const res = await axios.post(BASE_URL, data);
  return res.data;
};

// Update a designation
export const updateDesignation = async (data) => {
  const res = await axios.put(`${BASE_URL}/${data.id}`, data);
  return res.data;
};

// Delete a designation
export const deleteDesignation = async (id) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
};
