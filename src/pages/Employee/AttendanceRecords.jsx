import React, { useState, useEffect } from "react";
import axios from "axios";
import "./EmployeeDashboard.css";

const AttendanceRecords = () => {
  const [employeeId, setEmployeeId] = useState(15);
  const [status, setStatus] = useState("Not Checked In");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [liveDistance, setLiveDistance] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const [officeLocation, setOfficeLocation] = useState(null);
  const ALLOWED_RADIUS_METERS = 10;
  const API_URL = "http://localhost:8080/api/attendance";

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setOfficeLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    });
    fetchAttendance();
  }, [employeeId]);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_URL}/employee/${employeeId}`);
      const sorted = res.data.sort((a, b) => new Date(b.attendanceDate) - new Date(a.attendanceDate));
      setHistory(sorted.slice(0, 5)); // Only show top 5 to fit screen
      
      const today = new Date().toLocaleDateString('en-CA');
      const todayRec = sorted.find(r => r.attendanceDate === today);
      if (todayRec) {
        setStatus(todayRec.checkOutTime ? "Checked Out" : "Checked In");
      } else {
        setStatus("Not Checked In");
      }
    } catch (err) { console.error("Update failed"); }
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleAttendance = async (type) => {
    if (!officeLocation) return alert("Waiting for GPS...");
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const distance = getDistance(latitude, longitude, officeLocation.lat, officeLocation.lon);
      setLiveDistance(distance.toFixed(2));

      if (distance > ALLOWED_RADIUS_METERS) {
        alert(`Access Denied! You are ${distance.toFixed(2)}m away.`);
        setLoading(false);
        return;
      }

      const now = new Date();
      const isoNow = now.toISOString().split('.')[0];
      const todayDate = now.toLocaleDateString('en-CA');

      try {
        if (type === "in") {
          await axios.post(API_URL, {
            employee: { empId: employeeId },
            attendanceDate: todayDate,
            checkInTime: isoNow,
            inGpsLat: latitude,
            inGpsLong: longitude
          });
        } else {
          const todayRec = history.find(r => r.attendanceDate === todayDate);
          await axios.put(`${API_URL}/${todayRec.attendanceId}`, { ...todayRec, checkOutTime: isoNow });
        }
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        await fetchAttendance();
      } catch (err) {
        alert("Error: Backend issue");
      } finally { setLoading(false); }
    }, () => setLoading(false), { enableHighAccuracy: true });
  };

  return (
    <div className="single-page-wrapper">
      <header className="compact-header">
        <div className="title-area">
          <h1>Attendance Portal</h1>
          {showSuccess && <span className="success-toast">✅ Recorded!</span>}
        </div>
        <div className="header-input">
          <label>ID:</label>
          <input type="number" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
        </div>
      </header>

      <main className="dashboard-grid">
        {/* Left Side: Status & Proximity */}
        <section className="status-zone">
          <div className={`status-card ${status.replace(/\s/g, '-')}`}>
            <span className="label">Current Status</span>
            <span className="value">{status}</span>
          </div>
          <div className="distance-card">
            <span className="label">GPS Proximity</span>
            <span className="value">{liveDistance ? `${liveDistance}m` : "Checking..."}</span>
            <div className="radar-ping"></div>
          </div>
        </section>

        {/* Center: Large Color Buttons */}
        <section className="action-zone">
          <button 
            className="action-btn check-in" 
            onClick={() => handleAttendance("in")} 
            disabled={loading || status !== "Not Checked In"}
          >
            <span className="icon">📥</span>
            <span className="btn-text">Check In</span>
          </button>
          
          <button 
            className="action-btn check-out" 
            onClick={() => handleAttendance("out")} 
            disabled={loading || status !== "Checked In"}
          >
            <span className="icon">📤</span>
            <span className="btn-text">Check Out</span>
          </button>
        </section>

        {/* Right Side: Mini Table */}
        <section className="history-zone">
          <h3>Recent Logs</h3>
          <div className="mini-table-wrapper">
            <table className="compact-table">
              <thead>
                <tr><th>Date</th><th>In</th><th>Out</th></tr>
              </thead>
              <tbody>
                {history.map(row => (
                  <tr key={row.attendanceId}>
                    <td>{row.attendanceDate.split('-').slice(1).join('/')}</td>
                    <td>{row.checkInTime ? new Date(row.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}</td>
                    <td>{row.checkOutTime ? new Date(row.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AttendanceRecords;