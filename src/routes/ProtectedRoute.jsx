// src/routes/ProtectedRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, userRole, userStatus, loading } = useAuth();
  const location = useLocation();

  const isResetPage = location.pathname.includes("/update-password");

  if (loading) return <div>A carregar...</div>;

  if (isResetPage) return children;

  if (!user) {
    return role === "admin"
      ? <Navigate to="/admin/login" replace />
      : <Navigate to="/login" replace />;
  }

  if (role === "admin" && userRole === "admin" && userStatus !== "active") {
    return <Navigate to="/admin/login" replace />;
  }

  if (role && userRole !== role) {
    if (userRole === "provider") return <Navigate to="/dashboard" replace />;
    if (userRole === "admin") {
      return userStatus !== "active"
        ? <Navigate to="/admin/login" replace />
        : <Navigate to="/admin" replace />;
    }
  }

  return children;
}
