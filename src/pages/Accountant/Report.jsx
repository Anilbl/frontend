import React, { useState, useEffect } from 'react';
import api from "../../api/axios"; 
import './Report.css';

const Report = () => {
  const [recentReports, setRecentReports] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const reportCategories = [
    { title: "Salary Summaries", desc: "Monthly expenditure and net pay distribution", icon: "💰" },
    { title: "Tax & SSF Reports", desc: "Government compliance and deduction records", icon: "🏛️" },
    { title: "Attendance Logs", desc: "Verification of presence for payroll accuracy", icon: "🕒" },
    { title: "Employee History", desc: "Individual payroll and increment archives", icon: "👤" }
  ];

  useEffect(() => { fetchHistory(); }, []);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/reports/history');
      setRecentReports(res.data);
    } catch (err) {
      console.error("Failed to load history:", err);
    }
  };

  const handleGenerate = async (category) => {
    setIsGenerating(true);
    try {
      await api.post(`/reports/generate?category=${encodeURIComponent(category)}`);
      fetchHistory(); 
      alert(`Success: ${category} generated in User/Payroll_Reports folder.`);
    } catch (err) {
      alert("Generation failed. Check if your Backend console shows path errors.");
    } finally { setIsGenerating(false); }
  };

  const handleDownload = async (reportId, fileName) => {
    try {
      // Logic: request binary data
      const response = await api.get(`/reports/download/${reportId}`, { 
        responseType: 'blob' 
      });

      // VALIDATE: Check if we actually received data
      if (response.data.size === 0) {
        alert("The file on the server is empty. Please generate a new one.");
        return;
      }

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || `Report.pdf`); 
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) { 
      // Triggered if Backend returns 404 (file missing on disk)
      alert("Download failed. The physical file is missing on the server's drive."); 
    }
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <h1>Financial Reports</h1>
        <p>Analyze and export organizational payroll data</p>
      </div>

      <div className="report-types-grid">
        {reportCategories.map((cat, i) => (
          <div key={i} className="report-type-card">
            <div className="report-icon-box">{cat.icon}</div>
            <div className="report-details">
              <h4>{cat.title}</h4>
              <p>{cat.desc}</p>
              <button className="generate-btn" onClick={() => handleGenerate(cat.title)} disabled={isGenerating}>
                {isGenerating ? "Processing..." : "Generate Report"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <h3 className="section-subtitle">Recently Generated</h3>
      <div className="recent-reports-wrapper">
        <table className="report-table">
          <thead>
            <tr>
              <th>FILE NAME & SIZE</th>
              <th>CATEGORY</th>
              <th>GENERATED AT</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {recentReports.length > 0 ? (
              recentReports.map((file, index) => (
                <tr key={index}>
                  <td className="file-name-cell">
                    📄 {file.fileName} <span className="file-size-badge">{file.fileSize}</span>
                  </td>
                  <td><span className="type-badge">{file.category}</span></td>
                  <td className="time-stamp">{new Date(file.dateGenerated).toLocaleString()}</td>
                  <td>
                    <button className="download-btn-ui" onClick={() => handleDownload(file.reportId, file.fileName)}>
                      Download
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="no-data">No history found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Report;