import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../api/axios"; 
import './Payroll.css';

// Constants for Month selection
const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
];

// Reusable History Modal Component
const HistoryModal = ({ isOpen, onClose, history, employeeName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Payroll History: {employeeName}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <table className="history-detail-table">
            <thead>
              <tr>
                <th>Payroll ID</th>
                <th>Period</th>
                <th>Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((h) => (
                <tr key={h.payrollId}>
                  <td>#{h.payrollId}</td>
                  <td>{h.payPeriodStart}</td>
                  <td className="bold">Rs. {h.netSalary?.toLocaleString()}</td>
                  <td>
                    <span className={`status-tag tag-${h.status?.toLowerCase()}`}>
                      {h.status}
                    </span>
                  </td>
                </tr>
              )) : <tr><td colSpan="4" className="empty-state">No history found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AccountantPayroll = () => {
  const navigate = useNavigate();
  
  // States
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [emailStatus, setEmailStatus] = useState({ loading: false, id: null });
  
  // Modal States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [selectedEmpName, setSelectedEmpName] = useState("");

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [processingInputs, setProcessingInputs] = useState({});

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const getPaddedMonth = (monthName) => String(MONTHS.indexOf(monthName) + 1).padStart(2, '0');

  // Date Check Helpers
  const dateInfo = useMemo(() => {
    const now = new Date();
    const selDate = new Date(parseInt(selectedYear), MONTHS.indexOf(selectedMonth));
    const currDate = new Date(now.getFullYear(), now.getMonth());
    return {
      isFuture: selDate > currDate,
      isPast: selDate < currDate,
      targetPeriod: `${selectedYear}-${getPaddedMonth(selectedMonth)}`
    };
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const monthValue = getPaddedMonth(selectedMonth);

      const [pRes, eRes, mRes] = await Promise.all([
        api.get("/payrolls"), 
        api.get("/payrolls/batch-calculate", { params: { month: monthValue, year: selectedYear } }),
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

  useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

  // Map payroll records to employees for the selected period
  const currentStatusMap = useMemo(() => {
    const map = new Map();
    payrolls.forEach(p => {
      if (p.status === "VOIDED") return;
      const empId = p.employee?.empId || p.empId;
      const recordDate = Array.isArray(p.payPeriodStart) 
        ? `${p.payPeriodStart[0]}-${String(p.payPeriodStart[1]).padStart(2, '0')}`
        : p.payPeriodStart?.substring(0, 7);

      if (empId && recordDate === dateInfo.targetPeriod) {
        map.set(String(empId), p);
      }
    });
    return map;
  }, [payrolls, dateInfo]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const fullName = (e.fullName || `${e.firstName} ${e.lastName}`).toLowerCase();
      const matchesSearch = fullName.includes(search.toLowerCase());
      const record = currentStatusMap.get(String(e.empId));
      
      let status = record ? record.status : (dateInfo.isPast ? "NO RECORD" : (e.earnedSalary === 0 ? "NO EARNINGS" : "READY"));
      return matchesSearch && (selectedStatus === "All" || status === selectedStatus);
    }).sort((a, b) => b.empId - a.empId);
  }, [employees, search, selectedStatus, currentStatusMap, dateInfo]);

  const stats = useMemo(() => ({
    total: filteredEmployees.length,
    paid: filteredEmployees.filter(e => currentStatusMap.get(String(e.empId))?.status === "PAID").length
  }), [filteredEmployees, currentStatusMap]);

  const currentRecords = filteredEmployees.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);
  const totalPages = Math.ceil(filteredEmployees.length / recordsPerPage);

  // Handlers
  const handleInputChange = (empId, field, val) => {
    setProcessingInputs(prev => ({
      ...prev,
      [empId]: { ...(prev[empId] || {}), [field]: val }
    }));
  };

  const handleActionRun = async (emp) => {
    const record = currentStatusMap.get(String(emp.empId));
    const inputs = processingInputs[emp.empId] || {};
    const paymentMethodId = inputs.paymentMethodId || record?.paymentMethod?.paymentMethodId;

    if (!paymentMethodId) return alert("Please select a payment method.");

    try {
      const payload = {
        empId: emp.empId, 
        festivalBonus: parseFloat(inputs.festivalBonus ?? record?.festivalBonus ?? 0),
        bonuses: parseFloat(inputs.otherBonus ?? record?.otherBonuses ?? 0),
        citContribution: parseFloat(inputs.citContribution ?? record?.citContribution ?? 0),
        payPeriodStart: `${dateInfo.targetPeriod}-01`
      };
      const res = await api.post("/payrolls/preview", payload);
      navigate("/accountant/payroll-processing/preview", { 
        state: { previewData: res.data, selectedPaymentMethodId: paymentMethodId } 
      });
    } catch (err) { alert(err.response?.data?.message || "Run failed"); }
  };

  const handleViewHistory = async (emp) => {
    try {
      const res = await api.get(`/payrolls/employee/${emp.empId}`);
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
            {selectedMonth} {selectedYear} | <span className="stats-tag">{stats.paid}/{stats.total} Paid</span>
          </p>
        </div>
        
        <div className="header-controls">
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="filter-select">
            <option value="All">All Statuses</option>
            <option value="READY">Ready</option>
            <option value="PAID">Paid</option>
            <option value="PENDING_PAYMENT">Pending</option>
          </select>

          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="filter-select">
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          
          <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="filter-select">
            {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          <input className="search-bar" placeholder="Search employee..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
            {currentRecords.map(emp => {
              const record = currentStatusMap.get(String(emp.empId));
              const isPaid = record?.status === "PAID";
              const isEditable = !isPaid && !dateInfo.isPast && !dateInfo.isFuture;
              const inputs = processingInputs[emp.empId] || {};

              return (
                <tr key={emp.empId} className={isPaid ? "row-locked" : "table-row-hover"}>
                  <td>
                    <div className="emp-info">
                        <span className="emp-name">{emp.fullName || `${emp.firstName} ${emp.lastName}`}</span>
                        <span className="emp-id-sub">ID: {emp.empId}</span>
                    </div>
                  </td>
                  <td className="bold">Rs. {(emp.earnedSalary || emp.basicSalary || 0).toLocaleString()}</td>
                  <td>
                    {isPaid ? record.festivalBonus?.toLocaleString() : 
                      <input type="number" disabled={!isEditable} className="bonus-input-small" 
                        value={inputs.festivalBonus ?? record?.festivalBonus ?? 0} 
                        onChange={(e)=>handleInputChange(emp.empId, 'festivalBonus', e.target.value)} />}
                  </td>
                  <td>
                    {isPaid ? record.otherBonuses?.toLocaleString() : 
                      <input type="number" disabled={!isEditable} className="bonus-input-small" 
                        value={inputs.otherBonus ?? record?.otherBonuses ?? 0} 
                        onChange={(e)=>handleInputChange(emp.empId, 'otherBonus', e.target.value)} />}
                  </td>
                  <td>
                    {isPaid ? record.citContribution?.toLocaleString() : 
                      <input type="number" disabled={!isEditable} className="bonus-input-small" 
                        value={inputs.citContribution ?? record?.citContribution ?? 0} 
                        onChange={(e)=>handleInputChange(emp.empId, 'citContribution', e.target.value)} />}
                  </td>
                  <td>
                    {isPaid ? record.paymentMethod?.methodName : 
                      <select disabled={!isEditable} className="filter-select" 
                        value={inputs.paymentMethodId || record?.paymentMethod?.paymentMethodId || ""} 
                        onChange={(e)=>handleInputChange(emp.empId, 'paymentMethodId', e.target.value)}>
                        <option value="">Select</option>
                        {paymentMethods.map(m => <option key={m.paymentMethodId} value={m.paymentMethodId}>{m.methodName}</option>)}
                      </select>}
                  </td>
                  <td>
                    <span className={`status-badge status-${(record?.status || "READY").toLowerCase()}`}>
                        {record?.status || (dateInfo.isPast ? "NO RECORD" : "READY")}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button className="btn-icon btn-pdf" disabled={isPaid || dateInfo.isFuture} onClick={()=>handleActionRun(emp)}>
                      {record?.status === "PENDING_PAYMENT" ? "Resume" : "Run"}
                    </button>
                    <button className="btn-icon btn-history" onClick={()=>handleViewHistory(emp)}>History</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        <div className="pagination-footer">
          <button className="p-btn" disabled={currentPage === 1} onClick={()=>setCurrentPage(prev => prev - 1)}>Prev</button>
          <span>Page {currentPage} of {totalPages || 1}</span>
          <button className="p-btn" disabled={currentPage === totalPages} onClick={()=>setCurrentPage(prev => prev + 1)}>Next</button>
        </div>
      </div>

      <HistoryModal isOpen={isHistoryOpen} onClose={()=>setIsHistoryOpen(false)} history={historyData} employeeName={selectedEmpName} />
    </div>
  );
};

export default AccountantPayroll;