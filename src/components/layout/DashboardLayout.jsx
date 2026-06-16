// src/components/layout/DashboardLayout.jsx

import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";

import {
  RiHomeLine,
  RiCalendarLine,
  RiCalendarCheckLine,
  RiTeamLine,
  RiBarChartLine,
  RiScissorsCutLine,
  RiTimeLine,
  RiUserSettingsLine,
  RiLogoutBoxLine,
} from "react-icons/ri";

import "./DashboardLayout.css";

const NAV_ITEMS = [
  { to: "/dashboard", icon: RiHomeLine, label: "Início" },
  { to: "/dashboard/appointments", icon: RiCalendarLine, label: "Agenda" },
  { to: "/dashboard/bookings", icon: RiCalendarCheckLine, label: "Gestão" },
  { to: "/dashboard/clients", icon: RiTeamLine, label: "Clientes" },
  { to: "/dashboard/financial", icon: RiBarChartLine, label: "Financeiro" },
  { to: "/dashboard/services", icon: RiScissorsCutLine, label: "Serviços" },
  { to: "/dashboard/schedule", icon: RiTimeLine, label: "Horários" },
  { to: "/dashboard/settings", icon: RiUserSettingsLine, label: "Perfil" },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { business } = useBusiness();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Erro ao fazer logout:", error.message);
    }
  }

  function getInitials(name) {
    if (!name) return "?";
    const stopWords = new Set(["do", "da", "de", "dos", "das", "e", "o", "a"]);
    const words = name.trim().split(/\s+/).filter((w) => !stopWords.has(w.toLowerCase()));
    if (words.length === 0) return name.slice(0, 2).toUpperCase();
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  return (
    <div className="dl-wrapper">
      <aside className="dl-sidebar">
        <div className="dl-brand">
          {business?.logo_url ? (
            <img src={business.logo_url} alt={business?.name} className="dl-avatar-img" />
          ) : (
            <div className="dl-avatar" title={business?.name}>
              {getInitials(business?.name)}
            </div>
          )}
        </div>

        <nav className="dl-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                `dl-nav-item${isActive ? " dl-nav-item--active" : ""}`
              }
            >
              <Icon className="dl-nav-icon" aria-hidden="true" />
              <span className="dl-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dl-sidebar-footer">
          <button
            className="dl-logout-btn"
            onClick={handleLogout}
            title={`Sair (${user?.email})`}
          >
            <RiLogoutBoxLine className="dl-nav-icon" aria-hidden="true" />
            <span className="dl-nav-label">Sair</span>
          </button>
        </div>
      </aside>

      <main className="dl-main">
        <Outlet />
      </main>
    </div>
  );
}
