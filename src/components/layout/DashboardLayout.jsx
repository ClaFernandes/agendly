// src/components/layout/DashboardLayout.jsx

import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
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
  RiMoreLine,
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

// Mobile - 4 itens fixos na bottom nav
const BOTTOM_NAV_PRIMARY = [
  { to: "/dashboard", icon: RiHomeLine, label: "Início" },
  { to: "/dashboard/bookings", icon: RiCalendarCheckLine, label: "Gestão" },
  { to: "/dashboard/clients", icon: RiTeamLine, label: "Clientes" },
  { to: "/dashboard/settings", icon: RiUserSettingsLine, label: "Perfil" },
];

// Mobile - 4 itens no drawer "Mais"
const BOTTOM_NAV_MORE = [
  { to: "/dashboard/appointments", icon: RiCalendarLine, label: "Agenda" },
  { to: "/dashboard/financial", icon: RiBarChartLine, label: "Financeiro" },
  { to: "/dashboard/services", icon: RiScissorsCutLine, label: "Serviços" },
  { to: "/dashboard/schedule", icon: RiTimeLine, label: "Horários" },
];

function getInitials(name) {
  if (!name) return "?";
  const stop = new Set(["do", "da", "de", "dos", "das", "e", "o", "a"]);
  const words = name.trim().split(/\s+/).filter(w => !stop.has(w.toLowerCase()));
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { business } = useBusiness();

  // Mobile - estado do drawer "Mais"
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Botão "Mais" fica activo se a página actual for um dos itens do drawer
  const moreIsActive = BOTTOM_NAV_MORE.some(item => pathname.startsWith(item.to));

  async function handleLogout() {
    try { await logout(); navigate("/login", { replace: true }); }
    catch (err) { console.error("Erro ao fazer logout:", err.message); }
  }

  // Ao navegar pelo drawer fecha-o automaticamente
  function handleDrawerNav() {
    setDrawerOpen(false);
  }

  return (
    <div className="dl-wrapper">

      {/* Sidebar lateral — visível em desktop/tablet, escondida em mobile */}
      <aside className="dl-sidebar">
        <div className="dl-brand">
          {business?.logo_url
            ? <img src={business.logo_url} alt={business?.name} className="dl-avatar-img" />
            : <div className="dl-avatar" title={business?.name}>{getInitials(business?.name)}</div>
          }
        </div>

        <nav className="dl-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) => `dl-nav-item${isActive ? " dl-nav-item--active" : ""}`}
            >
              <Icon className="dl-nav-icon" aria-hidden="true" />
              <span className="dl-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dl-sidebar-footer">
          <button className="dl-logout-btn" onClick={handleLogout} title={`Sair (${user?.email})`}>
            <RiLogoutBoxLine className="dl-nav-icon" aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="dl-main">
        <Outlet />
      </main>

      {/* Mobile - Bottom navigation */}
      <nav className="dl-bottom-nav" aria-label="Navegação principal">

        {/* 4 itens fixos */}
        {BOTTOM_NAV_PRIMARY.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) => `dl-nav-item${isActive ? " dl-nav-item--active" : ""}`}
          >
            <Icon className="dl-nav-icon" aria-hidden="true" />
            <span className="dl-nav-label">{label}</span>
          </NavLink>
        ))}

        {/* Botão "Mais" — activo se a página actual for do drawer */}
        <button
          className={`dl-nav-item dl-more-btn${moreIsActive ? " dl-nav-item--active" : ""}`}
          onClick={() => setDrawerOpen(o => !o)}
          aria-expanded={drawerOpen}
          aria-haspopup="true"
        >
          <RiMoreLine className="dl-nav-icon" aria-hidden="true" />
          <span className="dl-nav-label">Mais</span>
        </button>
      </nav>

      {/* Drawer "Mais" */}
      {drawerOpen && (
        <>
          {/* Overlay escuro — toca fora para fechar */}
          <div
            className="dl-drawer-overlay"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />

          <div className="dl-drawer" role="dialog" aria-label="Mais opções">

            {/* Handle visual */}
            <div className="dl-drawer-handle" />

            <p className="dl-drawer-title">Mais opções</p>

            {/* Grelha de itens do drawer */}
            <div className="dl-drawer-grid">
              {BOTTOM_NAV_MORE.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `dl-drawer-item${isActive ? " dl-drawer-item--active" : ""}`
                  }
                  onClick={handleDrawerNav}
                >
                  <div className="dl-drawer-item-icon">
                    <Icon aria-hidden="true" />
                  </div>
                  <span className="dl-drawer-item-label">{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Divisor + botão Sair */}
            <div className="dl-drawer-footer">
              <button className="dl-drawer-logout" onClick={handleLogout}>
                <RiLogoutBoxLine aria-hidden="true" />
                <span>Sair da conta</span>
              </button>
            </div>

          </div>
        </>
      )}

    </div>
  );
}