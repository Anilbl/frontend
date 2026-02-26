import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import "./SalaryAnalytics.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const SalaryAnalytics = () => {
  const [salaryData, setSalaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - 3 + i);

  useEffect(() => {
    if (!selectedMonth) return;
    const fetchSalary = async () => {
      try {
        setLoading(true);
        setError(null);
        const sessionData = localStorage.getItem("user_session");
        if (!sessionData) { window.location.href = "/login"; return; }
        const parsed = JSON.parse(sessionData);

        const monthIndex = months.indexOf(selectedMonth) + 1;
        const formattedMonth = `${selectedYear}-${monthIndex.toString().padStart(2, "0")}`;

        const response = await api.get("/salary-analytics/me", {
          params: { month: formattedMonth },
          headers: { Authorization: `Bearer ${parsed?.token}` },
        });

        if (!response.data || Object.keys(response.data).length === 0) {
          setError("No payroll record found for this month.");
          setSalaryData(null);
          return;
        }

        const raw = response.data;
        setSalaryData({
          employeeName: raw.employeeName,
          designation: raw.designation,
          employmentStatus: raw.employmentStatus,
          bankName: raw.bankName,
          bankAccount: raw.bankAccount,
          baseSalary: Number(raw.baseSalary || 0),
          grossSalary: Number(raw.grossSalary || 0),
          taxableAmount: Number(raw.taxableAmount || 0),
          totalAllowances: Number(raw.totalAllowances || 0),
          totalDeductions: Number(raw.totalDeductions || 0),
          netSalary: Number(raw.netSalary || 0),
        });
      } catch (err) {
        setError("Failed to load salary data.");
        setSalaryData(null);
      } finally { setLoading(false); }
    };
    fetchSalary();
  }, [selectedMonth, selectedYear]);

  const handleDownloadPDF = () => {
    if (!salaryData) return;
    try {
      const doc = new jsPDF();
      const primaryColor = [0, 68, 170];
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...primaryColor);
      doc.text("NAST COLLEGE", 20, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("Dhangadhi, Nepal | contact@nast.edu.np", 20, 32);
      doc.text(`Pay Period: ${selectedMonth} ${selectedYear}`, 20, 37);

      doc.setDrawColor(...primaryColor);
      doc.line(20, 45, pageWidth - 20, 45);

      doc.setFontSize(16);
      doc.setTextColor(0);
      doc.text("SALARY SLIP", pageWidth / 2, 55, { align: "center" });

      doc.setFontSize(10);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 60, 65);

      doc.setFont("helvetica", "bold");
      doc.text("Employee Name:", 25, 85);
      doc.text("Designation:", 25, 92);
      doc.text("Employment Status:", 25, 99);
      doc.text("Bank Name:", pageWidth / 2, 92);
      doc.text("Bank Account:", pageWidth / 2, 99);

      doc.setFont("helvetica", "normal");
      doc.text(salaryData.employeeName || "-", 70, 85);
      doc.text(salaryData.designation || "-", 70, 92);
      doc.text(salaryData.employmentStatus || "-", 70, 99);
      doc.text(salaryData.bankName || "-", pageWidth / 2 + 45, 92);
      doc.text(salaryData.bankAccount || "-", pageWidth / 2 + 45, 99);

      autoTable(doc, {
        startY: 120,
        head: [["EARNINGS", "Amount (Rs.)", "DEDUCTIONS", "Amount (Rs.)"]],
        body: [
          ["Basic Salary", salaryData.baseSalary.toLocaleString(), "Taxable Amount", salaryData.taxableAmount.toLocaleString()],
          ["Allowances", salaryData.totalAllowances.toLocaleString(), "Total Deductions", salaryData.totalDeductions.toLocaleString()],
          ["Gross Salary", salaryData.grossSalary.toLocaleString(), "", ""],
        ],
        theme: "grid",
        headStyles: { fillColor: primaryColor, textColor: 255 },
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      doc.setFont("helvetica", "bold");
      doc.text(`Gross Earnings: Rs. ${salaryData.grossSalary.toLocaleString()}`, 20, finalY);

      doc.setFillColor(220, 235, 255);
      doc.roundedRect(20, finalY + 10, pageWidth - 40, 20, 3, 3, "F");

      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text(
        `TOTAL NET DISBURSEMENT: NPR ${salaryData.netSalary.toLocaleString()}`,
        pageWidth / 2,
        finalY + 23,
        { align: "center" }
      );

      doc.save(`Payslip_${salaryData.employeeName}_${selectedMonth}_${selectedYear}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  return (
    <div className="dashboard-content-wrapper fade-in">
      <header className="analytics-header">
        <div className="header-text">
          <h1>Salary Analytics</h1>
          {salaryData && (
            <p className="employee-name-tag">👤 {salaryData.employeeName}</p>
          )}
          <p>Overview for {selectedMonth || "..."} {selectedYear}</p>
        </div>

        <div className="header-actions">
          <button className="download-btn" onClick={handleDownloadPDF} disabled={!salaryData}>
            Download PDF
          </button>

          {/* Year Selector */}
          <div className="year-selector">
            {yearOptions.map((year) => (
              <button
                key={year}
                className={`year-btn${selectedYear === year ? " active" : ""}`}
                onClick={() => {
                  setSelectedYear(year);
                  setSalaryData(null);
                  setError(null);
                }}
              >
                {year}
              </button>
            ))}
          </div>

          {/* Month Selector */}
          <select className="month-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="">Select Month</option>
            {months.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
        </div>
      </header>

      {/* Loading */}
      {loading && (
        <div className="empty-state-card">
          <div className="empty-icon">⏳</div>
          <h3>Loading...</h3>
          <p>Fetching salary data for {selectedMonth} {selectedYear}</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="empty-state-card">
          <div className="empty-icon">⚠️</div>
          <h3>No Data Found</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Data */}
      {salaryData && !loading && (
        <>
          <div className="stats-row">
            <StatCard label="Net Disbursement" value={`Rs. ${salaryData.netSalary.toLocaleString()}`} icon="💰" color="#4f46e5" />
            <StatCard label="Total Allowances" value={`Rs. ${salaryData.totalAllowances.toLocaleString()}`} icon="🎁" color="#059669" />
            <StatCard label="Total Deductions" value={`Rs. ${salaryData.totalDeductions.toLocaleString()}`} icon="📉" color="#ef4444" />
          </div>

          <div className="details-grid">
            <div className="glass-card breakdown-card">
              <h3>Financial Breakdown</h3>
              <div className="data-row"><span>Base Salary</span><span className="mono">Rs. {salaryData.baseSalary.toLocaleString()}</span></div>
              <div className="data-row success"><span>Allowances</span><span className="mono">+ Rs. {salaryData.totalAllowances.toLocaleString()}</span></div>
              <div className="data-row danger"><span>Tax (TDS)</span><span className="mono">- Rs. {salaryData.taxableAmount.toLocaleString()}</span></div>
              <div className="data-row danger"><span>Other Deductions</span><span className="mono">- Rs. {salaryData.totalDeductions.toLocaleString()}</span></div>
              <div className="data-row highlight"><span>Net Salary</span><span className="primary mono">Rs. {salaryData.netSalary.toLocaleString()}</span></div>
            </div>

            <div className="glass-card info-card">
              <h3>Payment Information</h3>
              <div className="info-item"><label>Account Holder</label><p>{salaryData.employeeName}</p></div>
              <div className="info-item"><label>Designation</label><p>{salaryData.designation}</p></div>
              <div className="info-item"><label>Bank Details</label><p className="mono">{salaryData.bankName} - {salaryData.bankAccount}</p></div>
              <div className="info-item"><label>Status</label><span className="badge-success">{salaryData.employmentStatus}</span></div>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!salaryData && !loading && !error && (
        <div className="empty-state-card">
          <div className="empty-icon">📂</div>
          <h3>No Month Selected</h3>
          <p>Select a year and month above to view your detailed analytics.</p>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div className="status-kpi-card">
    <div className="kpi-icon-container" style={{ color, backgroundColor: `${color}15` }}>{icon}</div>
    <div className="kpi-data">
      <span className="kpi-label">{label}</span>
      <h2 className="kpi-value">{value}</h2>
    </div>
  </div>
);

export default SalaryAnalytics;