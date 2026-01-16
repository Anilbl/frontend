import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./EmployeeDashboard.css";

const AttendanceRecords = () => {
  // 1. Extract dynamic user data from the session created in Landing.jsx
  const getSession = () => JSON.parse(localStorage.getItem("user_session") || "{}");
  
  const [employeeId, setEmployeeId] = useState(getSession().empId || getSession().id || 15);
  const [status, setStatus] = useState("Not Checked In");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [liveDistance, setLiveDistance] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const OFFICE_LAT = 28.6910; 
  const OFFICE_LON = 80.5419; 
  const ALLOWED_RADIUS_METERS = 50; 
  const AUTO_RESET_HOURS = 10; 
  const API_URL = "http://localhost:8080/api/attendance";

  // 2. Optimized Token Extraction
  const getAuthHeader = () => {
    const session = getSession();
    const token = session.jwt || session.token; 
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchAttendance = useCallback(async () => {
    try {
      const headers = getAuthHeader();
      const res = await axios.get(`${API_URL}/employee/${employeeId}`, { headers });
      
      const sorted = res.data.sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate));
      setHistory(sorted.slice(0, 5));
      
      const today = new Date().toLocaleDateString('en-CA');
      const todayRec = sorted.find(r => r.attendanceDate === today);
      
      if (todayRec) {
        if (todayRec.checkOutTime) {
          setStatus("Checked Out");
        } else {
          // 🔥 10-HOUR AUTO-RESET LOGIC
          const checkInDate = new Date(todayRec.checkInTime);
          const currentTime = new Date();
          const diffInHours = (currentTime - checkInDate) / (1000 * 60 * 60);

          if (diffInHours >= AUTO_RESET_HOURS) {
            setStatus("Not Checked In"); // Allow new check-in for next shift
          } else {
            setStatus("Checked In");
          }
        }
      } else {
        setStatus("Not Checked In");
      }
    } catch (err) {
      console.error("Fetch Error:", err.response?.status === 403 ? "Forbidden: Check Backend Roles" : err.message);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchAttendance();
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const dist = getDistance(pos.coords.latitude, pos.coords.longitude, OFFICE_LAT, OFFICE_LON);
      setLiveDistance(dist.toFixed(1));
    }, (err) => console.error("GPS Error", err), { enableHighAccuracy: true });
    
    return () => navigator.geolocation.clearWatch(watchId);
  }, [fetchAttendance]);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleAttendance = async (type) => {
    if (liveDistance > ALLOWED_RADIUS_METERS) {
      return alert(`Access Denied: You are ${liveDistance}m away. Must be within 50m.`);
    }

    setLoading(true);
    const now = new Date().toISOString();
    const todayDate = new Date().toLocaleDateString('en-CA');

    try {
      const headers = getAuthHeader();
      if (type === "in") {
        await axios.post(API_URL, {
          employee: { empId: employeeId },
          attendanceDate: todayDate,
          checkInTime: now,
          status: "PRESENT"
        }, { headers });
      } else {
        const todayRec = history.find(r => r.attendanceDate === todayDate);
        if (!todayRec) throw new Error("No today record found.");

        await axios.put(`${API_URL}/${todayRec.attendanceId}`, { 
          ...todayRec, 
          checkOutTime: now 
        }, { headers });
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchAttendance();
    } catch (err) {
      const msg = err.response?.status === 403 
        ? "Access Denied: Your account doesn't have permission to log attendance."
        : "Session Error: Please re-login.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-portal">
      <header className="portal-header">
        <div className="title-section">
          <h1>Attendance Portal</h1>
          {showSuccess && <div className="toast">Success! Attendance Logged.</div>}
        </div>
        <div className="id-badge">
          <span>Employee ID:</span>
          <input 
            type="number" 
            value={employeeId} 
            onChange={(e) => setEmployeeId(e.target.value)} 
            disabled // ID should be locked to logged-in user
          />
        </div>
      </header>

      <main className="portal-grid">
        <section className="portal-card status-card">
          <h3>Current Status</h3>
          <div className={`status-pill ${status.replace(/\s+/g, '-').toLowerCase()}`}>
            {status}
          </div>
          <hr />
          <div className="geofence-box">
            <p>GPS Proximity</p>
            <h2 className={liveDistance <= ALLOWED_RADIUS_METERS ? "safe" : "danger"}>
              {liveDistance ? `${liveDistance}m` : "Locating..."}
            </h2>
            <small>{liveDistance <= ALLOWED_RADIUS_METERS ? "✓ Within Range" : "⚠ Outside Office Perimeter"}</small>
          </div>
        </section>

        <section className="portal-card action-card">
          <button 
            className="btn btn-in" 
            onClick={() => handleAttendance("in")} 
            disabled={loading || status !== "Not Checked In"}
          >
            {loading ? "Processing..." : "Check In"}
          </button>
          
          <button 
            className="btn btn-out" 
            onClick={() => handleAttendance("out")} 
            disabled={loading || status !== "Checked In"}
          >
            {loading ? "Processing..." : "Check Out"}
          </button>
        </section>

        <section className="portal-card history-card">
          <h3>Today's Details & Recent History</h3>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map(row => (
                <tr key={row.attendanceId}>
                  <td>{row.attendanceDate}</td>
                  <td>{row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}</td>
                  <td>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}</td>
                </tr>
              )) : (
                <tr><td colSpan="3">No history found.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default AttendanceRecords;