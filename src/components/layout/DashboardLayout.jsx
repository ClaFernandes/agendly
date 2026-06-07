import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function DashboardLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Dados do utilizador autenticado vindos do AuthContext
  const { user, logout } = useAuth();

  // Ao fazer logout, limpa a sessão e redireciona para o login
  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error.message);
    }
  }

  const isActive = (path) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>Agendly</h2>
        </div>

        <nav>
          <Link
            to="/dashboard"
            className={isActive("/dashboard") ? "active" : ""}
          >
            Dashboard
          </Link>

          <Link
            to="/dashboard/appointments"
            className={isActive("/dashboard/appointments") ? "active" : ""}
          >
            Agendamentos
          </Link>

          <Link
            to="/dashboard/services"
            className={isActive("/dashboard/services") ? "active" : ""}
          >
            Serviços
          </Link>

          <Link
            to="/dashboard/schedule"
            className={isActive("/dashboard/schedule") ? "active" : ""}
          >
            Horários
          </Link>

          <Link
            to="/dashboard/clients"
            className={isActive("/dashboard/clients") ? "active" : ""}
          >
            Clientes
          </Link>

          <Link
            to="/dashboard/financial"
            className={isActive("/dashboard/financial") ? "active" : ""}
          >
            Financeiro
          </Link>

          <Link
            to="/dashboard/settings"
            className={isActive("/dashboard/settings") ? "active" : ""}
          >
            Configurações
          </Link>
        </nav>

        {/* Rodapé da sidebar — utilizador autenticado + logout */}
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
