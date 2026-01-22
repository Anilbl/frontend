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

// EMPLOYEE
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard.jsx";
import AttendanceRecords from "./pages/Employee/AttendanceRecords.jsx";
import LeaveManagement from "./pages/Employee/LeaveManagement.jsx";
import SalaryAnalytics from "./pages/Employee/SalaryAnalytics.jsx";
import Settings from "./pages/Employee/Settings.jsx";

/* ================= PROTECTED ROUTE ================= */
const ProtectedRoute = ({ allowedRole }) => {
  const savedUser = localStorage.getItem("user_session");
  const user = savedUser ? JSON.parse(savedUser) : null;

  // If no user is logged in, redirect to the landing/login page
  if (!user) return <Navigate to="/" replace />;

  // Safely extract the role name whether it's an object or a plain string
  const userRoleRaw = typeof user.role === 'object' ? user.role.roleName : user.role;

  if (!userRoleRaw) {
    console.error("No role found in user session");
    return <Navigate to="/" replace />;
  }

  const userRole = userRoleRaw.toUpperCase().trim();
  const requiredRole = allowedRole.toUpperCase().trim();

  // Debugging log to confirm exactly what strings are being compared
  console.log(`Checking Access: User has [${userRole}], needs [${requiredRole}]`);

  // Robust check for ROLE_ prefix differences (e.g., "ADMIN" vs "ROLE_ADMIN")
  const hasAccess = 
    userRole === requiredRole || 
    userRole === `ROLE_${requiredRole}` || 
    `ROLE_${userRole}` === requiredRole;

  if (!hasAccess) {
    console.error("Access Denied: Role mismatch. Redirecting to home.");
    return <Navigate to="/" replace />;
  }

  // Outlet allows nested routes (like employees/new) to render inside AdminLayout
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
        <Route path="/accountant" element={<ProtectedRoute allowedRole="ROLE_ACCOUNTANT" />}>
          <Route element={<AccountantLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AccountantDashboard />} />
            <Route path="payroll-processing" element={<AccountantPayroll />} />
            <Route path="salary-management" element={<Salary />} />
            <Route path="tax-compliance" element={<Tax />} />
            <Route path="financial-reports" element={<AccountantReport />} />
          </Route>
        </Route>

        {/* ADMIN MODULE */}
        <Route path="/admin" element={<ProtectedRoute allowedRole="ROLE_ADMIN" />}>
          <Route element={<AdminLayout />}>
            {/* Index redirect to dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />

            {/* --- USER MODULE --- */}
            <Route path="users" element={<Users />} />
            <Route path="users/new" element={<AddUser />} />
            <Route path="users/edit/:id" element={<AddUser />} />
{/* --- EMPLOYEE MODULE --- */}
<Route path="employees">
  {/* This matches /admin/employees exactly */}
  <Route index element={<Employees />} />

  {/* This matches /admin/employees/new */}
  <Route path="new" element={<AddEmployee />} />

  {/* This matches /admin/employees/edit/:id */}
  <Route path="edit/:id" element={<AddEmployee />} />
</Route>
            {/* --- OTHER ADMIN PAGES --- */}
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<Leave />} />
            <Route path="payroll" element={<AdminPayroll />} />
            <Route path="report" element={<Report />} />
            <Route path="system-config" element={<SystemConfig />} />
          </Route>
        </Route>

        {/* EMPLOYEE MODULE */}
        <Route path="/employee" element={<ProtectedRoute allowedRole="ROLE_EMPLOYEE" />}>
          <Route element={<EmployeeLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<EmployeeDashboard />} />
            <Route path="attendance" element={<AttendanceRecords />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="salary" element={<SalaryAnalytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Route>

        {/* CATCH-ALL FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;