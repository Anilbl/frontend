import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "./PayrollPreview.css";

const postToEsewa = (path, params) => {
    const form = document.createElement("form");
    form.setAttribute("method", "POST");
    form.setAttribute("action", path);

    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            const hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);
            form.appendChild(hiddenField);
        }
    }
    document.body.appendChild(form);
    form.submit();
};

const PayrollPreview = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { state } = location || {};
    const { previewData, originalPayload } = state || {};

    const isAdmin = useMemo(() => location.pathname.includes("/admin"), [location.pathname]);
    const getPayrollHomePath = () => isAdmin ? "/admin/payroll" : "/accountant/payroll-processing";

    if (!previewData || !originalPayload) {
        return (
            <div className="payroll-preview-wrapper">
                <div className="session-error">
                    <h2>Session Expired</h2>
                    <p>Please restart the payroll process for this employee.</p>
                    <button className="btn-cancel" onClick={() => navigate(getPayrollHomePath())}>Back to List</button>
                </div>
            </div>
        );
    }

    const handleGoBack = () => {
        // We pass the original payload back. The Adjustment page uses this to 
        // repopulate the earnedSalary and the extraComponents list.
        navigate(`${getPayrollHomePath()}/adjust`, {
            state: {
                ...originalPayload,
                fullName: originalPayload.fullName,
            }
        });
    };

    const handleDisbursement = async () => {
        try {
            // 1. Save the payroll record to DB
            const processResponse = await api.post("/payrolls/process", originalPayload);
            const savedPayroll = processResponse.data;
            const payrollId = savedPayroll.payrollId || savedPayroll.id;

            // 2. Initiate eSewa payment
            const initResponse = await api.get(`/esewa/initiate/${payrollId}`);
            const esewaData = initResponse.data;

            alert("Payroll finalized. Redirecting to eSewa...");
            sessionStorage.removeItem("active_payroll_adjustment");

            const esewaParams = {
                amount: esewaData.amount,
                tax_amount: esewaData.tax_amount,
                total_amount: esewaData.total_amount,
                transaction_uuid: esewaData.transaction_uuid,
                product_code: esewaData.product_code,
                product_service_charge: "0",
                product_delivery_charge: "0",
                success_url: `http://localhost:8080/api/esewa/success`, 
                failure_url: `http://localhost:8080/api/esewa/failure`, 
                signed_field_names: "total_amount,transaction_uuid,product_code",
                signature: esewaData.signature
            };

            postToEsewa(esewaData.esewa_url, esewaParams);

        } catch (err) {
            console.error("Disbursement Error:", err);
            alert("Process failed: " + (err.response?.data?.message || err.message));
        }
    };

    // --- Component Categorization Logic ---
    const allComponents = previewData.extraComponents || [];
    
    // 1. Earnings (Salaries, Allowances, Bonuses)
    const earnings = allComponents.filter(c => c.type === "EARNING");
    
    // 2. Statutory Deductions (SSF, CIT - these reduce taxable income)
    const statutory = allComponents.filter(c => 
        c.type === "DEDUCTION" && 
        (c.componentName.toUpperCase().includes("SSF") || 
         c.componentName.toUpperCase().includes("RETIREMENT") ||
         c.componentName.toUpperCase().includes("CIT"))
    );

    // 3. Other Deductions (Post-tax: Loans, Penalties, etc.)
    const otherDeds = allComponents.filter(c => 
        c.type === "DEDUCTION" && 
        !statutory.some(s => s.componentName === c.componentName)
    );

    return (
        <div className="payroll-preview-wrapper">
            <div className="preview-container">
                <div className="preview-top-bar">
                    <button className="back-link" onClick={handleGoBack}>← Adjust Components</button>
                    <div className="status-indicator">OFFICIAL CALCULATION PREVIEW</div>
                </div>

                <div className="main-preview-grid">
                    <aside className="info-panel">
                        <div className="emp-avatar">{previewData.employee?.firstName?.charAt(0)}</div>
                        <h3>{previewData.employee?.firstName} {previewData.employee?.lastName}</h3>
                        <p className="emp-meta">{previewData.employee?.position?.designationTitle}</p>
                        <p className="emp-meta">ID: #{previewData.employee?.empId}</p>
                        
                        <div className="tax-context-box">
                            <span className="status-badge">
                                Status: <strong>{previewData.employee?.maritalStatus || "SINGLE"}</strong>
                            </span>
                        </div>

                        <div className="attendance-summary-box">
                            <h4>PAY PERIOD</h4>
                            <p>{originalPayload.month} {originalPayload.year}</p>
                        </div>
                    </aside>

                    <main className="calculation-panel">
                        <div className="payslip-card">
                            <div className="payslip-header">
                                <span>SALARY BREAKDOWN</span>
                                <span>AMOUNT (NPR)</span>
                            </div>

                            {/* --- SECTION 1: EARNINGS --- */}
                            <div className="payslip-section">
                                <label className="section-label">1. Gross Earnings</label>
                                {earnings.length > 0 ? earnings.map((c, i) => (
                                    <div key={`earn-${i}`} className="payslip-row">
                                        <span>{c.componentName}</span>
                                        <span className="pos">+{c.amount?.toLocaleString()}</span>
                                    </div>
                                )) : <div className="payslip-row"><span>Base Earnings</span><span>0.00</span></div>}
                                
                                <div className="payslip-row highlight-gross">
                                    <span>TOTAL GROSS SALARY (A)</span>
                                    <span>Rs. {previewData.grossSalary?.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* --- SECTION 2: STATUTORY --- */}
                            <div className="payslip-section taxable-bridge-section">
                                <label className="section-label">2. Statutory Deductions (Pre-Tax)</label>
                                {statutory.length > 0 ? statutory.map((c, i) => (
                                    <div key={`stat-${i}`} className="payslip-row">
                                        <span>{c.componentName}</span>
                                        <span className="neg">-{c.amount?.toLocaleString()}</span>
                                    </div>
                                )) : <div className="payslip-row"><span>No Statutory Deductions</span><span>0.00</span></div>}
                                
                                <div className="payslip-row highlight-taxable">
                                    <span>NET TAXABLE INCOME</span>
                                    <span>Rs. {previewData.taxableIncome?.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* --- SECTION 3: TAX & OTHER --- */}
                            <div className="payslip-section">
                                <label className="section-label">3. Taxes & Other Deductions</label>
                                <div className="payslip-row">
                                    <span>Income Tax (TDS)</span>
                                    <span className="neg">-{previewData.totalTax?.toLocaleString()}</span>
                                </div>
                                {otherDeds.map((c, i) => (
                                    <div key={`other-${i}`} className="payslip-row">
                                        <span>{c.componentName}</span>
                                        <span className="neg">-{c.amount?.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="payslip-row highlight-total-ded">
                                    <span>TOTAL DEDUCTIONS (B)</span>
                                    <span className="neg">Rs. {previewData.totalDeductions?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="net-pay-box">
                                <label>NET DISBURSABLE SALARY</label>
                                <h1>Rs. {previewData.netSalary?.toLocaleString()}</h1>
                                <p className="calc-formula">Final Pay = Gross (A) - Total Deductions (B)</p>
                            </div>
                        </div>

                        <div className="action-footer">
                            <button className="btn-cancel" onClick={handleGoBack}>Modify Adjustments</button>
                            <button className="btn-finalize" onClick={handleDisbursement}>Confirm & Disburse via eSewa</button>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default PayrollPreview;