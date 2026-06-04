import { Outlet, Link } from "react-router-dom";

function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Agendly Admin</h2>
        <nav>
          <Link to="/admin"></Link>
          <Link to="/admin/businesses"></Link>
          <Link to="/admin/users"></Link>
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;
