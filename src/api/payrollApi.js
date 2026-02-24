import api from "./axios";

const BASE_URL = "/payrolls";

/**
 * STAGE 2: PROCESS
 * Finalizes the payroll and saves it to the database.
 * Force token into headers to ensure the transaction isn't interrupted.
 */
export const processEmployeePayroll = (data) => {
    const token = localStorage.getItem("token");
    return api.post(`${BASE_URL}/process`, data, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).then(res => res.data);
};

/**
 * DASHBOARD BATCH CALCULATION
 * Fetches real-time "soft" calculations (Earned Salary/Hours) 
 * for the dashboard based on the selected period.
 */
export const getBatchCalculations = (month, year) => {
    return api.get(`${BASE_URL}/batch-calculate`, {
        params: { month, year }
    });
};

export const getPayrolls = () => api.get(BASE_URL);

export const getEmployeeHistory = (empId) => api.get(`${BASE_URL}/employee/${empId}/history`);

export const voidPayrollRecord = (id) => api.put(`${BASE_URL}/${id}/void`);

export const emailPayslip = (id) => {
    console.log(`[API] Initiating email request for Payroll ID: ${id}`);
    return api.post(`${BASE_URL}/${id}/send-email`); 
};