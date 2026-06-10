import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, userRole, loading } = useAuth();

  if (loading) return <div>A carregar...</div>;

  if (!user) {
    // Se a rota era do painel admin, vai para o login do admin
    if (role === "admin") {
      return <Navigate to="/admin/login" replace />;
    }
    // Caso contrário, manda para o login geral de prestador
    return <Navigate to="/login" replace />;
  }

  // Se está autenticado mas não tem o role, manda para o login
  if (role && userRole !== role) {
    if (userRole === "provider") {
      return <Navigate to="/dashboard" replace />;
    }

    if (userRole === "admin") {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
}
