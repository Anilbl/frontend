import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { 
  getEmployeeHistory, 
  voidPayrollRecord, 
  emailPayslip 
} from "../../api/payrollApi";
import "./Payroll.css";

// Constants for Month Management
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// History Modal Component
const HistoryModal = ({ isOpen, onClose, history, employeeName }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const availableYears = useMemo(() => {
    const years = [];
    for (let y = new Date().getFullYear(); y >= 2020; y--) years.push(y.toString());
    return years;
  }, []);

  if (!isOpen) return null; 

  const yearlyHistory = (history || []).filter(h => 
    h.payDate && h.payDate.startsWith(selectedYear)
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="history-modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="header-title">Payroll Audit: {employeeName}</h2>
            <p className="header-subtitle">Statutory history and tax deductions</p>
          </div>
          <div className="modal-controls">
            <select className="filter-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>
        <div className="modal-body">
          <table className="history-table">
            <thead>
              <tr>
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
                  <td>{h.payDate}</td>
                  <td>Rs. {h.grossSalary?.toLocaleString()}</td>
                  <td className="deduction">- {h.ssfContribution?.toLocaleString()}</td>
                  <td className="deduction">- {h.citContribution?.toLocaleString()}</td>
                  <td className="deduction">Rs. {h.totalTax?.toLocaleString()}</td>
                  <td className="bold text-success">Rs. {h.netSalary?.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${h.status?.toLowerCase().replace('_', '-')}`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              )) : <tr><td colSpan="7" className="empty-state">No records found for {selectedYear}.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PayrollManagement = () => {
  const navigate = useNavigate();
  
  // State Management
  const [emailStatus, setEmailStatus] = useState({ loading: false, id: null });
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]); 
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedEmpName, setSelectedEmpName] = useState("");
  const [processingInputs, setProcessingInputs] = useState({});

  // Date & Status State
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Helpers
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

  // Data Fetching
  const fetchData = async () => {
    try {
      setLoading(true);
      const monthMap = {
        "JANUARY": "01", "FEBRUARY": "02", "MARCH": "03", "APRIL": "04",
        "MAY": "05", "JUNE": "06", "JULY": "07", "AUGUST": "08",
        "SEPTEMBER": "09", "OCTOBER": "10", "NOVEMBER": "11", "DECEMBER": "12"
      };
      const monthValue = monthMap[selectedMonth.toUpperCase()];

      const [pRes, eRes, mRes] = await Promise.all([
        api.get("/payrolls"), 
        api.get("/payrolls/batch-calculate", {
            params: { month: monthValue, year: selectedYear }
        }),
        api.get("/payment-methods")
      ]);

      setPayrolls(pRes.data || []);
      setEmployees(Array.isArray(eRes.data) ? eRes.data : []);
      setPaymentMethods(mRes.data || []);

    } catch (err) { 
      console.error("Sync Error:", err);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [selectedMonth, selectedYear]);

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
        map.set(String(empId), p);
      }
    });
    return map;
  }, [payrolls, selectedMonth, selectedYear]);

  const filteredEmployees = useMemo(() => {
    return employees
      .filter(e => {
        const matchesSearch = (e.fullName || `${e.firstName} ${e.lastName}`).toLowerCase().includes(search.toLowerCase());
        const record = currentStatusMap.get(String(e.empId));
        const earnedValue = e.earnedSalary ?? e.basicSalary ?? 0;
        
        let currentStatus = "READY";
        if (record) {
          currentStatus = record.status;
        } else if (isPastDate) {
          currentStatus = "NO RECORD";
        } else if (earnedValue === 0) {
          currentStatus = "NO EARNINGS";
        }

        const matchesStatus = selectedStatus === "All" || currentStatus === selectedStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.empId - a.empId);
  }, [employees, search, selectedStatus, currentStatusMap, isPastDate]);

  const stats = useMemo(() => {
    const total = filteredEmployees.length;
    const paid = filteredEmployees.filter(e => currentStatusMap.get(String(e.empId))?.status === "PAID").length;
    return { total, paid, pending: total - paid };
  }, [filteredEmployees, currentStatusMap]);

  const totalPages = Math.ceil(filteredEmployees.length / recordsPerPage);
  const currentRecords = filteredEmployees.slice(
    (currentPage - 1) * recordsPerPage, 
    currentPage * recordsPerPage
  );

  // Event Handlers
  const handleEmail = async (payrollId) => {
    setEmailStatus({ loading: true, id: payrollId });
    try {
      await emailPayslip(payrollId);
      alert("✅ Payslip sent successfully!");
    } catch (err) {
      alert(`❌ Failed: ${err.response?.data?.message || "Error"}`);
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
    const record = currentStatusMap.get(String(emp.empId));
    const inputs = processingInputs[emp.empId] || {};
    
    // Priority: New typed input > Existing saved record > Default 0
    const fBonus = inputs.festivalBonus ?? record?.festivalBonus ?? 0;
    const oBonus = inputs.otherBonus ?? record?.otherBonuses ?? 0;
    const cit = inputs.citContribution ?? record?.citContribution ?? 0;
    const pMethodId = inputs.paymentMethodId || record?.paymentMethod?.paymentMethodId;

    if (!pMethodId) return alert("Please select a payment method.");
    
    try {
        const payload = {
            empId: emp.empId, 
            festivalBonus: parseFloat(fBonus),
            bonuses: parseFloat(oBonus),
            citContribution: parseFloat(cit),
            payPeriodStart: `${selectedYear}-${getPaddedMonth(selectedMonth)}-01`
        };
        const res = await api.post("/payrolls/preview", payload);
        navigate("/admin/payroll/preview", { 
            state: { previewData: res.data, selectedPaymentMethodId: pMethodId } 
        });
    } catch (err) { alert(err.response?.data?.message || "Run failed"); }
  };

  const handleVoid = async (p) => {
    if (window.confirm(`Void payroll for ${p.employee?.firstName}?`)) {
      try { await voidPayrollRecord(p.payrollId); fetchData(); } catch { alert("Void failed"); }
    }
  };

  const handleViewHistory = async (emp) => {
    try {
      const res = await getEmployeeHistory(emp.empId);
      setHistoryData(res.data || []);
      setSelectedEmpName(emp.fullName || `${emp.firstName} ${emp.lastName}`);
      setIsHistoryOpen(true);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading-spinner">Synchronizing with Server...</div>;

  return (
    <div className="payroll-container">
      <div className="payroll-header-section">
        <div>
          <h1 className="header-title">Payroll Command Center</h1>
          <p className="header-subtitle">
            Current Period: <strong>{selectedMonth} {selectedYear}</strong> | 
            <span className="stats-tag"> {stats.paid}/{stats.total} Paid</span>
          </p>
        </div>
        
        <div className="header-controls">
          <select 
            value={selectedStatus} 
            onChange={(e) => {setSelectedStatus(e.target.value); setCurrentPage(1);}}
            className="filter-select status-dropdown"
          >
            <option value="All">All Statuses</option>
            <option value="READY">Ready</option>
            <option value="PAID">Paid</option>
            <option value="PENDING_PAYMENT">Pending</option>
            <option value="NO EARNINGS">No Earnings</option>
            <option value="NO RECORD">No Record (Past)</option>
          </select>

          <select value={selectedMonth} onChange={(e) => {setSelectedMonth(e.target.value); setCurrentPage(1);}} className="filter-select">
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          
          <select value={selectedYear} onChange={(e) => {setSelectedYear(e.target.value); setCurrentPage(1);}} className="filter-select">
            {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <input className="search-bar" placeholder="Search employee..." value={search} onChange={(e)=>{setSearch(e.target.value); setCurrentPage(1);}} />
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
            {currentRecords.length > 0 ? currentRecords.map(emp => {
              const record = currentStatusMap.get(String(emp.empId));
              const isPaid = record?.status === "PAID";
              const isPending = record?.status === "PENDING_PAYMENT";
              const isEditable = !isPaid && !isPastDate && !isFutureDate;
              
              const inputs = processingInputs[emp.empId] || {};
              const earnedValue = emp.earnedSalary ?? emp.basicSalary ?? 0;

              return (
                <tr key={emp.empId} className={isPaid ? "row-locked" : "table-row-hover"}>
                  <td>
                    <div className="emp-info">
                        <span className="emp-name">{emp.fullName || `${emp.firstName} ${emp.lastName}`}</span>
                        <span className="header-subtitle">{emp.maritalStatus}</span>
                    </div>
                  </td>

                  <td className="bold">Rs. {earnedValue.toLocaleString()}</td>
                  
                  <td>
                    {isPaid ? <span className="locked-value">Rs. {record.festivalBonus?.toLocaleString()}</span> : 
                    <input type="number" disabled={!isEditable} className="bonus-input-small" value={inputs.festivalBonus ?? record?.festivalBonus ?? 0} onChange={(e)=>handleInputChange(emp.empId, 'festivalBonus', e.target.value)}/>}
                  </td>
                  <td>
                    {isPaid ? <span className="locked-value">Rs. {record.otherBonuses?.toLocaleString()}</span> : 
                    <input type="number" disabled={!isEditable} className="bonus-input-small" value={inputs.otherBonus ?? record?.otherBonuses ?? 0} onChange={(e)=>handleInputChange(emp.empId, 'otherBonus', e.target.value)}/>}
                  </td>
                  <td>
                    {isPaid ? <span className="locked-value">Rs. {record.citContribution?.toLocaleString()}</span> : 
                    <input type="number" disabled={!isEditable} className="bonus-input-small" value={inputs.citContribution ?? record?.citContribution ?? 0} onChange={(e)=>handleInputChange(emp.empId, 'citContribution', e.target.value)}/>}
                  </td>
                  <td>
                    {isPaid ? <span className="method-label">{record.paymentMethod?.methodName || "Bank"}</span> : 
                    <select disabled={!isEditable} className="filter-select full-width-select" value={inputs.paymentMethodId || record?.paymentMethod?.paymentMethodId || ""} onChange={(e)=>handleInputChange(emp.empId, 'paymentMethodId', e.target.value)}>
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
                    {isPending ? (
                         <button className="btn-icon btn-pdf" onClick={()=>handleActionRun(emp)}>Resume</button>
                    ) : !record ? (
                      !isPastDate && (
                        <button className="btn-icon btn-pdf" disabled={isFutureDate || earnedValue === 0} onClick={()=>handleActionRun(emp)}>Run</button>
                      )
                    ) : isPaid && (
                      <>
                        <button className="btn-icon btn-email" disabled={emailStatus.loading && emailStatus.id === record.payrollId} onClick={() => handleEmail(record.payrollId)}>
                          {emailStatus.loading && emailStatus.id === record.payrollId ? "..." : "Email"}
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
                  No records found matching your filters for {selectedMonth}.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="pagination-footer">
          <span className="header-subtitle">
            Showing <strong>{currentRecords.length}</strong> of {filteredEmployees.length} results
          </span>
          <div className="header-controls">
            <button className="p-btn" disabled={currentPage === 1} onClick={()=>setCurrentPage(prev => Math.max(prev - 1, 1))}>Prev</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={`p-btn ${currentPage === i+1 ? 'active' : ''}`} onClick={()=>setCurrentPage(i+1)}>{i+1}</button>
            ))}
            <button className="p-btn" disabled={currentPage === totalPages || totalPages === 0} onClick={()=>setCurrentPage(prev => Math.min(prev + 1, totalPages))}>Next</button>
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