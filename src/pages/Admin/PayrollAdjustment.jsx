import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import "./PayrollAdjustment.css";

const PayrollAdjustment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const isAdmin = useMemo(() => location.pathname.includes("/admin"), [location.pathname]);

    // Initialize state from navigation location OR session storage for persistence on refresh
    const [payrollContext, setPayrollContext] = useState(() => {
        if (location.state?.empId) return location.state;
        const saved = sessionStorage.getItem("active_payroll_adjustment");
        return saved ? JSON.parse(saved) : null;
    });

    // --- State for core values sent from the Payroll Command Center ---
    const [earnedSalary, setEarnedSalary] = useState(payrollContext?.earnedSalary ?? 0);
    const [ssfContribution, setSsfContribution] = useState(payrollContext?.ssfContribution ?? 0);
    const [houseRentAllowance, setHouseRentAllowance] = useState(payrollContext?.houseRentAllowance ?? 0);
    const [dearnessAllowance, setDearnessAllowance] = useState(payrollContext?.dearnessAllowance ?? 0);

    const [dbComponents, setDbComponents] = useState([]);
    const [selectedComponents, setSelectedComponents] = useState(payrollContext?.extraComponents || []);
    const [newCompId, setNewCompId] = useState("");
    const [tempAmount, setTempAmount] = useState("");
    const [tempType, setTempType] = useState("EARNING");

    const getPayrollHomePath = () => isAdmin ? "/admin/payroll" : "/accountant/payroll-processing";

    // --- Sync progress to Session Storage to prevent data loss ---
    useEffect(() => {
        if (payrollContext?.empId) {
            const stateToSave = {
                ...payrollContext,
                earnedSalary,
                ssfContribution,
                houseRentAllowance,
                dearnessAllowance,
                extraComponents: selectedComponents
            };
            sessionStorage.setItem("active_payroll_adjustment", JSON.stringify(stateToSave));
        }
    }, [earnedSalary, ssfContribution, houseRentAllowance, dearnessAllowance, selectedComponents, payrollContext]);

    // --- Fetch Dynamic Components (Filtered) ---
    useEffect(() => {
        api.get("/salary-components")
            .then((res) => {
                // We exclude the 4 main components already handled in the summary strip
                const fixed = ["dearness allowance", "house rent allowance", "ssf", "ssf contribution", "basic salary"];
                const filtered = res.data
                    .filter(c => !fixed.includes(c.componentName.toLowerCase()))
                    .sort((a, b) => a.componentName.localeCompare(b.componentName));
                setDbComponents(filtered);
            })
            .catch((err) => console.error("Error fetching components", err));
    }, []);

    const handleAddComponent = () => {
        if (!newCompId || !tempAmount || parseFloat(tempAmount) <= 0) {
            alert("Please select a component and enter a valid amount.");
            return;
        }
        const comp = dbComponents.find(c => String(c.componentId) === newCompId);
        if (selectedComponents.some(s => String(s.id) === String(newCompId))) {
            alert("This component is already in your adjustment list.");
            return;
        }

        if (comp) {
            const newEntry = {
                id: comp.componentId,
                label: comp.componentName,
                amount: parseFloat(tempAmount),
                type: tempType 
            };
            setSelectedComponents(prev => [...prev, newEntry]);
            setNewCompId(""); setTempAmount(""); setTempType("EARNING"); 
        }
    };

    const handleProceed = async () => {
        try {
            const payload = {
                empId: payrollContext.empId,
                year: payrollContext.year,
                month: payrollContext.month,
                earnedSalary: parseFloat(earnedSalary || 0), 
                ssfContribution: parseFloat(ssfContribution || 0),
                houseRentAllowance: parseFloat(houseRentAllowance || 0),
                dearnessAllowance: parseFloat(dearnessAllowance || 0),
                extraComponents: selectedComponents 
            };

            const res = await api.post("/payrolls/preview", payload);
            const basePath = getPayrollHomePath();

            navigate(`${basePath}/preview`, { 
                state: { 
                    previewData: res.data, 
                    originalPayload: {
                        ...payload,
                        fullName: payrollContext.fullName, 
                        paymentMethodId: payrollContext.paymentMethodId,
                        payPeriodStart: payrollContext.payPeriodStart
                    } 
                } 
            });
        } catch (err) {
            alert(err.response?.data?.message || "Calculation failed.");
        }
    };

    const handleCancel = () => {
        sessionStorage.removeItem("active_payroll_adjustment");
        navigate(getPayrollHomePath());
    };

    if (!payrollContext?.empId) {
        return (
            <div className="adj-loading">
                <p>No active payroll session found.</p>
                <button className="btn-primary" onClick={handleCancel}>Back to Payroll</button>
            </div>
        );
    }

    return (
        <div className="adj-container">
            <div className="adj-glass-wrapper">
                <header className="adj-header">
                    <div className="adj-title-box">
                        <h1>Payroll Adjustment</h1>
                        <p>Employee: <strong>{payrollContext.fullName}</strong> (ID: {payrollContext.empId})</p>
                    </div>
                    <div className="adj-period-badge">{payrollContext.month} {payrollContext.year}</div>
                </header>

                <div className="adj-summary-strip">
                    <div className="summary-item highlight-item">
                        <label>EARNED SALARY</label>
                        <input 
                            type="number" 
                            value={earnedSalary} 
                            onChange={(e) => setEarnedSalary(e.target.value)} 
                            className="adj-mini-input salary-highlight" 
                        />
                    </div>
                    <div className="summary-item">
                        <label>SSF (11%)</label>
                        <input 
                            type="number" 
                            value={ssfContribution} 
                            onChange={(e) => setSsfContribution(e.target.value)} 
                            className="adj-mini-input" 
                        />
                    </div>
                    <div className="summary-item">
                        <label>HOUSE RENT</label>
                        <input 
                            type="number" 
                            value={houseRentAllowance} 
                            onChange={(e) => setHouseRentAllowance(e.target.value)} 
                            className="adj-mini-input" 
                        />
                    </div>
                    <div className="summary-item">
                        <label>DEARNESS</label>
                        <input 
                            type="number" 
                            value={dearnessAllowance} 
                            onChange={(e) => setDearnessAllowance(e.target.value)} 
                            className="adj-mini-input" 
                        />
                    </div>
                </div>

                <section className="adj-selector-section">
                    <div className="adj-input-row">
                        <div className="input-col-select">
                            <label className="field-tiny-label">OTHER COMPONENTS</label>
                            <select value={newCompId} onChange={(e) => setNewCompId(e.target.value)} className="adj-select-field">
                                <option value="">Select Component</option>
                                {dbComponents.map(c => (
                                    <option key={c.componentId} value={c.componentId}>{c.componentName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-col-type">
                            <label className="field-tiny-label">TYPE</label>
                            <select value={tempType} onChange={(e) => setTempType(e.target.value)} className="adj-select-field">
                                <option value="EARNING">Earning (+)</option>
                                <option value="DEDUCTION">Deduction (-)</option>
                            </select>
                        </div>
                        <div className="input-col-amount">
                            <label className="field-tiny-label">AMOUNT</label>
                            <input 
                                type="number" 
                                className="adj-input-field" 
                                value={tempAmount} 
                                onChange={(e) => setTempAmount(e.target.value)} 
                            />
                        </div>
                        <button className="adj-add-btn-fixed" onClick={handleAddComponent}>Add</button>
                    </div>
                </section>

                <section className="adj-list-section">
                    <h3 className="queue-title">Adjustment Queue</h3>
                    <div className="adj-queue-box">
                        {selectedComponents.map((comp) => (
                            <div key={comp.id} className={`queue-card ${comp.type.toLowerCase()}`}>
                                <div className="queue-info">
                                    <span className="queue-label">{comp.label}</span>
                                    <span className={`queue-tag ${comp.type.toLowerCase()}`}>{comp.type}</span>
                                </div>
                                <div className="queue-actions">
                                    <span className="queue-val">Rs. {comp.amount.toLocaleString()}</span>
                                    <button 
                                        className="queue-rm" 
                                        onClick={() => setSelectedComponents(prev => prev.filter(s => s.id !== comp.id))}
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                        ))}
                        {selectedComponents.length === 0 && <p className="empty-msg">No additional components added.</p>}
                    </div>
                </section>

                <footer className="adj-footer">
                    <button className="btn-secondary" onClick={handleCancel}>Cancel & Exit</button>
                    <button className="btn-primary" onClick={handleProceed}>Preview Breakdown &rarr;</button>
                </footer>
            </div>
        </div>
    );
};

export default PayrollAdjustment;