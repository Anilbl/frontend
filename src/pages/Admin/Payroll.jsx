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

    const handleEmailDispatch = async (id) => {
        try {
            await api.post(`/payrolls/${id}/send-email`);
            alert("Success: Payslip sent to employee's registered email.");
        } catch (err) {
            alert("Error: Access Denied or Email server down.");
        }
    };

    const generatePDFView = (data) => {
        const win = window.open("", "_blank");
        // Logic to show all individual components in the PDF
        const totalEarnings = data.grossSalary + data.totalAllowances;
        const totalDeductions = data.totalDeductions + data.totalTax;

        win.document.write(`
            <html>
                <head>
                    <title>Payslip - ${data.employee.firstName} ${data.employee.lastName}</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                        .payslip-container { max-width: 800px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 8px; }
                        .header { text-align: center; border-bottom: 3px solid #1a73e8; padding-bottom: 10px; margin-bottom: 25px; }
                        .header h1 { margin: 0; color: #1a73e8; }
                        .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th { background: #f8f9fa; padding: 12px; border: 1px solid #dee2e6; text-align: left; }
                        td { padding: 12px; border: 1px solid #dee2e6; }
                        .text-right { text-align: right; font-weight: bold; }
                        .net-box { background: #1a73e8; color: white; padding: 20px; text-align: right; border-radius: 4px; margin-top: 20px; }
                        .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #777; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="payslip-container">
                        <div class="header">
                            <h1>NAST COLLEGE</h1>
                            <p>Dhangadhi, Nepal | Monthly Salary Slip</p>
                        </div>
                        <div class="info-section">
                            <div>
                                <p><strong>Employee:</strong> ${data.employee.firstName} ${data.employee.lastName}</p>
                                <p><strong>Employee ID:</strong> ${data.employee.empId}</p>
                                <p><strong>Pay Period:</strong> ${data.payPeriodStart} - ${data.payPeriodEnd}</p>
                            </div>
                            <div style="text-align: right">
                                <p><strong>Payroll ID:</strong> #${data.payrollId}</p>
                                <p><strong>Pay Date:</strong> ${data.payDate || 'N/A'}</p>
                                <p><strong>Bank Account:</strong> ${data.paymentAccount ? data.paymentAccount.accountNumber : 'N/A'}</p>
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Earnings Component</th><th class="text-right">Amount</th>
                                    <th>Deductions Component</th><th class="text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Basic Gross Salary</td><td class="text-right">Rs. ${data.grossSalary.toLocaleString()}</td>
                                    <td>TDS / Income Tax</td><td class="text-right">Rs. ${data.totalTax.toLocaleString()}</td>
                                </tr>
                                <tr>
                                    <td>Total Allowances</td><td class="text-right">Rs. ${data.totalAllowances.toLocaleString()}</td>
                                    <td>Other Deductions</td><td class="text-right">Rs. ${data.totalDeductions.toLocaleString()}</td>
                                </tr>
                                <tr style="background:#f1f3f4; font-weight:bold;">
                                    <td>Total Earnings (A)</td><td class="text-right">Rs. ${totalEarnings.toLocaleString()}</td>
                                    <td>Total Deductions (B)</td><td class="text-right">Rs. ${totalDeductions.toLocaleString()}</td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="net-box">
                            <div style="font-size: 14px;">NET PAYABLE (A - B)</div>
                            <h2 style="margin: 5px 0 0 0;">Rs. ${data.netSalary.toLocaleString()}</h2>
                        </div>
                        <div class="footer">
                            <p>This is a system-generated document and does not require a physical signature.</p>
                            <p>Generated on ${new Date().toLocaleString()}</p>
                        </div>
                    </div>
                    <div class="no-print" style="text-align:center; margin-top:20px;">
                        <button onclick="window.print()" style="padding:10px 20px; background:#1a73e8; color:white; border:none; border-radius:5px; cursor:pointer;">Print Now</button>
                    </div>
                </body>
            </html>
        `);
        win.document.close();
    };

    const filtered = payrolls.filter(p => 
        (p.employee.firstName + " " + p.employee.lastName).toLowerCase().includes(search.toLowerCase()) ||
        p.employee.empId.toString().includes(search)
    );

    return (
        <div className="payroll-container">
            <div className="payroll-header-section">
                <h2>Payroll Command Center</h2>
                <input 
                    className="search-bar" 
                    placeholder="Search by Name or Employee ID..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="payroll-card">
                <table className="payroll-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Basic Gross</th>
                            <th>Allowances</th>
                            <th>Tax (TDS)</th>
                            <th>Deductions</th>
                            <th>Net Payable</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr key={p.payrollId}>
                                <td>
                                    <span className="emp-name">{p.employee.firstName} {p.employee.lastName}</span>
                                    <span className="emp-id">ID: {p.employee.empId}</span>
                                </td>
                                <td>Rs. {p.grossSalary.toLocaleString()}</td>
                                <td style={{color: '#2dce89'}}>+ Rs. {p.totalAllowances.toLocaleString()}</td>
                                <td style={{color: '#f5365c'}}>- Rs. {p.totalTax.toLocaleString()}</td>
                                <td style={{color: '#f5365c'}}>- Rs. {p.totalDeductions.toLocaleString()}</td>
                                <td><span className="amount-net">Rs. {p.netSalary.toLocaleString()}</span></td>
                                <td className="actions-cell">
                                    <button className="btn-icon btn-pdf" onClick={() => generatePDFView(p)}>View PDF</button>
                                    <button className="btn-icon btn-email" onClick={() => handleEmailDispatch(p.payrollId)}>Email</button>
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