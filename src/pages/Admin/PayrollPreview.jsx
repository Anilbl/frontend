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

    // Role-based logic
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
        navigate(`${getPayrollHomePath()}/adjust`, {
            state: {
                employee: previewData.employee,
                month: originalPayload.month,
                year: originalPayload.year,
                initialInputs: originalPayload,
                persistedAdjustments: originalPayload.extraComponents || [] 
            }
        });
    };

    const handleDisbursement = async () => {
        try {
            const processResponse = await api.post("/payrolls/process", originalPayload);
            const savedPayroll = processResponse.data;
            const payrollId = savedPayroll.payrollId || savedPayroll.id;

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
            alert("Process completed with warnings or error: " + (err.response?.data?.message || err.message));
            navigate(getPayrollHomePath());
        }
    };

    const allComponents = previewData.extraComponents || [];
    const earnings = allComponents.filter(c => c.type === "EARNING");
    const statutory = allComponents.filter(c => 
        c.type === "DEDUCTION" && 
        (c.componentName.includes("SSF") || c.componentName.includes("CIT"))
    );
    const otherDeds = allComponents.filter(c => 
        c.type === "DEDUCTION" && 
        !c.componentName.includes("SSF") && 
        !c.componentName.includes("CIT")
    );

    return (
        <div className="payroll-preview-wrapper">
            <div className="preview-container">
                <div className="preview-top-bar">
                    <button className="back-link" onClick={handleGoBack}>← Adjust Components</button>
                    <div className="status-indicator">OFFICIAL PREVIEW</div>
                </div>

                <div className="main-preview-grid">
                    <aside className="info-panel">
                        <div className="emp-avatar">{previewData.employee?.firstName?.charAt(0)}</div>
                        <h3>{previewData.employee?.firstName} {previewData.employee?.lastName}</h3>
                        <p className="emp-meta">{previewData.employee?.position?.designationTitle}</p>
                        <p className="emp-meta">ID: #{previewData.employee?.empId}</p>
                        
                        {/* --- ADDED MARITAL STATUS FOR TAX VERIFICATION --- */}
                        <div className="tax-context-box">
                            <span className="status-badge">
                                Tax Basis: <strong>{previewData.employee?.maritalStatus || "N/A"}</strong>
                            </span>
                        </div>

                        <div className="attendance-summary-box">
                            <h4>REMARKS</h4>
                            <p>{previewData.remarks || "No remarks provided."}</p>
                        </div>
                    </aside>

                    <main className="calculation-panel">
                        <div className="payslip-card">
                            <div className="payslip-header">
                                <span>SALARY BREAKDOWN</span>
                                <span>AMOUNT (NPR)</span>
                            </div>

                            <div className="payslip-section">
                                <label className="section-label">1. Gross Earnings</label>
                                {earnings.map((c, i) => (
                                    <div key={`earn-${i}`} className="payslip-row">
                                        <span>{c.componentName}</span>
                                        <span className="pos">+{c.amount?.toLocaleString()}</span>
                                    </div>
                                ))}
                                <div className="payslip-row highlight-gross">
                                    <span>TOTAL GROSS SALARY (A)</span>
                                    <span>Rs. {previewData.grossSalary?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="payslip-section taxable-bridge-section">
                                <label className="section-label">2. Statutory Deductions (Pre-Tax)</label>
                                {statutory.length > 0 ? statutory.map((c, i) => (
                                    <div key={`stat-${i}`} className="payslip-row">
                                        <span>{c.componentName}</span>
                                        <span className="neg">-{c.amount?.toLocaleString()}</span>
                                    </div>
                                )) : <div className="payslip-row"><span>No Pre-tax Deductions</span><span>0.00</span></div>}
                                
                                <div className="payslip-row highlight-taxable">
                                    <span>NET TAXABLE INCOME</span>
                                    <span>Rs. {previewData.taxableIncome?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="payslip-section">
                                <label className="section-label">3. Income Tax & Other Deductions</label>
                                <div className="payslip-row">
                                    <span>Income Tax (TDS)</span>
                                    <span className="neg">-{previewData.totalTax?.toLocaleString() || "0"}</span>
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
                                <label>NET PAYABLE AMOUNT</label>
                                <h1>Rs. {previewData.netSalary?.toLocaleString()}</h1>
                                <p className="calc-formula">Verified Formula: Gross (A) - Deductions (B)</p>
                            </div>
                        </div>

                        <div className="action-footer">
                            <button className="btn-cancel" onClick={handleGoBack}>Modify</button>
                            <button className="btn-finalize" onClick={handleDisbursement}>Finalize & Disburse</button>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default PayrollPreview;