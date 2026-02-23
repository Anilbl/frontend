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

/* ================= DASHBOARDS & SUBPAGES ================= */
// ACCOUNTANT
import AccountantDashboard from "./pages/Accountant/AccountantDashboard.jsx";
import AccountantPayroll from "./pages/Accountant/Payroll.jsx";
import Salary from "./pages/Accountant/Salary.jsx";
import Tax from "./pages/Accountant/Tax.jsx";
import AccountantReport from "./pages/Accountant/Report.jsx";

// ADMIN
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import Users from "./pages/Admin/users.jsx";
import AddUser from "./pages/Admin/AddUser.jsx";
import Employees from "./pages/Admin/Employees.jsx";
import AddEmployee from "./pages/Admin/AddEmployee.jsx";
import Attendance from "./pages/Admin/Attendance.jsx";
import Leave from "./pages/Admin/Leave.jsx";
import AdminPayroll from "./pages/Admin/Payroll.jsx";
import Report from "./pages/Admin/Report.jsx";
import SystemConfig from "./pages/Admin/SystemConfig/System-Config.jsx";

// SHARED PAYROLL PREVIEW
import PayrollPreview from "./pages/Admin/PayrollPreview.jsx"; 

// EMPLOYEE
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard.jsx";
import AttendanceRecords from "./pages/Employee/AttendanceRecords.jsx";
import LeaveManagement from "./pages/Employee/LeaveManagement.jsx";
import SalaryAnalytics from "./pages/Employee/SalaryAnalytics.jsx";
import Settings from "./pages/Employee/Settings.jsx";

/* ================= PROTECTED ROUTE COMPONENT ================= */
/**
 * Updated to support multiple allowed roles.
 * allowedRoles can now be a string "ROLE_ADMIN" or an array ["ROLE_ADMIN", "ROLE_ACCOUNTANT"]
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const savedUser = localStorage.getItem("user_session");
  const user = savedUser ? JSON.parse(savedUser) : null;

  if (!user || !user.token) return <Navigate to="/" replace />;

  const userRoleRaw = typeof user.role === 'object' ? user.role.roleName : user.role;

  if (!userRoleRaw) {
    console.error("Access Denied: No role found in session.");
    return <Navigate to="/" replace />;
  }

  const userRole = userRoleRaw.toUpperCase().trim();
  
  // Convert single string to array for uniform checking
  const rolesToCheck = Array.isArray(allowedRoles) 
    ? allowedRoles 
    : [allowedRoles];

  const hasAccess = rolesToCheck.some(requiredRole => {
    const cleanRequired = requiredRole.toUpperCase().trim();
    return (
      userRole === cleanRequired || 
      userRole === cleanRequired.replace("ROLE_", "") || 
      `ROLE_${userRole}` === cleanRequired
    );
  });

  if (!hasAccess) {
    console.error(`Access Denied: User[${userRole}] does not have any of the required roles:`, rolesToCheck);
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
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
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Landing setUser={setUser} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ACCOUNTANT MODULE */}
        <Route path="/accountant" element={<ProtectedRoute allowedRoles="ROLE_ACCOUNTANT" />}>
          <Route element={<AccountantLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AccountantDashboard />} />
            <Route path="payroll-processing" element={<AccountantPayroll />} />
            
            {/* Shared Preview within Accountant Context */}
            <Route path="payroll-processing/preview" element={<PayrollPreview />} /> 
            
            <Route path="salary-management" element={<Salary />} />
            <Route path="tax-compliance" element={<Tax />} />
            <Route path="financial-reports" element={<AccountantReport />} />
          </Route>
        </Route>

        {/* ADMIN MODULE */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles="ROLE_ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            {/* USER MANAGEMENT */}
            <Route path="users" element={<Users />} />
            <Route path="users/new" element={<AddUser />} />
            <Route path="users/edit/:id" element={<AddUser />} />

            {/* EMPLOYEE MANAGEMENT */}
            <Route path="employees">
              <Route index element={<Employees />} />
              <Route path="new" element={<AddEmployee />} />
              <Route path="edit/:id" element={<AddEmployee />} />
            </Route>

            {/* SYSTEM FEATURES */}
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            
            {/* PAYROLL MANAGEMENT + PREVIEW */}
            <Route path="payroll">
              <Route index element={<AdminPayroll />} />
              <Route path="preview" element={<PayrollPreview />} />
            </Route>

            <Route path="report" element={<Report />} />
            <Route path="system-config" element={<SystemConfig />} />
          </Route>
        </Route>

        {/* EMPLOYEE MODULE */}
        <Route path="/employee" element={<ProtectedRoute allowedRoles="ROLE_EMPLOYEE" />}>
          <Route element={<EmployeeLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="attendance" element={<AttendanceRecords />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="salary" element={<SalaryAnalytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;