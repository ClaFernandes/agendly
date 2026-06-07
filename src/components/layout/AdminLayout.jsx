import { Outlet, Link, useLocation } from "react-router-dom";

export default function AdminLayout() {
  const { pathname } = useLocation();

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
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
