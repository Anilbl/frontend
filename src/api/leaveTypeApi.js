import axios from 'axios';

const API_URL = "http://localhost:8080/api/leave-types";

export const getLeaveTypes = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const createLeaveType = async (data) => {
    const response = await axios.post(API_URL, data);
    return response.data;
};

export const updateLeaveType = async (id, data) => {
    const response = await axios.put(`${API_URL}/${id}`, data);
    return response.data;
};

export const deleteLeaveType = async (id) => {
    await axios.delete(`${API_URL}/${id}`);
};