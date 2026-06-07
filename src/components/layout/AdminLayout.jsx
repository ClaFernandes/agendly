import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error.message);
    }
  }

  const isActive = (path) => {
    if (path === "/admin") return pathname === "/admin";
    return pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Agendly Admin</h2>

        <nav>
          <Link to="/admin" className={isActive("/admin") ? "active" : ""}>
            Dashboard
          </Link>

          <Link
            to="/admin/businesses"
            className={isActive("/admin/businesses") ? "active" : ""}
          >
            Negócios
          </Link>

          <Link
            to="/admin/users"
            className={isActive("/admin/users") ? "active" : ""}
          >
            Administradores
          </Link>
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Sair
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
