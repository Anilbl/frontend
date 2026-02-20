import { useEffect, useState, useMemo, useRef } from "react";
import api from "../../api/axios";
import "./Attendance.css";

export default function AdminAttendance() {
    const now = new Date();
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [attendance, setAttendance] = useState([]);
    
    // Set default month and year to CURRENT
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    
    // Stats state - strictly matching your Backend Map keys
    const [stats, setStats] = useState({ 
        present: 0, 
        leaveTaken: 0, 
        absent: 0, 
        totalDaysInMonth: 0 
    });
    
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;
    const searchRef = useRef(null);

    // --- restored Feature: Dynamic Total Days Calculation ---
    const totalDaysInSelectedMonth = useMemo(() => {
        // This calculates the last day of the selected month
        return new Date(selectedYear, selectedMonth, 0).getDate();
    }, [selectedMonth, selectedYear]);

    // Initial Load: Fetch Employee List
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await api.get("/employees");
                setEmployees(res.data);
            } catch (err) { 
                console.error("Failed to load employees", err); 
            }
        };
        fetchEmployees();

        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Main Concept Update: Unified Data Fetching ---
    useEffect(() => {
        const fetchAllData = async () => {
            if (!selectedEmp) return;
            setLoading(true);
            try {
                // 1. Fetch Stats from Backend (Dashboard Cards)
                const statsRes = await api.get(`/attendance/stats/${selectedEmp.empId}/${selectedYear}/${selectedMonth}`);
                setStats(statsRes.data);

                // 2. Fetch History (Table)
                const historyRes = await api.get(`/attendance/employee/${selectedEmp.empId}`);
                
                // 3. Filter history for the selected month/year locally
                const filteredHistory = historyRes.data.filter(record => {
                    const d = new Date(record.attendanceDate);
                    // Ensure comparison works regardless of string or number types
                    return (d.getMonth() + 1) === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
                });
                
                setAttendance(filteredHistory);
                setCurrentPage(1); 
            } catch (err) {
                console.error("Error fetching data", err);
                setAttendance([]);
                // Reset stats on error to prevent showing old data
                setStats({ present: 0, leaveTaken: 0, absent: 0, totalDaysInMonth: 0 });
            } finally { 
                setLoading(false); 
            }
        };
        fetchAllData();
    }, [selectedEmp, selectedMonth, selectedYear]);

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return [];
        return employees.filter(emp => 
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.empId.toString().includes(searchTerm)
        );
    }, [searchTerm, employees]);

    // Pagination Calculation
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = attendance.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(attendance.length / recordsPerPage);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

    return (
        <div className="attendance-container">
            <header className="attendance-header">
                <h1>Employee Attendance Dashboard</h1>
                <p className="subtitle">Records for {monthNames[selectedMonth - 1]} {selectedYear}</p>
            </header>

            <div className="filter-section admin-controls">
                <div className="search-wrapper" ref={searchRef}>
                    <label>Employee Search</label>
                    <input 
                        type="text" 
                        placeholder="Search by Name or ID..."
                        className="search-input"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                    />
                    {showDropdown && filteredEmployees.length > 0 && (
                        <div className="search-results">
                            {filteredEmployees.map(emp => (
                                <div key={emp.empId} className="result-item" onClick={() => {
                                    setSelectedEmp(emp);
                                    setSearchTerm(`${emp.firstName} ${emp.lastName}`);
                                    setShowDropdown(false);
                                }}>
                                    {emp.firstName} {emp.lastName} <span className="emp-id-tag">#{emp.empId}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="date-selectors">
                    <div className="select-group">
                        <label>Month</label>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                            {monthNames.map((name, index) => (
                                <option key={name} value={index + 1}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="select-group">
                        <label>Year</label>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loader">Updating Records...</div>
            ) : selectedEmp && (
                <>
                    <div className="stats-grid">
                        <div className="stat-card total">
                            <span className="stat-label">Days in Month</span>
                            {/* restored dynamic feature */}
                            <span className="stat-value">{totalDaysInSelectedMonth}</span>
                        </div>
                        <div className="stat-card present">
                            <span className="stat-label">Present</span>
                            <span className="stat-value">{stats.present || 0}</span>
                        </div>
                        <div className="stat-card leave">
                            <span className="stat-label">Leave Taken</span>
                            <span className="stat-value">{stats.leaveTaken || 0}</span>
                        </div>
                        <div className="stat-card absent">
                            <span className="stat-label">Absent Days</span>
                            <span className="stat-value">{stats.absent || 0}</span>
                        </div>
                    </div>

                    <div className="history-section">
                        <div className="table-header-flex">
                            <h2>Monthly History: {selectedEmp.firstName}</h2>
                            <span className="record-count">{attendance.length} Logs Found</span>
                        </div>
                        <div className="table-wrapper">
                            <table className="attendance-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRecords.map((row) => (
                                        <tr key={row.attendanceId}>
                                            <td><strong>{row.attendanceDate}</strong></td>
                                            <td>
                                                <span className={`badge badge-${row.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td>{row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</td>
                                            <td>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</td>
                                            <td>{row.workLocation || "Office"}</td>
                                        </tr>
                                    ))}
                                    {attendance.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="no-data-cell">
                                                No specific logs for {monthNames[selectedMonth - 1]}.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {attendance.length > recordsPerPage && (
                            <div className="pagination-bar">
                                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                                <span>Page {currentPage} of {totalPages}</span>
                                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}