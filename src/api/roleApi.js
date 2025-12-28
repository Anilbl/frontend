import axios from "axios";

const API_URL = "http://localhost:8080/api/roles";

export const getRoles = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createRole = async (role) => {
    const response = await axios.post(API_URL, role);
    return response.data;
};

export const updateRole = async (id, role) => {
    const response = await axios.put(`${API_URL}/${id}`, role);
    return response.data;
};

export const deleteRole = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};