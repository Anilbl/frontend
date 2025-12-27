import React from "react";
import Departments from "./Departments";
import Designations from "./Designations";
import Roles from "./Roles";
import "./OrgLayout.css";

export default function OrgLayout() {
  return (
    <div className="org-management-container">
      <h2 className="page-title">Organization Structure</h2>
      
      <div className="org-grid">
        {/* Top Row: Two Tables side by side */}
        <div className="grid-item">
          <Departments />
        </div>
        <div className="grid-item">
          <Designations />
        </div>
        
        {/* Bottom Row: One Table centered or full width */}
        <div className="grid-item full-width">
          <Roles />
        </div>
      </div>
    </div>
  );
}