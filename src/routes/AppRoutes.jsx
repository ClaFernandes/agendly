import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import AdminLogin from "../pages/auth/AdminLogin";
import UpdatePassword from "../pages/auth/UpdatePassword";

import Onboarding from "../pages/onboarding/Onboarding";

import DashboardLayout from "../components/layout/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Appointments from "../pages/dashboard/Appointments";
import Services from "../pages/dashboard/Services";
import Schedule from "../pages/dashboard/Schedule";
import Clients from "../pages/dashboard/Clients";
import Financial from "../pages/dashboard/Financial";
import Settings from "../pages/dashboard/Settings";

import AdminLayout from "../components/layout/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminBusiness from "../pages/admin/AdminBusiness";
import AdminUsers from "../pages/admin/AdminUsers";

import { BookingProvider } from "../context/BookingContext";
import BookingLayout from "../components/layout/BookingLayout";
import ServicePage from "../pages/public-booking/ServicePage";
import DatePage from "../pages/public-booking/DatePage";
import TimePage from "../pages/public-booking/TimePage";
import FormPage from "../pages/public-booking/FormPage";
import SummaryPage from "../pages/public-booking/SummaryPage";
import BookingConfirm from "../pages/public-booking/BookingConfirm";

import NotFound from "../pages/NotFound";

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="admin/login" element={<AdminLogin />} />
      <Route path="update-password" element={<UpdatePassword />} />

      <Route
        path="onboarding"
        element={
          <ProtectedRoute role="provider">
            <Onboarding />
          </ProtectedRoute>
        }
      />
      {/* Área do Prestador */}
      <Route
        path="dashboard"
        element={
          <ProtectedRoute role="provider">
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="appointments" element={<Appointments />} />
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
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="businesses" element={<AdminBusiness />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
      {/* Área do Cliente */}
      <Route
        path="p/:slug"
        element={
          <BookingProvider>
            <BookingLayout />
          </BookingProvider>
        }
      >
        <Route index element={<ServicePage />} />
        <Route path="date" element={<DatePage />} />
        <Route path="time" element={<TimePage />} />
        <Route path="form" element={<FormPage />} />
        <Route path="summary" element={<SummaryPage />} />
        <Route path="confirm" element={<BookingConfirm />} />
      </Route>
      {/* Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default AppRoutes;
