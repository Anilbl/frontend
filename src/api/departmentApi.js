import axios from "axios";
const BASE_URL = "http://localhost:8080/api/departments";

export const getDepartments = async () => {
  const res = await axios.get(BASE_URL);
  return res.data;
};

export const createDepartment = async (data) => {
  const res = await axios.post(BASE_URL, data);
  return res.data;
};

export const updateDepartment = async (data) => {
  const res = await axios.put(`${BASE_URL}/${data.id}`, data);
  return res.data;
};

export const deleteDepartment = async (id) => {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
};
