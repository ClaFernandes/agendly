import { Navigate } from "react-router-dom";
// import { useAuth }

function ProtectedRoute({ children, role }) {
  // Valores temporários. Quando AuthContext estiver pronto, substituir por useAuth
  // const { user, role: userRole, loading } = useAuth();
  const isAuthenticated = true;
  const userRole = "provider";
  const loading = false;

  if (loading) return <div>A carregar...</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role && userRole !== role) return <Navigate to="/login" replace />;

  return children;
}

export default ProtectedRoute;
