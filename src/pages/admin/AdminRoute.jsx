import { Navigate } from "react-router-dom";
// import { useAuth } from "../../hooks/useAuth";

function AdminRoute({ children }) {
  // Reestruturar após AuthContext

  const isAuthenticated = true;
  const userRole = "admin"; // admin ou provider
  const loading = false;

  if (loading) {
    return <div>A carregar permissões...</div>;
  }

  if (!isAuthenticated || userRole !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default AdminRoute;
