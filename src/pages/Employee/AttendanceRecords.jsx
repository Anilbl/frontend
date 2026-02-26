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
    const [isOnLeave, setIsOnLeave] = useState(false); // NEW: Leave state
    const [countdown, setCountdown] = useState(""); 
    const [currentTime, setCurrentTime] = useState(new Date()); 

    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 10;

    const OFFICE_LAT = 28.8475; 
    const OFFICE_LON = 80.3160; 
    const ALLOWED_RADIUS_METERS = 300000; 
    const API_URL = "http://localhost:8080/api/attendance";
    const LEAVE_API_URL = "http://localhost:8080/api/employee-leaves"; // Ensure this is correct

    const getAuthHeader = useCallback(() => {
        const token = session.jwt || session.token; 
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [session.jwt, session.token]);

    // NEW: Function to check if employee is currently on leave
    const checkLeaveStatus = useCallback(async (id) => {
        try {
            const headers = getAuthHeader();
            const res = await axios.get(LEAVE_API_URL, { headers });
            const today = new Date().toISOString().split('T')[0];
            
            // Check if any APPROVED leave record covers TODAY
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
            
            // Priority 1: Check if On Leave (Overwrites other statuses)
            if (isOnLeave) {
                setStatus("ON LEAVE");
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
                        setStatus("10H RULE COOLING DOWN");
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
                setCanCheckOut(false);
                setStatus("Not Checked In");
            }
        } catch (err) {
            setBackendError("Failed to sync attendance history.");
        }
    }, [employeeId, getAuthHeader, isOnLeave]);

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
                
                // Chain the checks
                await checkLeaveStatus(empId);
                await fetchAttendance(empId);
            }
        } catch (err) {
            setBackendError("Identity verification failed.");
        } finally {
            setLoading(false);
        }
    }, [session.userId, fetchAttendance, checkLeaveStatus]);

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

    // Pagination Logic
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = history.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(history.length / recordsPerPage);

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
                            disabled={loading || !canCheckIn || !employeeId || isOnLeave}
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
                    {isOnLeave && <p className="lock-notice">⚠️ Actions disabled while on leave.</p>}
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
                                    <td>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString() : <span className="active-badge">On Shift</span>}</td>
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