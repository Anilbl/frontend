import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { 
  getEmployeeHistory, 
  voidPayrollRecord, 
  emailPayslip 
} from "../../api/payrollApi";
import "./Payroll.css";

// Separate History Modal Component
const HistoryModal = ({ isOpen, onClose, history, employeeName }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const availableYears = useMemo(() => {
    const years = [];
    for (let y = new Date().getFullYear(); y >= 2020; y--) years.push(y.toString());
    return years;
  }, []);

  if (!isOpen) return null; 

  // Added safety check for history array
  const yearlyHistory = (history || []).filter(h => 
    h.payDate && new Date(h.payDate).getFullYear().toString() === selectedYear
  );

  return (
    <div className="modal-overlay">
      <div className="history-modal-content large">
        <div className="modal-header">
          <div>
            <h2 className="header-title">Payroll Audit: {employeeName}</h2>
            <p className="header-subtitle">Statutory deductions (SSF/CIT/Tax)</p>
          </div>
          <div className="modal-controls">
            <select className="year-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="modal-body">
          <table className="history-table" style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: '#f8fafc'}}>
                <th>Pay Date</th>
                <th>Gross Salary</th>
                <th>SSF (11%)</th>
                <th>CIT</th>
                <th>Tax</th>
                <th>Net Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {yearlyHistory.length > 0 ? yearlyHistory.map(h => (
                <tr key={h.payrollId} className={h.status === "VOIDED" ? "row-voided" : ""}>
                  <td>{h.payDate ? new Date(h.payDate).toLocaleDateString() : "N/A"}</td>
                  <td>Rs. {h.grossSalary?.toLocaleString() || 0}</td>
                  <td>- {h.ssfContribution?.toLocaleString() || 0}</td>
                  <td>- {h.citContribution?.toLocaleString() || 0}</td>
                  <td>Rs. {h.totalTax?.toLocaleString() || 0}</td>
                  <td className="bold">Rs. {h.netSalary?.toLocaleString() || 0}</td>
                  <td><span className={`status-badge status-${h.status?.toLowerCase().replace('_', '-') || 'default'}`}>{h.status}</span></td>
                </tr>
              )) : <tr><td colSpan="7" style={{textAlign:'center', padding:'20px'}}>No records found for this year.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PayrollManagement = () => {
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]); 
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedEmpName, setSelectedEmpName] = useState("");
  const [processingInputs, setProcessingInputs] = useState({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pRes, eRes, mRes] = await Promise.all([
        api.get("/payrolls"), 
        api.get("/employees"),
        api.get("/payment-methods")
      ]);
      setPayrolls(pRes.data || []);
      setEmployees(eRes.data || []);
      setPaymentMethods(mRes.data || []);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleInputChange = (empId, field, val) => {
    setProcessingInputs(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || { festivalBonus: 0, otherBonus: 0, citContribution: 0, paymentMethodId: "" }),
        [field]: val
      }
    }));
  };

  const handleActionRun = async (emp) => {
    const empId = emp.empId;
    const inputs = processingInputs[empId] || {};
    
    if (!inputs.paymentMethodId) {
        alert(`Please select a Payment Method for ${emp.firstName}`);
        return;
    }

    try {
        const payload = {
            empId: parseInt(empId), 
            festivalBonus: parseFloat(inputs.festivalBonus || 0),
            bonuses: parseFloat(inputs.otherBonus || 0),
            citContribution: parseFloat(inputs.citContribution || 0)
        };

        const res = await api.post("/payrolls/preview", payload);
        
        navigate("/admin/payroll/preview", { 
            state: { 
                previewData: res.data,
                selectedPaymentMethodId: inputs.paymentMethodId 
            } 
        });
    } catch (err) {
        console.error("Preview Error:", err);
        const errorMsg = err.response?.data?.message || "Preview failed. Please check backend logs.";
        alert("Error: " + errorMsg);
    }
  };

  const handleEmail = async (id) => {
    try { 
        await emailPayslip(id); 
        alert("Email sent successfully."); 
    } catch (err) { 
        alert("Email failed. Check mail server configuration."); 
    }
  };

  const handleVoid = async (p) => {
    if (window.confirm(`Are you sure you want to VOID payroll for ${p.employee?.firstName}? This cannot be undone.`)) {
      try { 
        await voidPayrollRecord(p.payrollId); 
        fetchData(); 
      } catch (err) { alert("Void operation failed."); }
    }
  };

  const handleViewHistory = async (emp) => {
    try {
      const res = await getEmployeeHistory(emp.empId);
      setHistoryData(res.data || []);
      setSelectedEmpName(`${emp.firstName} ${emp.lastName}`);
      setIsHistoryOpen(true);
    } catch (err) { console.error(err); }
  };

  const latestPayrollsMap = useMemo(() => {
    const map = new Map();
    if (!payrolls) return map;
    [...payrolls].sort((a,b) => b.payrollId - a.payrollId).forEach(p => {
      if(p.employee && !map.has(p.employee.empId)) map.set(p.employee.empId, p);
    });
    return map;
  }, [payrolls]);

  if (loading) return <div className="loading-spinner">Synchronizing Payroll Data...</div>;

  return (
    <div className="payroll-container">
      <div className="payroll-header-section">
        <div>
          <h1 className="header-title">Payroll Command Center</h1>
          <p className="header-subtitle">Nepal Automated Tax System</p>
        </div>
        <input className="search-bar" placeholder="Search Employee..." onChange={(e)=>setSearch(e.target.value)} />
      </div>

      <div className="payroll-card">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Basic Salary</th>
              <th>Festival Bonus</th>
              <th>Other Bonus</th>
              <th>CIT</th>
              <th>Payment Method</th>
              <th>Status</th>
              <th style={{textAlign: 'center'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(employees || [])
              .filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()))
              .map(emp => {
                const latest = latestPayrollsMap.get(emp.empId);
                const isFullyPaid = latest && latest.status === "PAID";
                const isPending = latest && latest.status === "PENDING_PAYMENT";
                
                const currentInputs = processingInputs[emp.empId] || { festivalBonus: 0, otherBonus: 0, citContribution: 0, paymentMethodId: "" };

                return (
                  <tr key={emp.empId} className="table-row-hover">
                    <td>
                      <div className="emp-info">
                        <span className="emp-name">{emp.firstName} {emp.lastName}</span>
                        <span className="emp-id">Status: {emp.maritalStatus}</span>
                      </div>
                    </td>
                    <td className="bold">Rs. {emp.basicSalary?.toLocaleString() || 0}</td>
                    
                    <td>
                      {isFullyPaid ? (
                        <span className="locked-value">Rs. {latest.festivalBonus?.toLocaleString() || 0}</span>
                      ) : (
                        <input type="number" className="bonus-input-small" style={{borderColor: '#27ae60'}}
                          value={currentInputs.festivalBonus} 
                          onChange={(e)=>handleInputChange(emp.empId, 'festivalBonus', e.target.value)} 
                        />
                      )}
                    </td>

                    <td>
                      {isFullyPaid ? (
                        <span className="locked-value">Rs. {latest.otherBonuses?.toLocaleString() || 0}</span>
                      ) : (
                        <input type="number" className="bonus-input-small" 
                          value={currentInputs.otherBonus} 
                          onChange={(e)=>handleInputChange(emp.empId, 'otherBonus', e.target.value)} 
                        />
                      )}
                    </td>

                    <td>
                      {isFullyPaid ? (
                        <span className="locked-value">Rs. {latest.citContribution?.toLocaleString() || 0}</span>
                      ) : (
                        <input type="number" className="bonus-input-small" 
                          value={currentInputs.citContribution} 
                          onChange={(e)=>handleInputChange(emp.empId, 'citContribution', e.target.value)} 
                        />
                      )}
                    </td>

                    <td>
                      {isFullyPaid ? (
                        <span className="locked-value">{latest.paymentMethod?.methodName || "N/A"}</span>
                      ) : (
                        <select 
                          className="method-select-small"
                          style={{ padding: '6px', borderRadius: '4px', border: '1px solid #27ae60', width: '120px' }}
                          value={currentInputs.paymentMethodId}
                          onChange={(e) => handleInputChange(emp.empId, 'paymentMethodId', e.target.value)}
                        >
                          <option value="">-- Select --</option>
                          {paymentMethods.map(m => (
                            <option key={m.paymentMethodId} value={m.paymentMethodId}>{m.methodName}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td>
                        <span className={`status-badge status-${(latest?.status || 'READY').toLowerCase().replace('_', '-')}`}>
                            {latest?.status || "READY"}
                        </span>
                    </td>
                    
                    <td className="actions-cell" style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                      {!isFullyPaid && (
                        <button 
                            className="btn-icon btn-run" 
                            style={{background: isPending ? '#f39c12' : '#2ecc71', color: 'white'}} 
                            onClick={() => handleActionRun(emp)}
                        >
                            {isPending ? "Resume" : "Run"}
                        </button>
                      )}

                      <button className="btn-icon btn-history" style={{background:'#64748b', color:'white'}} onClick={() => handleViewHistory(emp)}>History</button>
                      
                      {latest && (
                        <>
                          <button className="btn-icon btn-email" style={{background:'#3498db', color:'white'}} onClick={() => handleEmail(latest.payrollId)} disabled={isPending}>Email</button>
                          <button className="btn-icon btn-void" style={{background:'#e74c3c', color:'white'}} onClick={() => handleVoid(latest)}>Void</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={()=>setIsHistoryOpen(false)} 
        history={historyData} 
        employeeName={selectedEmpName} 
      />
    </div>
  );
};

export default PayrollManagement;