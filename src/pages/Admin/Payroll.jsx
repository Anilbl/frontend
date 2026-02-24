import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";
import { 
  getEmployeeHistory, 
  voidPayrollRecord, 
  emailPayslip 
} from "../../api/payrollApi";
import "./Payroll.css";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/* ================= AUDIT MODAL COMPONENT ================= */
const HistoryModal = ({ isOpen, onClose, history, employeeName }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);

  const availableYears = useMemo(() => {
    const years = [];
    for (let y = new Date().getFullYear(); y >= 2020; y--) years.push(y.toString());
    return years;
  }, []);

  if (!isOpen) return null; 

  const filteredHistory = (Array.isArray(history) ? history : []).filter(h => {
    const dateVal = h.payPeriodStart || h.payDate;
    if (!dateVal) return false;

    let yearFromRecord, monthIdxFromRecord;

    if (Array.isArray(dateVal)) {
      yearFromRecord = String(dateVal[0]);
      monthIdxFromRecord = dateVal[1] - 1; 
    } else {
      const dateObj = new Date(dateVal);
      yearFromRecord = String(dateObj.getFullYear());
      monthIdxFromRecord = dateObj.getMonth();
    }

    return yearFromRecord === selectedYear && MONTHS[monthIdxFromRecord] === selectedMonth;
  });

  const formatLocalDate = (dateVal) => {
    if (Array.isArray(dateVal)) return `${dateVal[0]}-${String(dateVal[1]).padStart(2, '0')}-${String(dateVal[2]).padStart(2, '0')}`;
    return dateVal;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="history-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-cross" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <div className="modal-header">
          <div>
            <h2 className="header-title">Payroll Audit: {employeeName}</h2>
            <p className="header-subtitle">Viewing records for {selectedMonth} {selectedYear}</p>
          </div>
          <div className="header-controls">
            <select className="filter-select-mini" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="filter-select-mini" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Period Start</th>
                <th>Gross Salary</th>
                <th>SSF (11%)</th>
                <th>CIT</th>
                <th>Tax</th>
                <th>Net Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? filteredHistory.map((h, idx) => (
                <tr key={h.payrollId || idx} className={h.status === "VOIDED" ? "row-voided" : ""}>
                  <td>{formatLocalDate(h.payPeriodStart)}</td>
                  <td>Rs. {h.grossSalary?.toLocaleString()}</td>
                  <td className="deduction">- {h.ssfContribution?.toLocaleString()}</td>
                  <td className="deduction">- {h.citContribution?.toLocaleString()}</td>
                  <td className="deduction">Rs. {h.totalTax?.toLocaleString()}</td>
                  <td className="bold text-success" style={{fontWeight: 700}}>Rs. {h.netSalary?.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${h.status?.toLowerCase().replace('_', '-')}`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="empty-state" style={{padding: '40px', textAlign: 'center'}}>
                    No records found for {selectedMonth} {selectedYear}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN MANAGEMENT COMPONENT ================= */
const PayrollManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to determine role and base path
  const isAdmin = useMemo(() => location.pathname.includes("/admin"), [location.pathname]);
  const getPayrollHomePath = () => isAdmin ? "/admin/payroll" : "/accountant/payroll-processing";

  const [payrolls, setPayrolls] = useState([]); 
  const [paymentMethods, setPaymentMethods] = useState([]); 
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedEmpName, setSelectedEmpName] = useState("");
  const [processingInputs, setProcessingInputs] = useState({});
  const [isEmailing, setIsEmailing] = useState(null); 

  const [globalPaymentMethod, setGlobalPaymentMethod] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedMonth === MONTHS[now.getMonth()] && selectedYear === now.getFullYear().toString();
  }, [selectedMonth, selectedYear]);

  const getMonthNumber = (monthName) => MONTHS.indexOf(monthName) + 1;
  const getPaddedMonth = (monthName) => String(getMonthNumber(monthName)).padStart(2, '0');

  const fetchData = async () => {
    try {
      setLoading(true);
      const monthInt = getMonthNumber(selectedMonth);
      const yearInt = parseInt(selectedYear);

      const mRes = await api.get("/payment-methods");
      setPaymentMethods(mRes.data || []);
      if (mRes.data?.length > 0 && !globalPaymentMethod) {
        setGlobalPaymentMethod(mRes.data[0].paymentMethodId);
      }

      try {
        const ccRes = await api.get("/payrolls/command-center", { 
          params: { month: monthInt, year: yearInt } 
        });
        const dataToSet = ccRes.data?.employeeRows || ccRes.data || [];
        setPayrolls(dataToSet);
      } catch (payrollErr) {
        setPayrolls([]);
      }
    } catch (err) {
      console.error("Global Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

  const filteredEmployees = useMemo(() => {
    return payrolls.filter(e => {
      const name = (e.fullName || "").toLowerCase();
      const empIdStr = String(e.empId);
      const term = search.toLowerCase();
      const matchesSearch = name.includes(term) || empIdStr.includes(term);
      const matchesStatus = selectedStatus === "All" || e.status === selectedStatus || (selectedStatus === "PENDING" && e.status === "PENDING_PAYMENT");
      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.empId - a.empId);
  }, [payrolls, search, selectedStatus]);

  const stats = useMemo(() => ({
    total: filteredEmployees.length,
    paid: filteredEmployees.filter(e => e.status === "PAID").length
  }), [filteredEmployees]);

  const totalPages = Math.ceil(filteredEmployees.length / recordsPerPage);
  const currentRecords = filteredEmployees.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const handleInputChange = (empId, field, val) => {
    setProcessingInputs(prev => ({ ...prev, [empId]: { ...(prev[empId] || {}), [field]: val } }));
  };

  const handleActionRun = (emp) => {
    if (!isCurrentMonth) return alert("Payroll processing is only allowed for the current month.");
    if (!globalPaymentMethod) return alert("Please select a default payment method.");
    
    const inputs = processingInputs[emp.empId] || {};
    const targetPath = `${getPayrollHomePath()}/adjust`;
    
    navigate(targetPath, { 
      state: {
        employee: { empId: emp.empId, fullName: emp.fullName, basicSalary: emp.basicSalary },
        month: selectedMonth,
        year: selectedYear,
        initialInputs: {
          earnedSalary: parseFloat(inputs.earnedSalary ?? emp.earnedSalary ?? 0),
          festivalBonus: parseFloat(inputs.festivalBonus ?? emp.festivalBonus ?? 0),
          otherBonuses: parseFloat(inputs.otherBonus ?? emp.otherBonuses ?? 0),
          citContribution: parseFloat(inputs.citContribution ?? emp.citContribution ?? 0),
          paymentMethodId: globalPaymentMethod,
          payPeriodStart: `${selectedYear}-${getPaddedMonth(selectedMonth)}-01`
        }
      } 
    });
  };

  const handleVoid = async (payrollId) => {
    if (window.confirm("Are you sure you want to void this payroll record?")) {
      try { 
        await voidPayrollRecord(payrollId); 
        fetchData(); 
        // Logic for "On Success" redirect (even though fetchData stays on page, this reinforces role-based state)
        navigate(getPayrollHomePath());
      } catch { 
        alert("Void operation failed."); 
      }
    }
  };

  const handleEmailAction = async (payrollId) => {
    if (isEmailing) return; 
    setIsEmailing(payrollId);
    try {
      const response = await emailPayslip(payrollId);
      alert(response?.data?.message || "Payslip sent to employee email.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send email.");
    } finally {
      setIsEmailing(null);
    }
  };

  const handleViewHistory = async (empId, fullName) => {
    try {
      const res = await getEmployeeHistory(empId);
      setHistoryData(Array.isArray(res.data) ? res.data : []);
      setSelectedEmpName(fullName);
      setIsHistoryOpen(true);
    } catch (err) { console.error("History fetch error:", err); }
  };

  if (loading) return <div className="loading-spinner">Syncing Command Center...</div>;

  return (
    <div className="payroll-container">
      <div className="payroll-header-section">
        <h1 className="header-title">Payroll Command</h1>
        <div className="payroll-filter-bar">
          <input className="filter-search-small" placeholder="Search Name/ID..." value={search} onChange={(e)=>{setSearch(e.target.value); setCurrentPage(1);}} />
          <select className="filter-select-mini status-select" value={selectedStatus} onChange={(e) => {setSelectedStatus(e.target.value); setCurrentPage(1);}}>
            <option value="All">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING_PAYMENT">Pending</option>
            <option value="READY">Ready</option>
          </select>
          <div className="global-method-box">
             <select value={globalPaymentMethod} onChange={(e) => setGlobalPaymentMethod(e.target.value)} className="filter-select-mini method-select">
                {paymentMethods.map(m => <option key={m.paymentMethodId} value={m.paymentMethodId}>{m.methodName}</option>)}
             </select>
          </div>
          <div className="date-group">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="filter-select-mini">
              {MONTHS.map(m => <option key={m} value={m}>{m.substring(0, 3)}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="filter-select-mini">
              {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="record-summary-line">
        Period: <strong>{selectedMonth} {selectedYear}</strong> — <span className="stats-tag">{stats.paid}/{stats.total} Processed</span>
        {!isCurrentMonth && <span className="lock-notice" style={{marginLeft: '15px', color: '#e11d48', fontWeight: 'bold'}}> [READ-ONLY MODE]</span>}
      </div>

      <div className="payroll-card">
        <table className="payroll-table">
          <thead>
            <tr>
              <th style={{width: '20%'}}>Employee</th>
              <th style={{width: '15%'}}>Earned Salary</th>
              <th style={{width: '10%'}}>Festival</th>
              <th style={{width: '10%'}}>Other Bonus</th>
              <th style={{width: '10%'}}>CIT</th>
              <th style={{width: '12%'}}>Status</th>
              <th style={{textAlign: 'right', width: '23%'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map(emp => {
              const isPaid = emp.status === "PAID";
              const isInputLocked = isPaid || !isCurrentMonth; 
              const inputs = processingInputs[emp.empId] || {};

              return (
                <tr key={emp.empId}>
                  <td>
                    <div className="emp-info">
                        <strong>{emp.fullName}</strong>
                        <div className="emp-id-sub">ID: {emp.empId}</div>
                    </div>
                  </td>
                  <td>
                    {isInputLocked ? <span className="locked-value">Rs. {emp.earnedSalary?.toLocaleString()}</span> :
                    <div className="editable-salary-cell">
                        <span className="currency-prefix">Rs.</span>
                        <input type="number" className="salary-input-edit" value={inputs.earnedSalary ?? emp.earnedSalary ?? 0} onChange={(e)=>handleInputChange(emp.empId, 'earnedSalary', e.target.value)} />
                    </div>}
                  </td>
                  <td>
                    {isInputLocked ? <span className="locked-value">{emp.festivalBonus?.toLocaleString() || 0}</span> : 
                    <input type="number" className="bonus-input-small" value={inputs.festivalBonus ?? emp.festivalBonus ?? 0} onChange={(e)=>handleInputChange(emp.empId, 'festivalBonus', e.target.value)}/>}
                  </td>
                  <td>
                    {isInputLocked ? <span className="locked-value">{emp.otherBonuses?.toLocaleString() || 0}</span> : 
                    <input type="number" className="bonus-input-small" value={inputs.otherBonus ?? emp.otherBonuses ?? 0} onChange={(e)=>handleInputChange(emp.empId, 'otherBonus', e.target.value)}/>}
                  </td>
                  <td>
                    {isInputLocked ? <span className="locked-value">{emp.citContribution?.toLocaleString() || 0}</span> : 
                    <input type="number" className="bonus-input-small" value={inputs.citContribution ?? emp.citContribution ?? 0} onChange={(e)=>handleInputChange(emp.empId, 'citContribution', e.target.value)}/>}
                  </td>
                  <td>
                    <span className={`status-badge status-${emp.status.toLowerCase().replace('_', '-')}`}>
                        {emp.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {isCurrentMonth && (emp.status === "PENDING_PAYMENT" || emp.status === "READY") && (
                       <button className="btn-icon btn-pdf" onClick={()=>handleActionRun(emp)}>
                        {emp.status === "PENDING_PAYMENT" ? "Resume" : "Run"}
                       </button>
                    )}
                    {isPaid && (
                      <>
                        <button className="btn-icon btn-email" disabled={isEmailing === emp.payrollId} onClick={() => handleEmailAction(emp.payrollId)}>
                          {isEmailing === emp.payrollId ? "..." : "Email"}
                        </button>
                        {/* SUCCESS-BASED LOGIC: Role-based Void visibility */}
                        {isAdmin && (
                            <button className="btn-icon btn-void" onClick={()=>handleVoid(emp.payrollId)}>Void</button>
                        )}
                      </>
                    )}
                    <button className="btn-icon btn-history" onClick={()=>handleViewHistory(emp.empId, emp.fullName)}>History</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="pagination-footer">
          <span style={{fontSize: '0.85rem', color: '#64748b'}}>Showing {currentRecords.length} of {filteredEmployees.length} records</span>
          <div className="pagination-group">
            <button className="p-btn" disabled={currentPage === 1} onClick={()=>setCurrentPage(prev => prev - 1)}>Prev</button>
            <button className="p-btn active">{currentPage}</button>
            <button className="p-btn" disabled={currentPage === totalPages} onClick={()=>setCurrentPage(prev => prev + 1)}>Next</button>
          </div>
        </div>
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