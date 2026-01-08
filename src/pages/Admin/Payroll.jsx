import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import "./Payroll.css";

const PayrollManagement = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPayrolls();
  }, []);

  const loadPayrolls = async () => {
    try {
      const res = await api.get("/payrolls");
      setPayrolls(res.data);
    } catch (err) {
      console.error("Failed to fetch payrolls", err);
    }
  };

  // --- NEW: System Logging for Email Actions ---
  const logAction = async (payrollId, actionType, employeeName) => {
    try {
      await api.post("/payroll-audit", {
        payrollId: payrollId,
        action: actionType,
        details: `${actionType === 'EMAIL_SENT' ? 'Payslip emailed' : 'Payslip viewed'} for ${employeeName}`,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Audit logging failed", err);
    }
  };

  // --- FIXED: Email Click Handler ---
  const handleEmailDispatch = async (payroll) => {
    const confirmSend = window.confirm(`Send digital payslip to ${payroll.employee.firstName}?`);
    
    if (confirmSend) {
      try {
        // Trigger backend email service
        await api.post(`/payrolls/${payroll.payrollId}/send-email`);
        
        // Save this event in the system audit table
        await logAction(payroll.payrollId, "EMAIL_SENT", `${payroll.employee.firstName} ${payroll.employee.lastName}`);
        
        alert("Success: Digital payslip dispatched to employee email.");
      } catch (err) {
        alert("Error: Email service is currently unavailable.");
        console.error(err);
      }
    }
  };

  const generateProfessionalPayslip = async (data) => {
    // Save "Viewed" action to system
    await logAction(data.payrollId, "PAYSLIP_VIEWED", `${data.employee.firstName} ${data.employee.lastName}`);

    let components = [];
    try {
      const res = await api.get(`/employee-salary-components/employee/${data.employee.empId}`);
      components = res.data;
    } catch (err) {
      console.warn("Using summary data.");
    }

    const win = window.open("", "_blank");
    
    // Formatting data for the template
    const bankName = data.employee.bankAccounts?.[0]?.bankName || "Global IME Bank";
    const accNo = data.employee.bankAccounts?.[0]?.accountNumber || "112233445566";

    const earnings = components.filter(c => c.salaryComponent.componentType.name.toLowerCase() === 'allowance');
    const deductions = components.filter(c => c.salaryComponent.componentType.name.toLowerCase() === 'deduction');

    win.document.write(`
      <html>
        <head>
          <title>Enterprise Payslip - ${data.employee.firstName}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1a1f36; padding: 40px; line-height: 1.6; background: #f4f7fa; }
            .payslip-wrapper { max-width: 850px; margin: auto; background: white; padding: 50px; border-radius: 12px; border: 1px solid #e3e8ee; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
            .header { display: flex; justify-content: space-between; border-bottom: 4px solid #0052cc; padding-bottom: 20px; margin-bottom: 30px; }
            .brand h1 { color: #0052cc; margin: 0; font-size: 30px; }
            .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; background: #f8f9fc; padding: 25px; border-radius: 8px; margin-bottom: 30px; }
            .info-item label { display: block; font-size: 10px; font-weight: 800; color: #8792a2; text-transform: uppercase; margin-bottom: 5px; }
            .info-item span { font-size: 14px; font-weight: 600; }
            .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .salary-table th { background: #0052cc; color: white; padding: 12px; text-align: left; font-size: 11px; }
            .salary-table td { padding: 12px; border: 1px solid #e3e8ee; font-size: 13px; }
            .amt { text-align: right; font-weight: bold; }
            .net-box { background: #0052cc; color: white; padding: 30px; border-radius: 8px; margin-top: 30px; display: flex; justify-content: space-between; align-items: center; }
            .net-val { font-size: 34px; font-weight: 800; margin: 0; }
            @media print { .no-print { display: none; } body { background: white; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="payslip-wrapper">
            <div class="header">
              <div class="brand"><h1>NAST COLLEGE</h1><p>Dhangadhi, Nepal | Monthly Salary Slip</p></div>
              <div class="meta"><h3>#PAY-${data.payrollId}</h3><p>Pay Date: ${new Date().toLocaleDateString()}</p></div>
            </div>
            <div class="info-grid">
              <div class="info-item"><label>Employee</label><span>${data.employee.firstName} ${data.employee.lastName}</span></div>
              <div class="info-item"><label>Employee ID</label><span>#${data.employee.empId}</span></div>
              <div class="info-item"><label>Department</label><span>${data.employee.department?.name || 'Administration'}</span></div>
              <div class="info-item"><label>Grade</label><span>${data.employee.salaryGrade?.gradeName || 'N/A'}</span></div>
              <div class="info-item"><label>Bank</label><span>${bankName}</span></div>
              <div class="info-item"><label>Account No</label><span>${accNo}</span></div>
            </div>
            <table class="salary-table">
              <thead>
                <tr><th>Earnings</th><th class="amt">Amount</th><th>Deductions</th><th class="amt">Amount</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>Basic Salary</td><td class="amt">Rs. ${data.grossSalary.toLocaleString()}</td>
                  <td>Tax (TDS)</td><td class="amt">Rs. ${data.totalTax.toLocaleString()}</td>
                </tr>
                ${Array.from({ length: Math.max(earnings.length, deductions.length) }).map((_, i) => `
                  <tr>
                    <td>${earnings[i] ? earnings[i].salaryComponent.componentName : '-'}</td>
                    <td class="amt">${earnings[i] ? 'Rs. ' + earnings[i].value.toLocaleString() : ''}</td>
                    <td>${deductions[i] ? deductions[i].salaryComponent.componentName : '-'}</td>
                    <td class="amt">${deductions[i] ? 'Rs. ' + deductions[i].value.toLocaleString() : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="net-box">
              <div><small>TOTAL NET DISBURSEMENT</small><h2 class="net-val">Rs. ${data.netSalary.toLocaleString()}</h2></div>
              <div style="text-align:right"><strong>Status: PAID</strong></div>
            </div>
            <div class="no-print" style="margin-top:20px; text-align:center;">
              <button onclick="window.print()" style="padding:12px 30px; background:#0052cc; color:white; border:none; border-radius:6px; cursor:pointer; font-weight:bold;">Print Payslip</button>
            </div>
          </div>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="payroll-container">
      <div className="payroll-header">
        <div className="header-title">
          <h2>Payroll Management</h2>
          <p>Manage and disburse employee salaries</p>
        </div>
        <input
          type="text" 
          className="search-input" 
          placeholder="Search employees..." 
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-card">
        <table className="main-payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Grade</th>
              <th>Gross</th>
              <th>Deductions</th>
              <th>Net Payable</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.filter(p => `${p.employee.firstName} ${p.employee.lastName}`.toLowerCase().includes(search.toLowerCase())).map(p => (
              <tr key={p.payrollId}>
                <td>
                  <div className="emp-primary">{p.employee.firstName} {p.employee.lastName}</div>
                  <div className="emp-secondary">ID: {p.employee.empId}</div>
                </td>
                <td><span className="grade-badge">{p.employee.salaryGrade?.gradeName || "N/A"}</span></td>
                <td>Rs. {p.grossSalary.toLocaleString()}</td>
                <td className="deduction-text">-Rs. {(p.totalTax + p.totalDeductions).toLocaleString()}</td>
                <td className="net-text">Rs. {p.netSalary.toLocaleString()}</td>
                <td>
                  <button className="action-btn view" onClick={() => generateProfessionalPayslip(p)}>View</button>
                  {/* --- FIXED: Added onClick handler here --- */}
                  <button className="action-btn email" onClick={() => handleEmailDispatch(p)}>Email</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollManagement;