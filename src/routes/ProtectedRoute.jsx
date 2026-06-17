// src/routes/ProtectedRoute.jsx

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useBusiness } from "../context/BusinessContext";

export default function ProtectedRoute({ children, role }) {
  const { user, userRole, userStatus, loading } = useAuth();
  const { business, loading: bizLoading } = useBusiness();
  const location = useLocation();

  const isResetPage = location.pathname.includes("/update-password");

  if (loading || (role === "provider" && bizLoading)) return <div>A carregar...</div>;

  if (isResetPage) return children;

  if (!user) {
    return role === "admin"
      ? <Navigate to="/admin/login" replace />
      : <Navigate to="/login" replace />;
  }

  if (role === "admin" && userRole === "admin" && userStatus !== "active") {
    return <Navigate to="/admin/login" replace />;
  }

  if (role === "provider" && userRole === "provider") {
    if (userStatus === "suspended") {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "100vh", gap: 16, padding: 24,
          background: "var(--color-page-bg)", textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--color-error-subtle)", color: "var(--color-error)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          }}>
            ⛔
          </div>
          <h2 style={{ color: "var(--color-text)", margin: 0 }}>Conta suspensa</h2>
          <p style={{ color: "var(--color-text-muted)", maxWidth: 400, margin: 0 }}>
            A tua conta foi suspensa pelo administrador. Contacta o suporte para mais informações.
          </p>
          <button
            style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid var(--color-border)",
              background: "var(--color-surface)", cursor: "pointer", fontSize: 14,
            }}
            onClick={async () => {
              const { supabase } = await import("../lib/supabase");
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
          >
            Sair
          </button>
        </div>
      );
    }

    // Negócio inativo (apagado/desativado no admin) — redireciona para login
    if (business && business.is_active === false) {
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: "100vh", gap: 16, padding: 24,
          background: "var(--color-page-bg)", textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--color-error-subtle)", color: "var(--color-error)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          }}>
            ⛔
          </div>
          <h2 style={{ color: "var(--color-text)", margin: 0 }}>Acesso desativado</h2>
          <p style={{ color: "var(--color-text-muted)", maxWidth: 400, margin: 0 }}>
            O teu negócio foi desativado. Contacta o suporte para mais informações.
          </p>
          <button
            style={{
              padding: "10px 20px", borderRadius: 8, border: "1px solid var(--color-border)",
              background: "var(--color-surface)", cursor: "pointer", fontSize: 14,
            }}
            onClick={async () => {
              const { supabase } = await import("../lib/supabase");
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
          >
            Sair
          </button>
        </div>
      );
    }
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
