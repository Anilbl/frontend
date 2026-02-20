import React, { useState, useEffect, useMemo } from 'react';
import api from "../../api/axios"; 
import './Payroll.css';

const AccountantPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // We remove the params object entirely. 
      // Your baseURL in axios.js is "http://localhost:8080/api"
      // This call becomes "http://localhost:8080/api/payrolls"
      const res = await api.get('/payrolls'); 
      
      console.log("SUCCESS! Records received:", res.data);
      setPayrolls(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("API ERROR DETAILS:");
      if (err.response) {
        // This will tell us if it's a 401 (Auth) or 400 (Bad Request)
        console.error("Status:", err.response.status);
        console.error("Server Message:", err.response.data);
      } else {
        console.error("Network Error:", err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, name) => {
    if (!window.confirm(`Verify payroll for ${name}?`)) return;
    try {
      // Corrected route to match your Java Controller @PutMapping("/{id}/status")
      await api.put(`/payrolls/${id}/status`, { status: "VERIFIED" });
      fetchData(); 
    } catch (err) {
      alert("Error updating status.");
    }
  };

  const { filteredData, pendingCount, paidCount } = useMemo(() => {
    if (!Array.isArray(payrolls)) return { filteredData: [], pendingCount: 0, paidCount: 0 };

    const search = searchQuery.toLowerCase();

    // 1. Calculate counts for the tabs (Case-insensitive check)
    const pCount = payrolls.filter(p => p.status?.toString().toUpperCase() !== 'PAID').length;
    const dCount = payrolls.filter(p => p.status?.toString().toUpperCase() === 'PAID').length;

    // 2. Filter the current visible data
    const data = payrolls.filter(p => {
      const statusUpper = p.status?.toString().toUpperCase() || "";
      
      // Determine if record belongs in current tab
      const isCorrectTab = activeTab === 'PENDING' 
        ? statusUpper !== 'PAID' 
        : statusUpper === 'PAID';
      
      // Search logic
      const fullName = `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.toLowerCase();
      const empId = (p.employee?.empId || "").toString();
      
      return isCorrectTab && (fullName.includes(search) || empId.includes(search));
    });

    return { filteredData: data, pendingCount: pCount, paidCount: dCount };
  }, [payrolls, searchQuery, activeTab]);
  
  return (
    <div className="payroll-view">
      <header className="payroll-glass-header">
        <div className="search-group">
          <span className="search-icon-svg">🔍</span>
          <input 
            type="text" 
            placeholder="Search by Employee Name or ID..." 
            className="unified-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="title-section">
        <h1>Payroll Verification</h1>
        <p>Nepal Labor Act Compliance • Fiscal Year 2081/82</p>
        
        <div className="tab-container" style={{marginTop: '20px'}}>
          <button 
            className={`tab-btn ${activeTab === 'PENDING' ? 'active' : ''}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Pending Verification ({pendingCount})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'PAID' ? 'active' : ''}`}
            onClick={() => setActiveTab('PAID')}
          >
            Payment History ({paidCount})
          </button>
        </div>
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
            {loading ? (
              <tr><td colSpan="6" className="empty-state">Syncing data from server...</td></tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((p) => (
                <tr key={p.payrollId}>
                  <td><span className="mono">#{p.employee?.empId || 'N/A'}</span></td>
                  <td>
                    <div className="name-stack">
                      <span className="full-name">{p.employee?.firstName} {p.employee?.lastName}</span>
                      <span className="role-sub-label">{p.employee?.designation || 'Staff'}</span>
                    </div>
                  </td>
                  <td className="mono">{p.grossSalary?.toLocaleString() || 0}</td>
                  <td className="mono-success">Rs. {p.netSalary?.toLocaleString() || 0}</td>
                  <td>
                    <span className={`status-pill ${p.status?.toLowerCase() || 'pending'}`}>
                      {p.status || 'PENDING'}
                    </span>
                  </td>
                  <td className="text-right">
                    {p.status?.toUpperCase() !== "VERIFIED" && p.status?.toUpperCase() !== "PAID" ? (
                      <button className="btn-verify-active" onClick={() => handleVerify(p.payrollId, p.employee?.firstName)}>Verify</button>
                    ) : (
                      <button className="btn-finalized" disabled>
                        {p.status?.toUpperCase() === "PAID" ? "Paid ✓" : "Verified ✓"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-state">
                  No records found in {activeTab.toLowerCase()} status.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountantPayroll;