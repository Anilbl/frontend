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

  // Sync filters to the most recent record when history data changes
  useEffect(() => {
    if (history && history.length > 0) {
      // Find the first valid record to set the initial view
      const latest = history[0]; 
      const dateVal = latest.payPeriodStart || latest.payDate;
      if (dateVal) {
        if (Array.isArray(dateVal)) {
          setSelectedYear(String(dateVal[0]));
          setSelectedMonth(MONTHS[dateVal[1] - 1]);
        } else {
          const d = new Date(dateVal);
          if (!isNaN(d.getTime())) {
            setSelectedYear(String(d.getFullYear()));
            setSelectedMonth(MONTHS[d.getMonth()]);
          }
        }
      }
    }
  }, [history, isOpen]);

  const availableYears = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear + 1; y >= 2020; y--) years.push(y.toString());
    return years;
  }, []);

  if (!isOpen) return null;

  const filteredHistory = (Array.isArray(history) ? history : []).filter(h => {
    // Priority: payPeriodStart is what matches your DB screenshot (2026-02-01)
    const dateVal = h.payPeriodStart || h.payDate;
    if (!dateVal) return false;

    let yearFromRecord, monthIdxFromRecord;
    
    // CASE 1: Java LocalDate Array format [2026, 2, 1]
    if (Array.isArray(dateVal)) {
      yearFromRecord = String(dateVal[0]);
      monthIdxFromRecord = dateVal[1] - 1;
    } 
    // CASE 2: ISO String format "2026-02-01" (Matches your MySQL Screenshot)
    else if (typeof dateVal === 'string' && dateVal.includes('-')) {
      const parts = dateVal.split('-'); // ["2026", "02", "01"]
      yearFromRecord = parts[0];
      // Use parseInt to handle leading zeros (02 -> 2)
      monthIdxFromRecord = parseInt(parts[1], 10) - 1;
    }
    // CASE 3: Fallback for Date objects or other formats
    else {
      const dateObj = new Date(dateVal);
      if (isNaN(dateObj.getTime())) return false;
      yearFromRecord = String(dateObj.getFullYear());
      monthIdxFromRecord = dateObj.getMonth();
    }

    // DEBUG: Uncomment the line below to see why records are being hidden in the console
    // console.log(`Comparing Record (${MONTHS[monthIdxFromRecord]} ${yearFromRecord}) vs Selected (${selectedMonth} ${selectedYear})`);

    return yearFromRecord === selectedYear && MONTHS[monthIdxFromRecord] === selectedMonth;
});

  const formatLocalDate = (dateVal) => {
    if (!dateVal) return "N/A";
    if (Array.isArray(dateVal)) {
        return `${dateVal[0]}-${String(dateVal[1]).padStart(2, '0')}-${String(dateVal[2]).padStart(2, '0')}`;
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleDateString();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="history-modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-cross" onClick={onClose} aria-label="Close">&times;</button>
        <div className="modal-header">
          <div>
            <h2 className="header-title">Payroll Audit: {employeeName}</h2>
            <p className="header-subtitle">Records for {selectedMonth} {selectedYear}</p>
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
                <th>SSF</th>
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
                  <td className="deduction">Rs. {h.totalTax?.toLocaleString()}</td>
                  <td className="bold text-success" style={{fontWeight: 700}}>Rs. {h.netSalary?.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${h.status?.toLowerCase().replace('_', '-')}`}>{h.status}</span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="empty-state" style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>
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

  const getMonthNumber = (monthName) => MONTHS.indexOf(monthName) + 1;
  const getPaddedMonth = (monthName) => String(getMonthNumber(monthName)).padStart(2, '0');

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return selectedMonth === MONTHS[now.getMonth()] && selectedYear === now.getFullYear().toString();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const monthInt = getMonthNumber(selectedMonth);
      const yearInt = parseInt(selectedYear);
      
      const [mRes, ccRes] = await Promise.all([
        api.get("/payment-methods"),
        api.get("/payrolls/command-center", { params: { month: monthInt, year: yearInt } })
      ]);

      setPaymentMethods(mRes.data || []);
      if (mRes.data?.length > 0 && !globalPaymentMethod) setGlobalPaymentMethod(mRes.data[0].paymentMethodId);
      
      setPayrolls(ccRes.data?.employeeRows || ccRes.data || []);
    } catch (err) {
      console.error("Fetch error", err);
      setPayrolls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

  const filteredEmployees = useMemo(() => {
    return payrolls.filter(e => {
      const name = (e.fullName || "").toLowerCase();
      const term = search.toLowerCase();
      const matchesSearch = name.includes(term) || String(e.empId).includes(term);
      const matchesStatus = selectedStatus === "All" || e.status === selectedStatus || (selectedStatus === "PENDING" && e.status === "PENDING_PAYMENT");
      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.empId - a.empId);
  }, [payrolls, search, selectedStatus]);

  const stats = useMemo(() => ({
    total: filteredEmployees.length,
    paid: filteredEmployees.filter(e => e.status === "PAID").length
  }), [filteredEmployees]);

  const totalPages = Math.ceil(filteredEmployees.length / recordsPerPage);
  const currentRecords = useMemo(() => {
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    return filteredEmployees.slice(indexOfFirstRecord, indexOfLastRecord);
  }, [filteredEmployees, currentPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const delta = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        pages.push(
          <button key={i} className={`page-btn ${currentPage === i ? 'active' : ''}`} onClick={() => handlePageChange(i)}>
            {i}
          </button>
        );
      } else if (i === currentPage - delta - 1 || i === currentPage + delta + 1) {
        pages.push(<span key={i} className="pagination-ellipsis">...</span>);
      }
    }
    return pages;
  };

  const handleInputChange = (empId, field, val) => {
    const numericValue = parseFloat(val);
    const safeValue = isNaN(numericValue) ? 0 : Math.max(0, numericValue);
    setProcessingInputs(prev => ({ 
        ...prev, 
        [empId]: { ...(prev[empId] || {}), [field]: safeValue } 
    }));
  };

  const handleActionRun = (emp) => {
    if (!isCurrentMonth) return alert("Payroll processing restricted to current month.");
    if (!globalPaymentMethod) return alert("Select a payment method.");
    
    const inputs = processingInputs[emp.empId] || {};
    const finalPayload = {
      empId: emp.empId,
      fullName: emp.fullName,
      basicSalary: emp.basicSalary,
      month: selectedMonth,
      year: selectedYear,
      isAdmin: isAdmin,
      earnedSalary: parseFloat(inputs.earnedSalary ?? emp.earnedSalary ?? 0),
      ssfContribution: parseFloat(inputs.ssfContribution ?? emp.ssfContribution ?? 0),
      houseRentAllowance: parseFloat(inputs.houseRentAllowance ?? emp.houseRentAllowance ?? 0),
      dearnessAllowance: parseFloat(inputs.dearnessAllowance ?? emp.dearnessAllowance ?? 0), 
      extraComponents: emp.extraComponents || [], 
      paymentMethodId: globalPaymentMethod,
      payPeriodStart: `${selectedYear}-${getPaddedMonth(selectedMonth)}-01`
    };
    navigate(`${getPayrollHomePath()}/adjust`, { state: finalPayload });
  };

  const handleVoid = async (payrollId) => {
    if (window.confirm("Void this record? This action cannot be undone.")) {
      try { 
        await voidPayrollRecord(payrollId); 
        fetchData(); 
      } catch { 
        alert("Void failed. Check if record is already voided."); 
      }
    }
  };

  const handleEmailAction = async (payrollId) => {
    if (isEmailing) return; 
    setIsEmailing(payrollId);
    try {
      const response = await emailPayslip(payrollId);
      alert(response?.data?.message || "Email sent successfully.");
    } catch (err) { 
        alert("Email failed to send."); 
    } finally { 
        setIsEmailing(null); 
    }
  };

  const handleViewHistory = async (empId, fullName) => {
    try {
      const res = await getEmployeeHistory(empId);
      // Ensure we are setting an array even if the backend returns null
      setHistoryData(Array.isArray(res.data) ? res.data : []);
      setSelectedEmpName(fullName);
      setIsHistoryOpen(true);
    } catch (err) { 
        console.error(err); 
        alert("Could not load employee history."); 
    }
  };

  if (loading) return <div className="loading-spinner">Syncing Command Center...</div>;

  return (
    <div className="payroll-container">
      <div className="payroll-header-section">
        <h1 className="header-title">Payroll Command</h1>
        <div className="payroll-filter-bar">
          <input className="filter-search-small" placeholder="Search Employee..." value={search} onChange={(e)=>{setSearch(e.target.value); setCurrentPage(1);}} />
          <select className="filter-select-mini status-select" value={selectedStatus} onChange={(e) => {setSelectedStatus(e.target.value); setCurrentPage(1);}}>
            <option value="All">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING_PAYMENT">Pending</option>
            <option value="READY">Ready</option>
          </select>
          <select value={globalPaymentMethod} onChange={(e) => setGlobalPaymentMethod(e.target.value)} className="filter-select-mini method-select">
            {paymentMethods.map(m => <option key={m.paymentMethodId} value={m.paymentMethodId}>{m.methodName}</option>)}
          </select>
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
      </div>

      <div className="payroll-card">
        <table className="payroll-table">
          <thead>
            <tr>
              <th style={{width: '18%'}}>Employee</th>
              <th style={{width: '13%'}}>Earned Salary</th>
              <th style={{width: '12%'}}>SSF (11%)</th>
              <th style={{width: '12%'}}>Rent Allowance</th>
              <th style={{width: '12%'}}>Dearness</th>
              <th style={{width: '10%'}}>Status</th>
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
                    <div className="emp-info"><strong>{emp.fullName}</strong><div className="emp-id-sub">ID: {emp.empId}</div></div>
                  </td>
                  <td>
                    {isInputLocked ? <span className="locked-value">Rs. {emp.earnedSalary?.toLocaleString()}</span> :
                    <div className="editable-salary-cell">
                        <span className="currency-prefix">Rs.</span>
                        <input type="number" className="salary-input-edit" value={inputs.earnedSalary ?? emp.earnedSalary ?? 0} 
                          onChange={(e)=>handleInputChange(emp.empId, 'earnedSalary', e.target.value)} />
                    </div>}
                  </td>
                  <td>
                    {isInputLocked ? <span className="locked-value">{emp.ssfContribution?.toLocaleString() || 0}</span> : 
                    <input type="number" className="bonus-input-small" value={inputs.ssfContribution ?? emp.ssfContribution ?? 0} 
                      onChange={(e)=>handleInputChange(emp.empId, 'ssfContribution', e.target.value)}/>}
                  </td>
                  <td>
                    {isInputLocked ? <span className="locked-value">{emp.houseRentAllowance?.toLocaleString() || 0}</span> : 
                    <input type="number" className="bonus-input-small" value={inputs.houseRentAllowance ?? emp.houseRentAllowance ?? 0} 
                      onChange={(e)=>handleInputChange(emp.empId, 'houseRentAllowance', e.target.value)}/>}
                  </td>
                  <td>
                    {isInputLocked ? <span className="locked-value">{emp.dearnessAllowance?.toLocaleString() || 0}</span> : 
                    <input type="number" className="bonus-input-small" value={inputs.dearnessAllowance ?? emp.dearnessAllowance ?? 0} 
                      onChange={(e)=>handleInputChange(emp.empId, 'dearnessAllowance', e.target.value)}/>}
                  </td>
                  <td><span className={`status-badge status-${emp.status.toLowerCase().replace('_', '-')}`}>{emp.status.replace('_', ' ')}</span></td>
                  <td className="actions-cell">
                    {isCurrentMonth && (emp.status === "PENDING_PAYMENT" || emp.status === "READY") && (
                       <button className="btn-icon btn-pdf" onClick={()=>handleActionRun(emp)}>{emp.status === "PENDING_PAYMENT" ? "Resume" : "Run"}</button>
                    )}
                    {isPaid && (
                      <>
                        <button className="btn-icon btn-email" disabled={isEmailing === emp.payrollId} onClick={() => handleEmailAction(emp.payrollId)}>{isEmailing === emp.payrollId ? "..." : "Email"}</button>
                        {isAdmin && <button className="btn-icon btn-void" onClick={()=>handleVoid(emp.payrollId)}>Void</button>}
                      </>
                    )}
                    <button className="btn-icon btn-history" onClick={()=>handleViewHistory(emp.empId, emp.fullName)}>History</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 0 && (
          <div className="pagination-footer">
            <div className="pagination-info">Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></div>
            <div className="pagination-buttons">
              <button className="page-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>&laquo; Prev</button>
              {renderPageNumbers()}
              <button className="page-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>Next &raquo;</button>
            </div>
          </div>
        )}
      </div>

      <HistoryModal isOpen={isHistoryOpen} onClose={()=>setIsHistoryOpen(false)} history={historyData} employeeName={selectedEmpName} />
    </div>
  );
};

export default PayrollManagement;