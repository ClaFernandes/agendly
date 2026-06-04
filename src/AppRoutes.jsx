import { Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Onboarding from "./pages/onboarding/Onboarding";
import ServicePage from "./pages/public-booking/ServicePage";

import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Services from "./pages/dashboard/Services";
import Schedule from "./pages/dashboard/Schedule";
import Clients from "./pages/dashboard/Clients";
import Financial from "./pages/dashboard/Financial";
import Settings from "./pages/dashboard/Settings";

import AdminLayout from "./components/layout/AdminLayout";
import AdminRoute from "./pages/admin/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBusinesses from "./pages/admin/AdminBusinesses";
import AdminUsers from "./pages/admin/AdminUsers";

import BookingLayout from "./components/layout/BookingLayout";
import DatePage from "./pages/public-booking/DatePage";
import TimePage from "./pages/public-booking/TimePage";
import FormPage from "./pages/public-booking/FormPage";
import SummaryPage from "./pages/public-booking/SummaryPage";
import BookingConfirm from "./pages/public-booking/BookingConfirm";

import NotFound from ".pages/NotFound";

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="onboarding" element={<Onboarding />} />
      <Route path="p/:slug" element={<ServicePage />} />

      {/* Área do Prestador */}
      <Route path="dashboard" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="services" element={<Services />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="clients" element={<Clients />} />
        <Route path="financial" element={<Financial />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Área do Admin */}
      <Route
        path="admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="businesses" element={<AdminBusinesses />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* Área do Cliente */}
      <Route path="p/:slug" element={<BookingLayout />}>
        <Route index element={<ServicePage />} />
        <Route path="date" element={<DatePage />} />
        <Route path="time" element={<TimePage />} />
        <Route path="form" element={<FormPage />} />
        <Route path="summary" element={<SummaryPage />} />
        <Route path="confirmation" element={<BookingConfirm />} />
      </Route>

      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
