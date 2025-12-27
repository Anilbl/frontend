import React, { useState } from "react";

// Imports from the Organization folder
import Departments from "../Organization/Departments.jsx";
import Designations from "../Organization/Designations.jsx";
import Roles from "../Organization/Roles.jsx";
import LeaveType from "../Organization/LeaveType.jsx";

// Imports from Payroll Config folder
import SalaryComponentType from "../PayrollConfig/SalaryComponentType.jsx";
import SalaryComponents from "../PayrollConfig/SalaryComponents.jsx";
import SalaryGrade from "../PayrollConfig/SalaryGrade.jsx";
import PayGroup from "../PayrollConfig/PayGroup.jsx";
import GradeSalaryComponent from "../PayrollConfig/GradeSalaryComponent.jsx";
import TaxSlabs from "./TaxSlabs.jsx";
import DeductionHeads from "./DeductionHeads.jsx";
import GlobalSettings from "./GlobalSettings.jsx";
// Placeholder component

import "./System-Config.css";

export default function SystemConfig() {
  const modules = [
    { id: 1, label: "Organization Setup", description: "Manage Departments, Designations, Roles & Leave", icon: "🏢" },
    { id: 2, label: "Payroll Config", description: "Manage Salary Components & Allowances", icon: "💰" },
    { id: 3, label: "System Parameters", description: "Edit salary, tax, deduction, allowances", icon: "⚙️" },
  ];

  const initialSystemParams = [
    { id: 1, key: "Basic Salary", value: "30000", description: "Default basic salary for employees", icon: "💰" },
    { id: 2, key: "HRA", value: "5000", description: "Housing allowance", icon: "🏠" },
    { id: 3, key: "Tax Rate", value: "10%", description: "Income tax percentage", icon: "📊" },
    { id: 4, key: "Tax Slabs", value: "0-25000:5%, 25001-50000:10%", description: "Define tax slab ranges", icon: "📋" },
    { id: 5, key: "Deduction Heads", value: "Provident Fund, Professional Tax", description: "Deduction types", icon: "📝" },
    { id: 6, key: "Overtime Rate", value: "1.5", description: "Overtime multiplier", icon: "⚡" },
    { id: 7, key: "Allowance HRA", value: "5000", description: "Housing allowance", icon: "🏠" },
  ];

  const [activeModule, setActiveModule] = useState(null);
  const [systemParams, setSystemParams] = useState(initialSystemParams);
  const [editingId, setEditingId] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const handleEdit = (item) => {
    setEditingId(item.id);
    setInputValue(item.value);
  };

  const handleChange = (e) => setInputValue(e.target.value);

  const handleUpdate = () => {
    if (inputValue.trim() === "") return;
    setSystemParams(systemParams.map(item => item.id === editingId ? { ...item, value: inputValue } : item));
    setEditingId(null);
    setInputValue("");
  };

  const handleCancel = () => {
    setEditingId(null);
    setInputValue("");
  };

  return (
    <div className="system-config-page">
      {!activeModule && (
        <>
          <header className="config-header">
            <h1>System Configuration</h1>
            <p>Select a module to manage master data or system parameters</p>
          </header>
          <div className="config-modules-grid">
            {modules.map(mod => (
              <div
                key={mod.id}
                className="config-module-card"
                onClick={() => setActiveModule(mod.id)}
              >
                <div className="module-icon">{mod.icon}</div>
                <h3 className="module-label">{mod.label}</h3>
                <p className="module-desc">{mod.description}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {activeModule && (
        <div className="active-module-view">
          <div className="module-header">
            <button className="back-btn" onClick={() => setActiveModule(null)}>
              ← Back to Modules
            </button>
            <h2>{modules.find(m => m.id === activeModule)?.label}</h2>
          </div>

          <div className="module-content">
            {/* ORGANIZATION SETUP: Symmetrical 2x2 Grid */}
           {/* ORGANIZATION SETUP: Symmetrical 2x2 Grid */}
{activeModule === 1 && (
  <div className="org-setup-container">
    {/* Row 1: Departments & Designations */}
    <div className="split-screen-layout">
      <div className="column-half">
        <Departments />
      </div>
      <div className="column-half">
        <Designations />
      </div>
    </div>
    
    {/* Row 2: Roles & Leave Type */}
    <div className="split-screen-layout">
      <div className="column-half">
        <Roles />
      </div>
      <div className="column-half">
        {/* ✅ Placeholder replaced with the actual LeaveType component */}
        <LeaveType />
      </div>
    </div>
  </div>
)}
           {/* PAYROLL CONFIG MODULE: Split screen for Component Types and Components */}
{activeModule === 2 && (
  <div className="org-setup-container">
    <div className="split-screen-layout">
      {/* Left Column: Classification (Allowance, Deduction, etc.) */}
      <div className="column-half">
        <SalaryComponentType />
      </div>

      {/* Right Column: Actual Components (HRA, Basic, PF, etc.) */}
      <div className="column-half">
        {/* If SalaryComponents isn't fully ready yet, use this placeholder structure */}
        <SalaryComponents /> 
      </div>
    </div>

    {/* Row 2: Future tables like Salary Grade and Pay Group will go here */}
   {/* Row 2 of Payroll Config */}
<div className="split-screen-layout">
  <div className="column-half">
    <SalaryGrade />
  </div>
  <div className="column-half">
    <PayGroup />
  </div>
  
</div>
{/* FULL WIDTH: The Brain/Rule Engine */}
    <div className="full-width-section">
       <GradeSalaryComponent />
    </div>
  </div>
)}

          {activeModule === 3 && (
  <div className="org-setup-container">
    <div className="split-screen-layout">
      <div className="column-half">
        <TaxSlabs />
      </div>
      <div className="column-half">
        <DeductionHeads />
      </div>
    </div>
    
    {/* Full width bottom section for System Config (Key-Value pairs) */}
    <div className="full-width-section" style={{marginTop: '20px'}}>
       <div className="placeholder-container">
         <GlobalSettings />
           </div>
    </div>
  </div>
)}
          </div>
        </div>
      )}
    </div>
  );
}