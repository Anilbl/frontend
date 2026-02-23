import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { processEmployeePayroll } from "../../api/payrollApi";
import api from "../../api/axios";

const PayrollPreview = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    
    // Role detection for dynamic redirection
    const userSession = JSON.parse(localStorage.getItem("user_session"));
    const userRole = userSession?.role?.roleName || userSession?.role || "";
    const isAccountant = userRole.toUpperCase().includes("ACCOUNTANT");
    
    // Dynamic Base Route: Prevents redirecting an Accountant to an Admin page (which causes login redirects)
    const baseRoute = isAccountant ? "/accountant" : "/admin";
    const fallbackPath = isAccountant ? "/accountant/payroll-processing" : "/admin/payroll";

    const data = state?.previewData;
    const selectedPaymentMethodId = state?.selectedPaymentMethodId;

    useEffect(() => {
        if (!data) navigate(fallbackPath);
    }, [data, navigate, fallbackPath]);

    if (!data) return null;

    // Calculation for Taxable Section
    const totalDeductionsForTax = (data.ssfContribution || 0) + (data.citContribution || 0);
    const taxableIncome = (data.grossSalary || 0) - totalDeductionsForTax;

    const redirectToEsewa = (paymentData) => {
        const form = document.createElement('form');
        form.setAttribute('method', 'POST');
        form.setAttribute('action', paymentData.esewa_url);
        const fields = {
            "amount": paymentData.amount,
            "tax_amount": "0",
            "total_amount": paymentData.total_amount,
            "transaction_uuid": paymentData.transaction_uuid,
            "product_code": paymentData.product_code,
            "product_service_charge": "0",
            "product_delivery_charge": "0",
            "success_url": "http://localhost:8080/api/esewa/success",
            "failure_url": `http://localhost:5173${baseRoute}/payroll?status=failed`,
            "signed_field_names": "total_amount,transaction_uuid,product_code",
            "signature": paymentData.signature,
            "customer_id": paymentData.customer_id 
        };
        for (const key in fields) {
            const input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', key);
            input.setAttribute('value', fields[key]);
            form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
    };

    const handleConfirm = async () => {
        if (isProcessing) return;

        // Validation to prevent "uncontrolled input" error on backend
        if (!selectedPaymentMethodId) {
            alert("Payment Method ID is missing. Please go back and re-select.");
            return;
        }

        try {
            setIsProcessing(true);
            const savedPayroll = await processEmployeePayroll({
                empId: data.employee?.empId,
                festivalBonus: data.festivalBonus ?? 0, 
                bonuses: data.otherBonuses ?? 0, 
                citContribution: data.citContribution ?? 0,
                paymentMethodId: selectedPaymentMethodId 
            });

            const actualId = savedPayroll?.payrollId || savedPayroll?.id || savedPayroll?.data?.payrollId;
            if (!actualId) throw new Error("Invalid Payroll ID received from server.");
            
            const response = await api.get(`/esewa/initiate/${actualId}`);
            redirectToEsewa(response.data);
        } catch (err) {
            alert("Transaction Error: " + (err.response?.data?.message || err.message));
            setIsProcessing(false);
        }
    };

    const formatCurrency = (val) => (val ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

    return (
        <div className="payroll-preview-wrapper" style={{ padding: '40px 20px', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <div className="premium-preview-card" style={{ maxWidth: '700px', margin: 'auto', background: '#fff', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                <div className="preview-header" style={{ padding: '30px', background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', color: '#fff', textAlign: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '24px' }}>Final Payroll Review</h2>
                    <div style={{ marginTop: '10px', padding: '8px 15px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', display: 'inline-block' }}>
                        <strong>{data.employee?.firstName} {data.employee?.lastName}</strong>
                        <span style={{ margin: '0 10px' }}>|</span>
                        <span>{data.payPeriodStart} to {data.payPeriodEnd}</span>
                    </div>
                    <div style={{fontSize: '12px', opacity: 0.8, marginTop: '8px'}}>{data.remarks}</div>
                </div>
                
                <div className="preview-body" style={{ padding: '30px' }}>
                    {/* EARNINGS SECTION */}
                    <div className="section" style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: '#27ae60', textTransform: 'uppercase', fontSize: '13px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Earnings (+)</h4>
                        <div style={rowStyle}>
                            <span>Earned Basic Salary</span>
                            <span>Rs. {formatCurrency(data.basicSalary)}</span>
                        </div>
                        <div style={rowStyle}>
                            <span>Allowances</span>
                            <span>Rs. {formatCurrency(data.totalAllowances)}</span>
                        </div>
                        <div style={rowStyle}>
                            <span>Overtime Pay</span>
                            <span>+ Rs. {formatCurrency(data.overtimePay)}</span>
                        </div>
                        <div style={{ ...rowStyle, color: '#27ae60' }}>
                            <span>Bonuses (Festival/Other)</span>
                            <span>+ Rs. {formatCurrency((data.festivalBonus || 0) + (data.otherBonuses || 0))}</span> 
                        </div>
                        <div style={{ ...rowStyle, borderTop: '2px solid #eee', marginTop: '10px', fontWeight: '800' }}>
                            <span>TOTAL GROSS SALARY</span>
                            <span>Rs. {formatCurrency(data.grossSalary)}</span>
                        </div>
                    </div>

                    {/* DEDUCTIONS SECTION (SSF & CIT) */}
                    <div className="section" style={{ marginBottom: '25px' }}>
                        <h4 style={{ color: '#e67e22', textTransform: 'uppercase', fontSize: '13px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Statutory Deductions (-)</h4>
                        <div style={rowStyle}>
                            <span>SSF Contribution (11%)</span>
                            <span style={{ color: '#e74c3c' }}>- Rs. {formatCurrency(data.ssfContribution)}</span>
                        </div>
                        <div style={rowStyle}>
                            <span>CIT Contribution</span>
                            <span style={{ color: '#e74c3c' }}>- Rs. {formatCurrency(data.citContribution)}</span>
                        </div>
                    </div>

                    {/* TAX CALCULATION SECTION */}
                    <div className="section" style={{ marginBottom: '25px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px' }}>
                        <h4 style={{ color: '#2c3e50', textTransform: 'uppercase', fontSize: '13px', marginBottom: '10px' }}>Tax Calculation</h4>
                        <div style={rowStyle}>
                            <span>Taxable Income (Gross - Deductions)</span>
                            <span style={{ fontWeight: '600' }}>Rs. {formatCurrency(taxableIncome)}</span>
                        </div>
                        <div style={rowStyle}>
                            <span>Income Tax (Monthly TDS)</span>
                            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>- Rs. {formatCurrency(data.totalTax)}</span>
                        </div>
                    </div>

                    {/* NET PAYABLE BOX */}
                    <div className="total-box" style={{ background: '#2c3e50', padding: '25px', borderRadius: '12px', textAlign: 'center', color: '#fff' }}>
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>NET PAYABLE AMOUNT</span>
                        <h1 style={{ margin: '10px 0 0', fontSize: '36px', fontWeight: '800' }}>
                            Rs. {formatCurrency(data.netSalary)}
                        </h1>
                    </div>

                    <div className="footer-actions" style={{ marginTop: '30px', display: 'flex', gap: '15px' }}>
                        <button disabled={isProcessing} onClick={() => navigate(fallbackPath)} style={btnSecondary}>Cancel & Edit</button>
                        <button disabled={isProcessing} onClick={handleConfirm} style={isProcessing ? {...btnPrimary, opacity: 0.7} : btnPrimary}>
                            {isProcessing ? "Redirecting to eSewa..." : "Confirm & Disburse"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '15px' };
const btnPrimary = { flex: 2, padding: '15px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' };
const btnSecondary = { flex: 1, padding: '15px', background: '#fff', color: '#7f8c8d', border: '1px solid #dcdde1', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' };

export default PayrollPreview;