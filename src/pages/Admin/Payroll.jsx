import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { 
  getEmployeeHistory, 
  voidPayrollRecord, 
  emailPayslip 
} from "../../api/payrollApi";
import "./Payroll.css";

<<<<<<< HEAD
// --- History Modal Component ---
=======
// Constants for Month Management
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// History Modal Component
>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
const HistoryModal = ({ isOpen, onClose, history, employeeName }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="history-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{padding: '20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee'}}>
          <h2 className="header-title">Audit History: {employeeName}</h2>
          <button className="btn-icon btn-void" onClick={onClose}>Close</button>
        </div>
        <div style={{padding: '20px', overflowY: 'auto'}}>
          <table className="payroll-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Gross</th>
                <th>Net Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.payrollId}>
                  <td>{h.payPeriodStart}</td>
                  <td>Rs. {h.grossSalary?.toLocaleString()}</td>
                  <td className="bold text-success">Rs. {h.netSalary?.toLocaleString()}</td>
                  <td><span className={`status-badge status-${h.status?.toLowerCase()}`}>{h.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PayrollManagement = () => {
  const navigate = useNavigate();
  
<<<<<<< HEAD
  // States
=======
  const [emailStatus, setEmailStatus] = useState({ loading: false, id: null });
>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]); 
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [processingInputs, setProcessingInputs] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // History Modal States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedEmpName, setSelectedEmpName] = useState("");

  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

<<<<<<< HEAD
  const fetchData = useCallback(async () => {
=======
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => { 
    fetchData(); 
  }, [selectedMonth, selectedYear]);

  const getMonthNumber = (monthName) => MONTHS.indexOf(monthName) + 1;
  const getPaddedMonth = (monthName) => String(getMonthNumber(monthName)).padStart(2, '0');

  const isFutureDate = useMemo(() => {
    const now = new Date();
    const selDate = new Date(parseInt(selectedYear), getMonthNumber(selectedMonth) - 1);
    const currDate = new Date(now.getFullYear(), now.getMonth());
    return selDate > currDate;
  }, [selectedMonth, selectedYear]);

  const isPastDate = useMemo(() => {
    const now = new Date();
    const selDate = new Date(parseInt(selectedYear), getMonthNumber(selectedMonth) - 1);
    const currDate = new Date(now.getFullYear(), now.getMonth());
    return selDate < currDate;
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
    try {
      setLoading(true);
      const monthMap = {
        "JANUARY": "01", "FEBRUARY": "02", "MARCH": "03", "APRIL": "04",
        "MAY": "05", "JUNE": "06", "JULY": "07", "AUGUST": "08",
        "SEPTEMBER": "09", "OCTOBER": "10", "NOVEMBER": "11", "DECEMBER": "12"
      };
      const monthValue = monthMap[selectedMonth.toUpperCase()];

      const [pRes, eRes, mRes] = await Promise.all([
<<<<<<< HEAD
        api.get("/payrolls", { params: { month: parseInt(selectedMonth), year: parseInt(selectedYear) } }), 
        api.get("/employees"),
        api.get("/payment-methods")
      ]);
      setPayrolls(pRes.data || []);
      setEmployees(eRes.data || []);
=======
        api.get("/payrolls"), 
        api.get("/payrolls/batch-calculate", {
            params: { month: monthValue, year: selectedYear }
        }),
        api.get("/payment-methods")
      ]);

      setPayrolls(pRes.data || []);
      setEmployees(Array.isArray(eRes.data) ? eRes.data : []);
>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
      setPaymentMethods(mRes.data || []);

    } catch (err) { 
<<<<<<< HEAD
      console.error("Sync Error:", err); 
    } finally { setLoading(false); }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentStatusMap = useMemo(() => {
    const map = new Map();
    payrolls.forEach(p => {
      if (!p.isVoided) {
        const empId = p.employee?.empId || p.empId;
=======
      console.error("Sync Error:", err);
    } finally { 
      setLoading(false); 
    }
  };

  const currentStatusMap = useMemo(() => {
    const map = new Map();
    const targetPeriod = `${selectedYear}-${getPaddedMonth(selectedMonth)}`; 
    
    payrolls.forEach(p => {
      if (p.status === "VOIDED") return;
      const empId = p.employee?.empId || p.empId;
      let recordDate = Array.isArray(p.payPeriodStart) 
        ? `${p.payPeriodStart[0]}-${String(p.payPeriodStart[1]).padStart(2, '0')}`
        : p.payPeriodStart?.substring(0, 7);

      if (empId && recordDate === targetPeriod) {
>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
        map.set(String(empId), p);
      }
    });
    return map;
<<<<<<< HEAD
  }, [payrolls]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => b.empId - a.empId);
  }, [employees, search]);

  // Pagination Logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredEmployees.slice(indexOfFirstRecord, indexOfLastRecord);
=======
  }, [payrolls, selectedMonth, selectedYear]);

  const filteredEmployees = useMemo(() => {
    return employees
      .filter(e => (e.fullName || `${e.firstName} ${e.lastName}`).toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.empId - a.empId);
  }, [employees, search]);

>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
  const totalPages = Math.ceil(filteredEmployees.length / recordsPerPage);
  const currentRecords = filteredEmployees.slice(
    (currentPage - 1) * recordsPerPage, 
    currentPage * recordsPerPage
  );

  const handleEmail = async (payrollId) => {
    setEmailStatus({ loading: true, id: payrollId });
    try {
      await emailPayslip(payrollId);
      alert("✅ Payslip sent successfully!");
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Check network/SMTP logs.";
      alert(`❌ Failed to send email: ${errorMessage}`);
    } finally {
      setEmailStatus({ loading: false, id: null });
    }
  };

  const handleInputChange = (empId, field, val) => {
    setProcessingInputs(prev => ({
      ...prev,
      [empId]: { ...(prev[empId] || {}), [field]: val }
    }));
  };

  const handleActionRun = async (emp) => {
    const inputs = processingInputs[emp.empId] || {};
<<<<<<< HEAD
    if (!inputs.paymentMethodId) return alert("Select a Payment Method first.");

    try {
      const payload = {
        empId: emp.empId,
        festivalBonus: parseFloat(inputs.festivalBonus || 0),
        otherBonus: parseFloat(inputs.otherBonus || 0), 
        cit: parseFloat(inputs.cit || 0),
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        paymentMethodId: inputs.paymentMethodId
      };
      const res = await api.post("/payrolls/preview", payload);
      navigate("/admin/payroll/preview", { 
        state: { previewData: res.data, selectedPaymentMethodId: inputs.paymentMethodId } 
      });
    } catch (err) { alert("Calculation failed"); }
=======
    if (!inputs.paymentMethodId) return alert("Please select a payment method.");
    try {
        const payload = {
            empId: emp.empId, 
            festivalBonus: parseFloat(inputs.festivalBonus || 0),
            bonuses: parseFloat(inputs.otherBonus || 0),
            citContribution: parseFloat(inputs.citContribution || 0),
            payPeriodStart: `${selectedYear}-${getPaddedMonth(selectedMonth)}-01`
        };
        const res = await api.post("/payrolls/preview", payload);
        navigate("/admin/payroll/preview", { 
            state: { previewData: res.data, selectedPaymentMethodId: inputs.paymentMethodId } 
        });
    } catch (err) { alert(err.response?.data?.message || "Run failed"); }
  };

  const handleVoid = async (p) => {
    if (window.confirm(`Void payroll for ${p.employee?.firstName}?`)) {
      try { await voidPayrollRecord(p.payrollId); fetchData(); } catch { alert("Void failed"); }
    }
>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
  };

  const handleViewHistory = async (emp) => {
    try {
      const res = await getEmployeeHistory(emp.empId);
      setHistoryData(res.data || []);
      setSelectedEmpName(emp.fullName || `${emp.firstName} ${emp.lastName}`);
      setIsHistoryOpen(true);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading-spinner">Syncing Payroll Data...</div>;

  return (
    <div className="payroll-container">
      {/* Header Section */}
      <div className="payroll-header-section">
        <div>
          <h1 className="header-title">Payroll Command Center</h1>
<<<<<<< HEAD
          <p className="header-subtitle">Status for {new Date(selectedYear, selectedMonth-1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="header-controls">
          <select className="filter-select" value={selectedMonth} onChange={(e) => {setSelectedMonth(e.target.value); setCurrentPage(1);}}>
            {Array.from({length: 12}, (_, i) => (
              <option key={i+1} value={String(i+1).padStart(2, '0')}>
                {new Date(0, i).toLocaleString('en', {month: 'long'})}
              </option>
            ))}
          </select>
          <select className="filter-select" value={selectedYear} onChange={(e) => {setSelectedYear(e.target.value); setCurrentPage(1);}}>
            {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <input className="search-bar" placeholder="Search employee..." onChange={(e)=>setSearch(e.target.value)} />
=======
          <p className="header-subtitle">
            Current Period: <strong>{selectedMonth} {selectedYear}</strong>
          </p>
        </div>
        <div className="header-controls">
          <select 
            value={selectedMonth} 
            onChange={(e) => {setSelectedMonth(e.target.value); setCurrentPage(1);}} 
            className="filter-select"
          >
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select 
            value={selectedYear} 
            onChange={(e) => {setSelectedYear(e.target.value); setCurrentPage(1);}} 
            className="filter-select"
          >
            {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <input 
            className="search-bar" 
            placeholder="Search employee..." 
            onChange={(e)=>{setSearch(e.target.value); setCurrentPage(1);}} 
          />
>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
        </div>
      </div>

      <div className="payroll-card">
        <table className="payroll-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Earned Salary</th>
              <th>Festival Bonus</th>
              <th>Other Bonus</th>
              <th>CIT</th>
              <th>Method</th>
              <th>Status</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
<<<<<<< HEAD
            {currentRecords.map(emp => {
              const record = currentStatusMap.get(String(emp.empId));
              const isLocked = !!record;
              const inputs = processingInputs[emp.empId] || {};

              return (
                <tr key={emp.empId} className={isLocked ? "row-locked" : "table-row-hover"}>
                  <td>
                    <div className="emp-info">
                      <span className="emp-name">{emp.firstName} {emp.lastName}</span>
                      <span className="header-subtitle">{emp.maritalStatus}</span>
                    </div>
                  </td>
                  <td className="bold">Rs. {emp.basicSalary?.toLocaleString()}</td>
                  <td>
                    {isLocked ? <span className="locked-value">Rs. {record.festivalBonus}</span> : 
                      <input type="number" className="bonus-input-small" placeholder="0" 
                        onChange={(e) => handleInputChange(emp.empId, 'festivalBonus', e.target.value)} />}
                  </td>
                  <td>
                    {isLocked ? <span className="locked-value">Rs. {record.otherBonuses}</span> : 
                      <input type="number" className="bonus-input-small" placeholder="0" 
                        onChange={(e) => handleInputChange(emp.empId, 'otherBonus', e.target.value)} />}
                  </td>
                  <td>
                    {isLocked ? <span className="locked-value">Rs. {record.citContribution}</span> : 
                      <input type="number" className="bonus-input-small" placeholder="0" 
                        onChange={(e) => handleInputChange(emp.empId, 'cit', e.target.value)} />}
                  </td>
                  <td>
                    {isLocked ? <span className="method-label">{record.paymentMethod?.methodName}</span> : 
                      <select className="filter-select full-width-select" 
                        onChange={(e) => handleInputChange(emp.empId, 'paymentMethodId', e.target.value)}>
                        <option value="">Select</option>
                        {paymentMethods.map(m => <option key={m.paymentMethodId} value={m.paymentMethodId}>{m.methodName}</option>)}
                      </select>}
                  </td>
                  <td>
                    <span className={`status-badge status-${(record?.status || 'ready').toLowerCase()}`}>
                      {record?.status || 'READY'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {!isLocked ? (
                      <button className="btn-icon btn-pdf" onClick={() => handleActionRun(emp)}>Run</button>
                    ) : (
                      <>
                        <button className="btn-icon btn-email" onClick={() => emailPayslip(record.payrollId)}>Email</button>
                        <button className="btn-icon btn-void" onClick={() => voidPayrollRecord(record.payrollId).then(fetchData)}>Void</button>
                      </>
                    )}
                    <button className="btn-icon btn-history" onClick={() => handleViewHistory(emp)}>History</button>
                  </td>
                </tr>
              );
            })}
=======
            {currentRecords.length > 0 ? currentRecords.map(emp => {
              const record = currentStatusMap.get(String(emp.empId));
              const inputs = processingInputs[emp.empId] || { festivalBonus:0, otherBonus:0, citContribution:0, paymentMethodId:"" };
              
              // Calculate earned value for current check
              const earnedValue = emp.earnedSalary ?? emp.basicSalary ?? 0;

              return (
                <tr key={emp.empId} className={record ? "row-locked" : "table-row-hover"}>
                  <td>
                    <div className="emp-info">
                        <span className="emp-name">{emp.fullName || `${emp.firstName} ${emp.lastName}`}</span>
                        <span className="header-subtitle">{emp.maritalStatus}</span>
                    </div>
                  </td>

                  <td className="bold">
                    Rs. {earnedValue.toLocaleString()}
                  </td>
                  
                  <td>
                    {record ? <span className="locked-value">Rs. {record.festivalBonus?.toLocaleString()}</span> : 
                    <input type="number" disabled={isFutureDate || isPastDate} className="bonus-input-small" value={inputs.festivalBonus} onChange={(e)=>handleInputChange(emp.empId, 'festivalBonus', e.target.value)}/>}
                  </td>
                  <td>
                    {record ? <span className="locked-value">Rs. {record.otherBonuses?.toLocaleString()}</span> : 
                    <input type="number" disabled={isFutureDate || isPastDate} className="bonus-input-small" value={inputs.otherBonus} onChange={(e)=>handleInputChange(emp.empId, 'otherBonus', e.target.value)}/>}
                  </td>
                  <td>
                    {record ? <span className="locked-value">Rs. {record.citContribution?.toLocaleString()}</span> : 
                    <input type="number" disabled={isFutureDate || isPastDate} className="bonus-input-small" value={inputs.citContribution} onChange={(e)=>handleInputChange(emp.empId, 'citContribution', e.target.value)}/>}
                  </td>
                  <td>
                    {record ? <span className="method-label">{record.paymentMethod?.methodName || "Bank"}</span> : 
                    <select disabled={isFutureDate || isPastDate} className="filter-select full-width-select" onChange={(e)=>handleInputChange(emp.empId, 'paymentMethodId', e.target.value)}>
                      <option value="">Select</option>
                      {paymentMethods.map(m => <option key={m.paymentMethodId} value={m.paymentMethodId}>{m.methodName}</option>)}
                    </select>}
                  </td>
                  
                  <td>
                    <span className={`status-badge status-${(record?.status || "READY").toLowerCase().replace('_', '-')}`}>
                        {record?.status || (isPastDate ? "NO RECORD" : (earnedValue === 0 ? "NO EARNINGS" : "READY"))}
                    </span>
                  </td>

                  <td className="actions-cell">
                    {!record ? (
                      !isPastDate && (
                        /* UPDATED LOGIC: Disable if Future OR if Earned Value is 0 */
                        <button 
                            className="btn-icon btn-pdf" 
                            disabled={isFutureDate || earnedValue === 0} 
                            onClick={()=>handleActionRun(emp)}
                        >
                            Run
                        </button>
                      )
                    ) : (
                      <>
                        <button 
                          className="btn-icon btn-email" 
                          disabled={emailStatus.loading && emailStatus.id === record.payrollId} 
                          onClick={() => handleEmail(record.payrollId)}
                        >
                          {emailStatus.loading && emailStatus.id === record.payrollId ? "Sending..." : "Email"}
                        </button>
                        <button className="btn-icon btn-void" onClick={()=>handleVoid(record)}>Void</button>
                      </>
                    )}
                    <button className="btn-icon btn-history" onClick={()=>handleViewHistory(emp)}>History</button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="8" className="empty-state">
                  No payroll records found for {selectedMonth} {selectedYear}.
                </td>
              </tr>
            )}
>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="pagination-footer">
<<<<<<< HEAD
          <div className="header-subtitle">Showing {currentRecords.length} of {filteredEmployees.length}</div>
          <div className="header-controls">
            <button className="p-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)}>Prev</button>
            <span className="bold">{currentPage} / {totalPages || 1}</span>
            <button className="p-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)}>Next</button>
=======
          <span className="header-subtitle">
            Showing <strong>{currentRecords.length}</strong> of {filteredEmployees.length} employees
          </span>
          <div className="header-controls">
            <button 
                className="p-btn" 
                disabled={currentPage === 1} 
                onClick={()=>setCurrentPage(prev => Math.max(prev - 1, 1))}
            >
                Prev
            </button>
            
            {[...Array(totalPages)].map((_, i) => (
              <button 
                key={i} 
                className={`p-btn ${currentPage === i+1 ? 'active' : ''}`} 
                onClick={()=>setCurrentPage(i+1)}
              >
                {i+1}
              </button>
            ))}

            <button 
                className="p-btn" 
                disabled={currentPage === totalPages || totalPages === 0} 
                onClick={()=>setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            >
                Next
            </button>
>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
          </div>
        </div>
      </div>

      <HistoryModal 
        isOpen={isHistoryOpen} 
<<<<<<< HEAD
        onClose={() => setIsHistoryOpen(false)} 
=======
        onClose={()=>setIsHistoryOpen(false)} 
>>>>>>> d5a58d00e9115ad72756c5c9ee7b9dd5b5066ce3
        history={historyData} 
        employeeName={selectedEmpName} 
      />
    </div>
  );
};

export default PayrollManagement;