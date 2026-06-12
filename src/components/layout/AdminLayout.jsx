import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import { FiGrid, FiBriefcase, FiShield, FiLogOut } from "react-icons/fi";

import logo from "../../assets/logo.svg";
import "./AdminLayout.css";

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
      {/* Sidebar */}
      <aside className="admin-sidebar">
        {/* Marca */}
        <div className="admin-sidebar-brand">
          <img src={logo} alt="Agendly" />
          <span>Agendly</span>
          <span className="admin-sidebar-badge">Admin</span>
        </div>

        {/* Navegação principal */}
        <nav>
          <Link to="/admin" className={isActive("/admin") ? "active" : ""}>
            <FiGrid />
            <span>Início</span>
          </Link>

          <Link
            to="/admin/businesses"
            className={isActive("/admin/businesses") ? "active" : ""}
          >
            <FiBriefcase />
            <span>Negócios</span>
          </Link>

          <Link
            to="/admin/users"
            className={isActive("/admin/users") ? "active" : ""}
          >
            <FiShield />
            <span>Admins</span>
          </Link>
        </nav>

        {/* Rodapé com email e logout */}
        <div className="admin-sidebar-footer">
          <span className="admin-sidebar-email">{user?.email}</span>
          <button onClick={handleLogout} className="admin-sidebar-logout">
            <FiLogOut />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
