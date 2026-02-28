import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getProfileByUserId } from "../../api/employeeApi";
import "./AttendanceRecord.css";

const AttendanceRecords = () => {
    const session = JSON.parse(localStorage.getItem("user_session") || "{}");
    
    const [employeeId, setEmployeeId] = useState(session.empId || null);
    const [fullName, setFullName] = useState("");
    
    const [status, setStatus] = useState("Not Checked In");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [liveLocation, setLiveLocation] = useState({ lat: null, lon: null });
    const [liveDistance, setLiveDistance] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [backendError, setBackendError] = useState(""); 
    const [canCheckIn, setCanCheckIn] = useState(true);
    const [canCheckOut, setCanCheckOut] = useState(false); 
    const [isOnLeave, setIsOnLeave] = useState(false); 
    const [isHoliday, setIsHoliday] = useState(false); // NEW
    const [isSaturday, setIsSaturday] = useState(false); // NEW
    const [countdown, setCountdown] = useState(""); 
    const [currentTime, setCurrentTime] = useState(new Date()); 

    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    const OFFICE_LAT = 28.8475; 
    const OFFICE_LON = 80.3160; 
    const ALLOWED_RADIUS_METERS = 300000; 
    const API_URL = "http://localhost:8080/api/attendance";
    const LEAVE_API_URL = "http://localhost:8080/api/employee-leaves";
    const HOLIDAY_API_URL = "http://localhost:8080/api/holidays"; // NEW

    const getAuthHeader = useCallback(() => {
        const token = session.jwt || session.token; 
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [session.jwt, session.token]);

    // Check if today is Saturday or a Holiday
    const checkCalendarRestrictions = useCallback(async () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // 1. Check Saturday
        if (today.getDay() === 6) { // 6 is Saturday
            setIsSaturday(true);
            setCanCheckIn(false);
            setStatus("WEEKEND (SATURDAY)");
            setBackendError("Today is Saturday. Check-in is disabled.");
            return true;
        }

        // 2. Check Public Holidays from Backend
        try {
            const res = await axios.get(HOLIDAY_API_URL, { headers: getAuthHeader() });
            const holidayToday = res.data.find(h => h.holidayDate === todayStr);
            if (holidayToday) {
                setIsHoliday(true);
                setCanCheckIn(false);
                setStatus(`HOLIDAY: ${holidayToday.holidayName.toUpperCase()}`);
                setBackendError(`Today is a public holiday (${holidayToday.holidayName}). Check-in is disabled.`);
                return true;
            }
        } catch (err) {
            console.error("Error fetching holidays", err);
        }
        return false;
    }, [getAuthHeader]);

    const checkLeaveStatus = useCallback(async (id) => {
        try {
            const headers = getAuthHeader();
            const res = await axios.get(LEAVE_API_URL, { headers });
            const today = new Date().toISOString().split('T')[0];
            
            const activeLeave = res.data.find(leave => 
                leave.employee?.empId === id &&
                leave.status === "Approved" &&
                today >= leave.startDate &&
                today <= leave.endDate
            );

            if (activeLeave) {
                setIsOnLeave(true);
                setCanCheckIn(false);
                setStatus("ON LEAVE");
                setBackendError("You are currently on leave. Check-in is disabled.");
            }
        } catch (err) {
            console.error("Error checking leave status", err);
        }
    }, [getAuthHeader]);

    const fetchAttendance = useCallback(async (targetId) => {
        const idToUse = targetId || employeeId;
        if (!idToUse) return;

        try {
            const headers = getAuthHeader();
            const res = await axios.get(`${API_URL}/employee/${idToUse}`, { headers });
            const sorted = res.data.sort((a, b) => new Date(b.checkInTime) - new Date(a.checkInTime));
            setHistory(sorted);
            
            const now = new Date();
            const latestRec = sorted[0]; 
            
            // PRIORITY RESTRICTIONS
            if (isOnLeave || isHoliday || isSaturday) {
                setCanCheckIn(false);
                return;
            }

            if (latestRec) {
                const lastCheckIn = new Date(latestRec.checkInTime);
                const diffMs = now - lastCheckIn;
                const hoursSinceLastIn = diffMs / (1000 * 60 * 60);

                if (!latestRec.checkOutTime) {
                    setStatus("Checked In");
                    setCanCheckIn(false);
                    setCanCheckOut(hoursSinceLastIn >= 8);
                } else {
                    if (hoursSinceLastIn < 10) {
                        setCanCheckIn(false);
                        setCanCheckOut(false);
                        setStatus("COOLING DOWN");
                        const remainingMs = (10 * 60 * 60 * 1000) - diffMs;
                        const h = Math.floor(remainingMs / 3600000);
                        const m = Math.floor((remainingMs % 3600000) / 60000);
                        setCountdown(`${h}h ${m}m remaining`);
                    } else {
                        setCanCheckIn(true);
                        setCanCheckOut(false);
                        setCountdown("");
                        setStatus("Not Checked In");
                    }
                }
            } else {
                setCanCheckIn(true);
                setStatus("Not Checked In");
            }
        } catch (err) {
            setBackendError("Failed to sync attendance history.");
        }
    }, [employeeId, getAuthHeader, isOnLeave, isHoliday, isSaturday]);

    const fetchEmployeeDetails = useCallback(async () => {
        const userId = session.userId; 
        if (!userId) return;

        try {
            setLoading(true);
            const res = await getProfileByUserId(userId);
            if (res.data) {
                const empId = res.data.empId;
                setFullName(`${res.data.firstName} ${res.data.lastName}`);
                setEmployeeId(empId); 
                
                // Run all restriction checks
                await checkCalendarRestrictions();
                await checkLeaveStatus(empId);
                await fetchAttendance(empId);
            }
        } catch (err) {
            setBackendError("Identity verification failed.");
        } finally {
            setLoading(false);
        }
    }, [session.userId, fetchAttendance, checkLeaveStatus, checkCalendarRestrictions]);

    useEffect(() => {
        fetchEmployeeDetails();
        const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);

        const watchId = navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const R = 6371000;
            const dLat = (OFFICE_LAT - lat) * Math.PI / 180;
            const dLon = (OFFICE_LON - lon) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat * Math.PI / 180) * Math.cos(OFFICE_LAT * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            setLiveDistance(dist.toFixed(1));
            setLiveLocation({ lat, lon });
        }, (err) => console.error("GPS Error", err), { enableHighAccuracy: true });
        
        return () => {
            navigator.geolocation.clearWatch(watchId);
            clearInterval(clockInterval);
        };
    }, [fetchEmployeeDetails]);

    const handleAttendance = async (type) => {
        setBackendError("");
        if (isOnLeave) return setBackendError("Action Denied: You are currently on an approved leave.");
        if (isSaturday) return setBackendError("Action Denied: Cannot check in on Saturdays.");
        if (isHoliday) return setBackendError("Action Denied: Today is a public holiday.");
        
        if (!employeeId) return setBackendError("System syncing. Please wait.");
        if (parseFloat(liveDistance) > ALLOWED_RADIUS_METERS) {
            return setBackendError("Access Denied: You are outside the allowed radius.");
        }

        setLoading(true);
        try {
            const headers = getAuthHeader();
            if (type === "in") {
                const payload = {
                    employee: { empId: employeeId }, 
                    inGpsLat: liveLocation.lat,
                    inGpsLong: liveLocation.lon,
                    status: "PRESENT"
                };
                await axios.post(API_URL, payload, { headers });
            } else {
                const activeRec = history.find(r => !r.checkOutTime);
                if (!activeRec) throw new Error("No active session found.");
                await axios.put(`${API_URL}/checkout/${activeRec.attendanceId}`, {}, { headers });
            }
            
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);
            await fetchAttendance(employeeId); 
        } catch (err) {
            setBackendError(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    // Pagination
    const currentRecords = history.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

    return (
        <div className="attendance-portal">
            {backendError && (
                <div className="error-banner">
                    <span className="error-icon">⚠️</span>
                    <p>{backendError}</p>
                    <button className="close-error" onClick={() => setBackendError("")}>&times;</button>
                </div>
            )}

            <header className="portal-header">
                <div className="title-section">
                    <h1>Attendance Management</h1>
                    <p className="subtitle">Welcome, <strong>{fullName || "..."}</strong> • {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</p>
                </div>
                {showSuccess && <div className="toast success">Success! Status Updated.</div>}
            </header>

            <main className="portal-grid">
                <section className="portal-card status-card">
                    <h3>Current Status</h3>
                    <div className={`status-pill ${status.toLowerCase().replace(/\s/g, '-')}`}>
                        {status}
                    </div>
                    {isOnLeave && <p className="leave-notice">🏖 Leave is active today.</p>}
                    {(isHoliday || isSaturday) && <p className="leave-notice">📅 Off-day: No check-in required.</p>}
                    {countdown && <div className="countdown-timer">Available in: {countdown}</div>}
                    
                    <div className="geofence-box">
                         <div className="gps-header">
                            <span className="gps-dot active"></span>
                            <p>GPS Tracking</p>
                         </div>
                         <h2 className={parseFloat(liveDistance) <= ALLOWED_RADIUS_METERS ? "safe" : "danger"}>
                            {liveDistance ? `${liveDistance}m` : "Locating..."}
                         </h2>
                         <small>{parseFloat(liveDistance) <= ALLOWED_RADIUS_METERS ? "✓ Inside Perimeter" : "⚠ Outside Perimeter"}</small>
                    </div>
                </section>

                <section className="portal-card action-card">
                    <h3>Quick Actions</h3>
                    <div className="action-buttons-container">
                        <button 
                            className="btn-pro btn-checkin" 
                            onClick={() => handleAttendance("in")} 
                            disabled={loading || !canCheckIn || !employeeId || isOnLeave || isHoliday || isSaturday}
                        >
                            <div className="btn-content">
                                <span className="icon">登</span>
                                <span>{loading ? "Processing..." : "Check In"}</span>
                            </div>
                        </button>

                        <button 
                            className="btn-pro btn-checkout" 
                            onClick={() => handleAttendance("out")} 
                            disabled={loading || !canCheckOut || !employeeId}
                        >
                            <div className="btn-content">
                                <span className="icon">退</span>
                                <span>{loading ? "Processing..." : "Check Out"}</span>
                            </div>
                        </button>
                    </div>
                    {(isOnLeave || isHoliday || isSaturday) && (
                        <p className="lock-notice">⚠️ Actions disabled for scheduled off-days/leave.</p>
                    )}
                </section>
            </main>

            <section className="portal-card log-section">
                <div className="log-header">
                    <h3>Monthly Attendance Logs</h3>
                </div>
                <div className="table-responsive">
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRecords.map(row => (
                                <tr key={row.attendanceId}>
                                    <td><strong>{row.attendanceDate}</strong></td>
                                    <td>{row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString() : "--"}</td>
                                    <td>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString() : row.checkInTime ? <span className="active-badge">On Shift</span> : "--"}</td>
                                    <td><span className={`tag-status status-${row.status?.toLowerCase()}`}>{row.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default AttendanceRecords;