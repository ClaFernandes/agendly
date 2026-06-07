import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, userRole, loading } = useAuth();

  if (loading) return <div>A carregar...</div>;

  // Se não está autenticado, manda para o login
  if (!user) return <Navigate to="/login" replace />;

  // Se está autenticado mas não tem o role, manda para o login
  if (role && userRole !== role) return <Navigate to="/login" replace />;

  return children;
}
