import React, { useState } from "react";

// Organization Components
import Departments from "../Organization/Departments.jsx";
import Designations from "../Organization/Designations.jsx";
import Roles from "../Organization/Roles.jsx";
import LeaveType from "../Organization/LeaveType.jsx";

// Payroll Config Components
import SalaryComponents from "../PayrollConfig/SalaryComponents.jsx";
import PayGroup from "../PayrollConfig/PayGroup.jsx";
import Bank from "../PayrollConfig/Banks.jsx";
import PaymentMethod from "../PayrollConfig/PaymentMethods.jsx";

// System Parameters Components
import TaxSlabs from "./TaxSlabs.jsx";
import DeductionHeads from "./DeductionHeads.jsx";
import GlobalSettings from "./GlobalSettings.jsx";

import "./System-Config.css";

export default function SystemConfig() {
  const modules = [
    { id: 1, label: "Organization Setup", description: "Manage Departments, Designations, Roles & Leave", icon: "🏢" },
    { id: 2, label: "Payroll Config", description: "Manage Salary Components & Allowances", icon: "💰" },
    { id: 3, label: "System Parameters", description: "Edit salary, tax, deduction, allowances", icon: "⚙️" },
  ];

  const [activeModule, setActiveModule] = useState(null);

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
            {/* MODULE 1: Organization Setup */}
            {activeModule === 1 && (
              <div className="org-setup-container">
                <div className="full-width-section"><Departments /></div>
                <div className="full-width-section"><Designations /></div>
                <div className="full-width-section"><Roles /></div>
                <div className="full-width-section"><LeaveType /></div>
              </div>
            )}

            {/* MODULE 2: Payroll Config */}
            {activeModule === 2 && (
              <div className="payroll-config-container">
                <div className="full-width-section"><SalaryComponents /></div>
                <div className="full-width-section"><PayGroup /></div>
                <div className="full-width-section"><Bank /></div>
                <div className="full-width-section"><PaymentMethod /></div>
              </div>
            )}

            {/* MODULE 3: System Parameters */}
            {activeModule === 3 && (
              <div className="org-setup-container">
                <div className="full-width-section"><TaxSlabs /></div>
                <div className="full-width-section"><DeductionHeads /></div>
                <div className="full-width-section" style={{marginTop: '20px'}}>
                  <GlobalSettings />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}