import { Outlet, Link } from "react-router-dom";

function DashboardLayout() {
  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <nav>
          <Link to="/dashboard">Início</Link>
          <Link to="/dashboard/services">Serviços</Link>
          <Link to="/dashboard/schedule">Horários</Link>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
