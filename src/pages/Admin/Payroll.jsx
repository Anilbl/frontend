import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { 
  getEmployeeHistory, 
  voidPayrollRecord, 
  emailPayslip 
} from "../../api/payrollApi";
import "./Payroll.css";

// --- History Modal Component ---
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
  
  // States
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

  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pRes, eRes, mRes] = await Promise.all([
        api.get("/payrolls", { params: { month: parseInt(selectedMonth), year: parseInt(selectedYear) } }), 
        api.get("/employees"),
        api.get("/payment-methods")
      ]);
      setPayrolls(pRes.data || []);
      setEmployees(eRes.data || []);
      setPaymentMethods(mRes.data || []);
    } catch (err) { 
      console.error("Sync Error:", err); 
    } finally { setLoading(false); }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentStatusMap = useMemo(() => {
    const map = new Map();
    payrolls.forEach(p => {
      if (!p.isVoided) {
        const empId = p.employee?.empId || p.empId;
        map.set(String(empId), p);
      }
    });
    return map;
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
  const totalPages = Math.ceil(filteredEmployees.length / recordsPerPage);

  const handleInputChange = (empId, field, val) => {
    setProcessingInputs(prev => ({
      ...prev,
      [empId]: { ...(prev[empId] || {}), [field]: val }
    }));
  };

  const handleActionRun = async (emp) => {
    const inputs = processingInputs[emp.empId] || {};
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
  };

  const handleViewHistory = async (emp) => {
    try {
      const res = await getEmployeeHistory(emp.empId);
      setHistoryData(res.data || []);
      setSelectedEmpName(`${emp.firstName} ${emp.lastName}`);
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
        </div>
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
              <th>Method</th>
              <th>Status</th>
              <th className="actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
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
          </tbody>
        </table>

        {/* Pagination Footer */}
        <div className="pagination-footer">
          <div className="header-subtitle">Showing {currentRecords.length} of {filteredEmployees.length}</div>
          <div className="header-controls">
            <button className="p-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p-1)}>Prev</button>
            <span className="bold">{currentPage} / {totalPages || 1}</span>
            <button className="p-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p+1)}>Next</button>
          </div>
        </div>
      </div>

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={historyData} 
        employeeName={selectedEmpName} 
      />
    </div>
  );
};

export default PayrollManagement;