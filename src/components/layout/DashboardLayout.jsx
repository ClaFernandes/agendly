import { Outlet, Link, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const { pathname } = useLocation();

  const isActive = (path) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
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
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
