import React, { useState, useEffect } from 'react';
// FIXED: Using your authenticated instance from src/api/axios.js
import api from "../../api/axios"; 
import './Payroll.css';

const AccountantPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Logic: Uses interceptor to automatically add the Bearer token
      const res = await api.get('/payrolls'); 
      setPayrolls(res.data);
    } catch (err) {
      console.error("System Error: Connection to backend failed.", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, firstName, lastName) => {
    const fullName = `${firstName} ${lastName || ""}`.trim();
    if (window.confirm(`Confirm financial verification for ${fullName}?`)) {
      try {
        // Logic: Send authenticated PUT request
        await api.put(`/payrolls/${id}/status`, { 
          status: "VERIFIED" 
        });
        alert(`Success: ${fullName}'s record verified.`);
        fetchData(); 
      } catch (err) {
        console.error("Verification failed:", err);
        alert("Action Failed: Could not reach the server. Ensure the Backend is running.");
      }
    }
  };

  const filteredRecords = payrolls.filter(p => {
    const fName = p.employee?.firstName || p.employeeName || "";
    const lName = p.employee?.lastName || "";
    const combined = `${fName} ${lName}`.toLowerCase();
    const id = (p.empId || p.payrollId || "").toString();
    return combined.includes(searchQuery.toLowerCase()) || id.includes(searchQuery);
  });

  if (loading) return <div className="loading-state">Securing Connection...</div>;

  return (
    <div className="payroll-view">
      <div className="payroll-glass-header">
        <div className="search-group">
          <span className="search-icon-svg">🔍</span>
          <input 
            type="text" 
            placeholder="Search by Name or ID..." 
            className="unified-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="user-profile-tag">
          <div className="pulse-dot"></div>
          <div className="tag-text">
            <strong>Finance Accountant</strong>
            <span>Treasury Dept</span>
          </div>
        </div>
      </div>

      <div className="payroll-body">
        <div className="title-section">
          <h1>Payroll Verification</h1>
          <p>Nepal Labor Act Compliance • Fiscal Year 2081/82</p>
        </div>

        <div className="table-card">
          <table className="verify-table">
            <thead>
              <tr>
                <th>EMP ID</th>
                <th>EMPLOYEE NAME</th>
                <th>GROSS (RS)</th>
                <th>NET AMOUNT</th>
                <th>STATUS</th>
                <th className="text-right">OPERATIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((p) => {
                const status = p.status ? p.status.toUpperCase() : "PENDING";
                const isActionable = status !== "VERIFIED";
                const fName = p.employee?.firstName || p.employeeName || "User";
                const lName = p.employee?.lastName || "";

                return (
                  <tr key={p.payrollId}>
                    <td className="id-col">#{p.empId || p.payrollId}</td>
                    <td>
                      <div className="name-stack">
                        <span className="full-name">{fName} {lName}</span>
                        <span className="role-sub-label">Permanent Staff</span>
                      </div>
                    </td>
                    <td className="mono">{p.grossSalary?.toLocaleString()}</td>
                    <td className="mono-success">Rs. {p.netSalary?.toLocaleString()}</td>
                    <td>
                      <span className={`status-pill ${status.toLowerCase()}`}>
                        {status === "VERIFIED" ? "Sent to Admin" : status}
                      </span>
                    </td>
                    <td className="text-right">
                      {isActionable ? (
                        <button 
                          className="btn-verify-active"
                          onClick={() => handleVerify(p.payrollId, fName, lName)}
                        >
                          Verify Record
                        </button>
                      ) : (
                        <button className="btn-finalized" disabled>
                          Verified ✓
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountantPayroll;