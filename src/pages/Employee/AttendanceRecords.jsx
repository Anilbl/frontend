import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./EmployeeDashboard.css";

const AttendanceRecords = () => {
    const session = JSON.parse(localStorage.getItem("user_session") || "{}");
    const [employeeId] = useState(session.empId || session.userId);
    
    const [status, setStatus] = useState("Not Checked In");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [liveLocation, setLiveLocation] = useState({ lat: null, lon: null });
    const [liveDistance, setLiveDistance] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const OFFICE_LAT = 28.8475; 
    const OFFICE_LON = 80.3160; 
    const ALLOWED_RADIUS_METERS = 300000; 
    const API_URL = "http://localhost:8080/api/attendance";

    const getAuthHeader = useCallback(() => {
        const token = session.jwt || session.token; 
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, [session.jwt, session.token]);

    const fetchAttendance = useCallback(async () => {
        if (!employeeId) return;
        try {
            const headers = getAuthHeader();
            const res = await axios.get(`${API_URL}/employee/${employeeId}`, { headers });
            const sorted = res.data.sort((a, b) => b.attendanceId - a.attendanceId);
            setHistory(sorted);
            
            const todayStr = new Date().toISOString().split('T')[0];
            const latestRec = sorted[0]; 
            
            if (latestRec && latestRec.attendanceDate === todayStr) {
                setStatus(latestRec.checkOutTime ? "Checked Out" : "Checked In");
            } else {
                setStatus("Not Checked In");
            }
        } catch (err) {
            console.error("Fetch Error:", err.message);
        }
    }, [employeeId, getAuthHeader]);

    useEffect(() => {
        fetchAttendance();
        const watchId = navigator.geolocation.watchPosition((pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            
            // Haversine formula inside getDistance is used here
            const R = 6371000;
            const dLat = (OFFICE_LAT - lat) * Math.PI / 180;
            const dLon = (OFFICE_LON - lon) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat * Math.PI / 180) * Math.cos(OFFICE_LAT * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            setLiveDistance(dist.toFixed(1));
            setLiveLocation({ lat, lon });
        }, (err) => console.error("GPS Error", err), { enableHighAccuracy: true });
        
        return () => navigator.geolocation.clearWatch(watchId);
    }, [fetchAttendance]);

    const handleAttendance = async (type) => {
        if (parseFloat(liveDistance) > ALLOWED_RADIUS_METERS) {
            return alert(`Access Denied: You are too far from the office.`);
        }

        setLoading(true);
        const now = new Date();
        const tzOffset = now.getTimezoneOffset() * 60000;
        const nowFormatted = new Date(now - tzOffset).toISOString().slice(0, 19);
        const todayDate = now.toISOString().split('T')[0];

        try {
            const headers = getAuthHeader();
            if (type === "in") {
                const payload = {
                    employee: { empId: employeeId }, 
                    attendanceDate: todayDate,
                    checkInTime: nowFormatted, 
                    inGpsLat: liveLocation.lat,
                    inGpsLong: liveLocation.lon,
                    // THIS FIXES THE "NO LOCATION" ON ADMIN SIDE
                    workLocation: `${liveLocation.lat.toFixed(4)}, ${liveLocation.lon.toFixed(4)}`,
                    status: "PRESENT"
                };
                await axios.post(API_URL, payload, { headers });
            } else {
                const activeRec = history.find(r => !r.checkOutTime);
                if (!activeRec) throw new Error("No active check-in found.");

                const payload = { 
                    ...activeRec, 
                    checkOutTime: nowFormatted,
                    employee: { empId: employeeId }
                };
                await axios.put(`${API_URL}/${activeRec.attendanceId}`, payload, { headers });
            }
            
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            fetchAttendance();
        } catch (err) {
            alert(`Error: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 7. Render
    return (
        <div className="attendance-portal">
            <header className="portal-header">
                <div className="title-section">
                    <h1>Employee Attendance Portal</h1>
                    <p>Welcome, <strong>{session.username || "Staff"}</strong></p>
                    {showSuccess && <div className="toast">Action Recorded Successfully!</div>}
                </div>
            </header>

            <main className="portal-grid">
                <section className="portal-card status-card">
                    <h3>Daily Status</h3>
                    <div className={`status-pill ${status.toLowerCase().replace(/\s/g, '-')}`}>{status}</div>
                    <div className="geofence-box">
                         <p>GPS Verification</p>
                         <h2 className={parseFloat(liveDistance) <= ALLOWED_RADIUS_METERS ? "safe" : "danger"}>
                            {liveDistance ? `${liveDistance}m` : "Locating..."}
                         </h2>
                         <small>{parseFloat(liveDistance) <= ALLOWED_RADIUS_METERS ? "✓ Within Range" : "⚠ Outside Range"}</small>
                    </div>
                </section>

                <section className="portal-card action-card">
                    <h3>Actions</h3>
                    <div className="button-group">
                        <button className="btn btn-in" onClick={() => handleAttendance("in")} disabled={loading || status !== "Not Checked In"}>
                            {loading ? "Processing..." : "Check In"}
                        </button>
                        <button className="btn btn-out" onClick={() => handleAttendance("out")} disabled={loading || status !== "Checked In"}>
                            {loading ? "Processing..." : "Check Out"}
                        </button>
                    </div>
                </section>

                <section className="portal-card history-card">
                    <h3>Recent Logs (Today)</h3>
                    <table className="history-table">
                        <thead>
                            <tr><th>Date</th><th>Check In</th><th>Check Out</th></tr>
                        </thead>
                        <tbody>
                            {history.length > 0 ? history.map(row => (
                                <tr key={row.attendanceId}>
                                    <td>{row.attendanceDate}</td>
                                    <td>{row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</td>
                                    <td>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="3">No records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </main>
        </div>
    );
};

export default AttendanceRecords;