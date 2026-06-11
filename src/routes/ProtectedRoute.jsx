import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, userRole, loading } = useAuth();
  const location = useLocation(); // Obtém a rota atua

  // Verifica se é a página de reset de password
  const isResetPage = location.pathname.includes("/update-password");

  if (loading) return <div>A carregar...</div>;

  // Se for a página de reset, permite o acesso independentemente da autenticação
  if (isResetPage) {
    return children;
  }

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
