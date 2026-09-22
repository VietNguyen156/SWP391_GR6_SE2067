import { Routes, Route, Navigate } from "react-router-dom";
import RequireRole from "../components/common/RequireRole";
import MentorLayout from "../layouts/MentorLayout";
import MentorPackagesPage from "../pages/mentor/PackagesPage";
import MentorClassesPage from "../pages/mentor/ClassesPage";
import CatalogPage from "../pages/user/PackagesPage";
import PaymentsPage from "../pages/admin/PaymentsPage";
import AdminLayout from "../layouts/AdminLayout";
import UserLayout from "../layouts/UserLayout";
import AuthLayout from "../layouts/AuthLayout";
import HomePage from "../pages/user/HomePage";
import NotFound from "../pages/NotFound";
import DashboardPage from "../pages/admin/DashboardPage";
import PackagesPage from "../pages/admin/PackagesPage";
import ClassesPage from "../pages/admin/ClassesPage";
import EnrollmentsPage from "../pages/admin/EnrollmentsPage";
import ProfilePage from "../pages/user/ProfilePage";
import MyClassesPage from "../pages/user/MyClassesPage";
import PaymentPage from "../pages/user/PaymentPage";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
export default function AppRoutes() {
  return <Routes>
    <Route element={<UserLayout />}>
      <Route index element={<HomePage />} />
      <Route path="packages" element={<CatalogPage />} />
      <Route path="user/profile" element={<ProfilePage />} />
      <Route element={<RequireRole role="STUDENT" />}>
        <Route path="user/classes" element={<MyClassesPage />} />
        <Route path="user/payment" element={<PaymentPage />} />
      </Route>
      <Route element={<RequireRole role="TEACHER" />}>
        <Route path="mentor" element={<MentorLayout />}>
          <Route index element={<Navigate to="packages" replace />} />
          <Route path="packages" element={<MentorPackagesPage />} />
          <Route path="classes" element={<MentorClassesPage />} />
        </Route>
      </Route>
    </Route>
    <Route element={<RequireRole role="ADMIN" />}>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="classes" element={<ClassesPage />} />
        <Route path="enrollments" element={<EnrollmentsPage />} />
        <Route path="payments" element={<PaymentsPage />} />
      </Route>
    </Route>
    <Route element={<AuthLayout />}>
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>;
}
