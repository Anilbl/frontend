import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import "./PayrollAdjustment.css";

const PayrollAdjustment = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine role based on URL path
    const isAdmin = useMemo(() => location.pathname.includes("/admin"), [location.pathname]);

    // 1. Recover state: Priority 1: Navigation state | Priority 2: Session Storage
    const [payrollContext, setPayrollContext] = useState(() => {
        if (location.state?.employee) return location.state;
        const saved = sessionStorage.getItem("active_payroll_adjustment");
        return saved ? JSON.parse(saved) : null;
    });

    // 2. Local States
    const [dbComponents, setDbComponents] = useState([]);
    const [selectedComponents, setSelectedComponents] = useState(payrollContext?.persistedAdjustments || []);
    const [festivalBonus, setFestivalBonus] = useState(payrollContext?.initialInputs?.festivalBonus ?? 0);
    const [otherBonus, setOtherBonus] = useState(payrollContext?.initialInputs?.bonuses ?? 0);
    const [citContribution, setCitContribution] = useState(payrollContext?.initialInputs?.citContribution ?? 0);

    const [newCompId, setNewCompId] = useState("");
    const [tempAmount, setTempAmount] = useState("");
    const [tempType, setTempType] = useState("EARNING");

    const getPayrollHomePath = () => {
        return isAdmin ? "/admin/payroll" : "/accountant/payroll-processing";
    };

    // 3. Persist progress
    useEffect(() => {
        if (payrollContext?.employee) {
            const stateToSave = {
                ...payrollContext,
                initialInputs: { festivalBonus, bonuses: otherBonus, citContribution },
                persistedAdjustments: selectedComponents
            };
            sessionStorage.setItem("active_payroll_adjustment", JSON.stringify(stateToSave));
        }
    }, [festivalBonus, otherBonus, citContribution, selectedComponents, payrollContext]);

    // Fetch Components
    useEffect(() => {
        api.get("/salary-components")
            .then((res) => {
                const fixed = ["dearness allowance", "house rent allowance", "ssf", "basic salary"];
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
                empId: payrollContext.employee.empId,
                year: payrollContext.year,
                month: payrollContext.month,
                festivalBonus: parseFloat(festivalBonus || 0),
                bonuses: parseFloat(otherBonus || 0),
                citContribution: parseFloat(citContribution || 0),
                extraComponents: selectedComponents 
            };

            const res = await api.post("/payrolls/preview", payload);
            const basePath = getPayrollHomePath();

            navigate(`${basePath}/preview`, { 
                state: { 
                    previewData: res.data, 
                    originalPayload: payload 
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

    if (!payrollContext?.employee) {
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
                        <p>Employee: <strong>{payrollContext.employee?.fullName || `${payrollContext.employee?.firstName} ${payrollContext.employee?.lastName}`}</strong></p>
                    </div>
                    <div className="adj-period-badge">{payrollContext.month} {payrollContext.year}</div>
                </header>

                <div className="adj-summary-strip">
                    <div className="summary-item">
                        <label>FESTIVAL BONUS</label>
                        <input type="number" value={festivalBonus} onChange={(e) => setFestivalBonus(e.target.value)} className="adj-mini-input" />
                    </div>
                    <div className="summary-item">
                        <label>OTHER BONUSES</label>
                        <input type="number" value={otherBonus} onChange={(e) => setOtherBonus(e.target.value)} className="adj-mini-input" />
                    </div>
                    <div className="summary-item">
                        <label>CIT (Rs.)</label>
                        <input type="number" value={citContribution} onChange={(e) => setCitContribution(e.target.value)} className="adj-mini-input" />
                    </div>
                </div>

                <section className="adj-selector-section">
                    <div className="adj-input-row">
                        <div className="input-col-select">
                            <label className="field-tiny-label">COMPONENT</label>
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
                            <input type="number" className="adj-input-field" value={tempAmount} onChange={(e) => setTempAmount(e.target.value)} />
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
                                    <button className="queue-rm" onClick={() => setSelectedComponents(prev => prev.filter(s => s.id !== comp.id))}>&times;</button>
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