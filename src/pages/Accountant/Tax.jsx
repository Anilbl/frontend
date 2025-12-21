import React from 'react';
import './Tax.css';

const Tax = () => {
  const taxSlabs = [
    { id: "01", range: "Up to Rs. 500,000", rate: "1%", category: "Social Security Tax", status: "Active" },
    { id: "02", range: "Rs. 500,001 - Rs. 700,000", rate: "10%", category: "Income Tax", status: "Active" },
    { id: "03", range: "Rs. 700,001 - Rs. 1,000,000", rate: "20%", category: "Income Tax", status: "Active" },
    { id: "04", range: "Above Rs. 1,000,000", rate: "30%", category: "Income Tax", status: "Active" }
  ];

  return (
    <div className="tax-page-container">
      <div className="tax-header-section">
        <div>
          <h1 className="tax-title">Tax & Compliance</h1>
          <p className="tax-subtitle">Government Tax Slabs and SSF Regulations for FY 2025/26</p>
        </div>
        <button className="btn-update-reg">Update Regulations</button>
      </div>

      {/* This Card Wrapper adds the "Professional" feel */}
      <div className="tax-data-card">
        <div className="card-top-bar">
          <h3>Active Tax Slabs</h3>
          <span className="last-sync">System Verified: Dec 2025</span>
        </div>
        
        <div className="table-responsive-wrapper">
          <table className="tax-professional-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Annual Income Range</th>
                <th>Tax Rate</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {taxSlabs.map((slab) => (
                <tr key={slab.id}>
                  <td className="text-muted">#{slab.id}</td>
                  <td className="text-bold-slate">{slab.range}</td>
                  <td><span className="rate-pill-indigo">{slab.rate}</span></td>
                  <td>{slab.category}</td>
                  <td><span className="status-dot-green">● {slab.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tax;