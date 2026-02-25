import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";

/* ================= LAYOUTS ================= */
import EmployeeLayout from "./components/EmployeeLayout";
import AdminLayout from "./components/AdminLayout";
import AccountantLayout from "./components/AccountantLayout";

/* ================= AUTH & PAGES ================= */
import Landing from "./pages/Login/Landing.jsx";
import ForgotPassword from "./pages/Common/ForgotPassword.jsx";
import ResetPassword from "./pages/Common/ResetPassword.jsx";
import InitialSetup from "./pages/Common/InitialSetup.jsx";

/* ================= DASHBOARDS & SUBPAGES ================= */
import AccountantDashboard from "./pages/Accountant/AccountantDashboard.jsx";
import AdminPayroll from "./pages/Admin/Payroll.jsx"; 
import Salary from "./pages/Accountant/Salary.jsx";
import Tax from "./pages/Accountant/Tax.jsx";
import AccountantReport from "./pages/Accountant/Report.jsx";

import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import Users from "./pages/Admin/users.jsx";
import AddUser from "./pages/Admin/AddUser.jsx";
import Employees from "./pages/Admin/Employees.jsx";
import AddEmployee from "./pages/Admin/AddEmployee.jsx";
import Attendance from "./pages/Admin/Attendance.jsx";
import Leave from "./pages/Admin/Leave.jsx";
import Report from "./pages/Admin/Report.jsx";
import SystemConfig from "./pages/Admin/SystemConfig/System-Config.jsx";
import HolidaySettings from "./pages/Admin/Organization/HolidaySettings.jsx";

import PayrollAdjustment from "./pages/Admin/PayrollAdjustment.jsx"; 
import PayrollPreview from "./pages/Admin/PayrollPreview.jsx"; 

import EmployeeDashboard from "./pages/Employee/EmployeeDashboard.jsx";
import AttendanceRecords from "./pages/Employee/AttendanceRecords.jsx";
import LeaveManagement from "./pages/Employee/LeaveManagement.jsx";
import SalaryAnalytics from "./pages/Employee/SalaryAnalytics.jsx";
import Settings from "./pages/Employee/Settings.jsx";

/* ================= UPDATED PROTECTED ROUTE ================= */
// This logic now checks BOTH the role string AND the specific boolean flags
const ProtectedRoute = ({ requiredFlag }) => {
  const savedUser = localStorage.getItem("user_session");
  const user = savedUser ? JSON.parse(savedUser) : null;

  // 1. If no session, go to login
  if (!user || !user.token) return <Navigate to="/" replace />;

  // 2. Logic for "No Re-Login" Portal Switching
  // We check the boolean flags we added to the DTO: isAdmin, isAccountant, hasEmployeeRole
  const hasAccess = user[requiredFlag] === true;

  // 3. Fallback: If flags are missing for some reason, check the string role
  const userRole = (typeof user.role === 'object' ? user.role.roleName : user.role || "").toUpperCase();
  const isAdminString = userRole.includes("ADMIN");

  // Admins are "Super Users" - they can access everything
  if (hasAccess || isAdminString) {
    return <Outlet />;
  }

  // 4. If no access, kick back to login (or their specific dashboard)
  return <Navigate to="/" replace />;
};

/* ================= MAIN APP COMPONENT ================= */
function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user_session");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  return (
    <Router>
      <Routes>
        {/* PUBLIC & AUTH ROUTES */}
        <Route path="/" element={<Landing setUser={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/setup-account" element={<InitialSetup />} />

        {/* ACCOUNTANT MODULE - Checks for 'isAccountant' flag */}
        <Route path="/accountant" element={<ProtectedRoute requiredFlag="isAccountant" />}>
          <Route element={<AccountantLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AccountantDashboard />} />
            
            <Route path="payroll-processing">
                <Route index element={<AdminPayroll />} />
                <Route path="adjust" element={<PayrollAdjustment />} />
                <Route path="preview" element={<PayrollPreview />} />
            </Route>

            <Route path="salary-management" element={<Salary />} />
            <Route path="tax-compliance" element={<Tax />} />
            <Route path="financial-reports" element={<AccountantReport />} />
          </Route>
        </Route>

        {/* ADMIN MODULE - Checks for 'isAdmin' flag */}
        <Route path="/admin" element={<ProtectedRoute requiredFlag="isAdmin" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="users/new" element={<AddUser />} />
            <Route path="users/edit/:id" element={<AddUser />} />
            <Route path="employees">
              <Route index element={<Employees />} />
              <Route path="new" element={<AddEmployee />} />
              <Route path="edit/:id" element={<AddEmployee />} />
            </Route>
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="holidays" element={<HolidaySettings />} />
            
            <Route path="payroll">
              <Route index element={<AdminPayroll />} />
              <Route path="adjust" element={<PayrollAdjustment />} />
              <Route path="preview" element={<PayrollPreview />} />
            </Route>

            <Route path="report" element={<Report />} />
            <Route path="system-config" element={<SystemConfig />} />
          </Route>
        </Route>

        {/* EMPLOYEE MODULE - Checks for 'hasEmployeeRole' flag */}
        <Route path="/employee" element={<ProtectedRoute requiredFlag="hasEmployeeRole" />}>
          <Route element={<EmployeeLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="attendance" element={<AttendanceRecords />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="salary" element={<SalaryAnalytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;