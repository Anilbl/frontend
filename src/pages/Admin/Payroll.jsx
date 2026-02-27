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
        <button className="modal-close-cross" onClick={onClose} aria-label="Close">&times;</button>
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
                <tr><td colSpan="6" className="empty-state">No records found.</td></tr>
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
  
  // PAGINATION STATE
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
      if (mRes.data?.length > 0 && !globalPaymentMethod) setGlobalPaymentMethod(mRes.data[0].paymentMethodId);

      const ccRes = await api.get("/payrolls/command-center", { params: { month: monthInt, year: yearInt } });
      setPayrolls(ccRes.data?.employeeRows || ccRes.data || []);
      setCurrentPage(1); // Reset to page 1 on new data fetch
    } catch (err) {
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
    }).sort((a, b) => b.empId - a.empId); // ID DESCENDING ORDER
  }, [payrolls, search, selectedStatus]);

  const stats = useMemo(() => ({
    total: filteredEmployees.length,
    paid: filteredEmployees.filter(e => e.status === "PAID").length
  }), [filteredEmployees]);

  // PAGINATION CALCULATIONS
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
    const targetPath = `${getPayrollHomePath()}/adjust`;
    
    const finalPayload = {
      employee: { 
        empId: emp.empId, 
        fullName: emp.fullName, 
        basicSalary: emp.basicSalary 
      },
      month: selectedMonth,
      year: selectedYear,
      initialInputs: {
        earnedSalary: parseFloat(inputs.earnedSalary ?? emp.earnedSalary ?? 0),
        festivalBonus: parseFloat(inputs.festivalBonus ?? emp.festivalBonus ?? 0),
        bonuses: parseFloat(inputs.otherBonus ?? emp.otherBonuses ?? 0),
        paymentMethodId: globalPaymentMethod,
        payPeriodStart: `${selectedYear}-${getPaddedMonth(selectedMonth)}-01`
      }
    };
    
    navigate(targetPath, { state: finalPayload });
  };

  const handleVoid = async (payrollId) => {
    if (window.confirm("Void this record?")) {
      try { await voidPayrollRecord(payrollId); fetchData(); } catch { alert("Void failed."); }
    }
  };

  const handleEmailAction = async (payrollId) => {
    if (isEmailing) return; 
    setIsEmailing(payrollId);
    try {
      const response = await emailPayslip(payrollId);
      alert(response?.data?.message || "Email sent.");
    } catch (err) {
      alert("Email failed.");
    } finally { setIsEmailing(null); }
  };

  const handleViewHistory = async (empId, fullName) => {
    try {
      const res = await getEmployeeHistory(empId);
      setHistoryData(Array.isArray(res.data) ? res.data : []);
      setSelectedEmpName(fullName);
      setIsHistoryOpen(true);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading-spinner">Syncing Command Center...</div>;

  return (
    <div className="payroll-container">
      <div className="payroll-header-section">
        <h1 className="header-title">Payroll Command</h1>
        <div className="payroll-filter-bar">
          <input className="filter-search-small" placeholder="Search..." value={search} onChange={(e)=>{setSearch(e.target.value); setCurrentPage(1);}} />
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
              <th style={{width: '20%'}}>Employee</th>
              <th style={{width: '15%'}}>Earned Salary</th>
              <th style={{width: '15%'}}>Festival Bonuses</th>
              <th style={{width: '15%'}}>Other Bonus</th>
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
                        <input type="number" className="salary-input-edit" 
                          min="0"
                          value={inputs.earnedSalary ?? emp.earnedSalary ?? 0} 
                          onChange={(e)=>handleInputChange(emp.empId, 'earnedSalary', e.target.value)} />
                    </div>}
                  </td>
                  <td>
                    {isInputLocked ? <span className="locked-value">{emp.festivalBonus?.toLocaleString() || 0}</span> : 
                    <input type="number" className="bonus-input-small" 
                      min="0"
                      value={inputs.festivalBonus ?? emp.festivalBonus ?? 0} 
                      onChange={(e)=>handleInputChange(emp.empId, 'festivalBonus', e.target.value)}/>}
                  </td>
                  <td>
                    {isInputLocked ? <span className="locked-value">{emp.otherBonuses?.toLocaleString() || 0}</span> : 
                    <input type="number" className="bonus-input-small" 
                      min="0"
                      value={inputs.otherBonus ?? emp.otherBonuses ?? 0} 
                      onChange={(e)=>handleInputChange(emp.empId, 'otherBonus', e.target.value)}/>}
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

        {/* PROFESSIONAL PAGINATION UI */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredEmployees.length)} of {filteredEmployees.length} records
            </div>
            <div className="pagination-controls">
              <button 
                className="pagination-btn" 
                disabled={currentPage === 1} 
                onClick={() => handlePageChange(currentPage - 1)}
              >
                &laquo; Previous
              </button>
              
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Logic to show only a subset of pages if 1000s of records exist
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button 
                      key={pageNum} 
                      className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} className="pagination-ellipsis">...</span>;
                }
                return null;
              })}

              <button 
                className="pagination-btn" 
                disabled={currentPage === totalPages} 
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next &raquo;
              </button>
            </div>
          </div>
        )}
      </div>

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={()=>setIsHistoryOpen(false)} 
        history={historyData} 
        employeeName={selectedEmpName} 
      />

      <style>{`
        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-top: 1px solid #edf2f7;
          background: #fff;
        }
        .pagination-info {
          font-size: 0.875rem;
          color: #718096;
        }
        .pagination-controls {
          display: flex;
          gap: 0.25rem;
          align-items: center;
        }
        .pagination-btn {
          padding: 0.5rem 0.75rem;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #4a5568;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) {
          background: #f7fafc;
          border-color: #cbd5e0;
        }
        .pagination-btn.active {
          background: #3182ce;
          color: white;
          border-color: #3182ce;
        }
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pagination-ellipsis {
          color: #a0aec0;
          padding: 0 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default PayrollManagement;