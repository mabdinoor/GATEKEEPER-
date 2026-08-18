import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import Layout from "./components/Layout";
import LoginPage            from "./pages/LoginPage";
import CheckInPage          from "./pages/CheckInPage";
import LogPage              from "./pages/LogPage";
import DashboardPage        from "./pages/DashboardPage";
import BlacklistPage        from "./pages/BlacklistPage";
import PreregPage           from "./pages/PreregPage";
import AnalyticsPage        from "./pages/AnalyticsPage";
import CompanyAuthPage      from "./pages/CompanyAuthPage";
import CompanyRegisterPage  from "./pages/CompanyRegisterPage";
import CompanyDashboardPage from "./pages/CompanyDashboardPage";
import VerifyEmailPage      from "./pages/VerifyEmailPage";
import ResetPasswordPage    from "./pages/ResetPasswordPage";
import TermsPage            from "./pages/TermsPage";
import PrivacyPage          from "./pages/PrivacyPage";
import PricingPage          from "./pages/PricingPage";
import AdminLoginPage        from "./pages/AdminLoginPage";
import AdminDashboardPage    from "./pages/AdminDashboardPage";
import AdminCompanyDetailPage from "./pages/AdminCompanyDetailPage";

function OfficerRoute({ children }) {
  const { officer, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!officer) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function CompanyRoute({ children }) {
  const { company, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!company) return <Navigate to="/company" replace />;
  return children;
}

function CompanyRegisterRoute() {
  const { company, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!company) return <Navigate to="/company" replace />;
  if (company.is_registered) return <Navigate to="/company/dashboard" replace />;
  return <CompanyRegisterPage />;
}

function AdminRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!admin) return <Navigate to="/admin" replace />;
  return children;
}

function Spinner() {
  return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#aaa" }}>Loading…</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/company/verify"         element={<VerifyEmailPage />} />
          <Route path="/company/reset-password" element={<ResetPasswordPage />} />
          <Route path="/company"                element={<CompanyAuthPage />} />
          <Route path="/company/register"       element={<CompanyRegisterRoute />} />
          <Route path="/login"                  element={<LoginPage />} />
          <Route path="/terms"                  element={<TermsPage />} />
          <Route path="/privacy"                element={<PrivacyPage />} />
          <Route path="/pricing"                element={<PricingPage />} />
          <Route path="/admin"                  element={<AdminLoginPage />} />

          {/* Admin (platform operator, separate from company/officer auth) */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
          <Route path="/admin/companies/:id" element={<AdminRoute><AdminCompanyDetailPage /></AdminRoute>} />

          {/* Company admin */}
          <Route path="/company/dashboard" element={<CompanyRoute><CompanyDashboardPage /></CompanyRoute>} />
          <Route path="/analytics"         element={<CompanyRoute><AnalyticsPage /></CompanyRoute>} />

          {/* Officer */}
          <Route path="/dashboard" element={<OfficerRoute><DashboardPage /></OfficerRoute>} />
          <Route path="/checkin"   element={<OfficerRoute><CheckInPage /></OfficerRoute>} />
          <Route path="/log"       element={<OfficerRoute><LogPage /></OfficerRoute>} />
          <Route path="/prereg"    element={<OfficerRoute><PreregPage /></OfficerRoute>} />
          <Route path="/blacklist" element={<OfficerRoute><BlacklistPage /></OfficerRoute>} />

          <Route path="*" element={<Navigate to="/company" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
