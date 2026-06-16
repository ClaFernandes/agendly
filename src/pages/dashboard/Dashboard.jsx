// src/pages/dashboard/Dashboard.jsx

import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import {
  RiCalendarLine,
  RiScissorsCutLine,
  RiTimeLine,
  RiUserSettingsLine,
  RiExternalLinkLine,
  RiFileCopyLine,
  RiAlertLine,
  RiCalendarCheckLine,
} from "react-icons/ri";
import { useBusiness } from "../../context/BusinessContext";
import { useServices } from "../../hooks/useServices";
import { useAppointments, resolveStatus } from "../../hooks/useAppointments";
import "./Dashboard.css";

function getInitials(name) {
  if (!name) return "?";
  const stopWords = new Set(["do", "da", "de", "dos", "das", "e", "o", "a"]);
  const words = name.trim().split(/\s+/).filter(w => !stopWords.has(w.toLowerCase()));
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString("pt-PT", { weekday: "short", day: "2-digit", month: "short" });
}

const AVATAR_COLORS = [
  { bg: "#EEEDFE", color: "#534AB7" },
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#FAECE7", color: "#993C1D" },
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#FBEAF0", color: "#993556" },
  { bg: "#EAF3DE", color: "#3B6D11" },
];

function getColorIndex(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return hash % AVATAR_COLORS.length;
}

const STATUS_PILL = {
  em_aberto: { bg: "#FEF9EC", color: "#92620A", label: "Em aberto" },
  concluido: { bg: "#E1F5EE", color: "#0F6E56", label: "Concluído" },
  cancelado: { bg: "#FCEBEB", color: "#A32D2D", label: "Cancelado" },
};

function UpcomingCard({ appt }) {
  const idx = getColorIndex(appt.client_name || "");
  const avatar = AVATAR_COLORS[idx];
  const derived = resolveStatus(appt);
  const pill = STATUS_PILL[derived] ?? STATUS_PILL.em_aberto;
  const price = appt.service?.price != null
    ? Number(appt.service.price).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
    : "—";

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 0",
      borderBottom: "0.5px solid var(--color-border)",
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: avatar.bg, color: avatar.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 600, flexShrink: 0,
      }}>
        {getInitials(appt.client_name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text)" }}>
          {appt.client_name}
        </div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: 2 }}>
          {appt.service?.name} · {formatDateShort(appt.starts_at)} · {formatTime(appt.starts_at)}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>{price}</span>
        <span style={{
          fontSize: 11, fontWeight: 500, padding: "2px 8px",
          borderRadius: "var(--radius-full)", background: pill.bg, color: pill.color,
        }}>
          {pill.label}
        </span>
      </div>
    </div>
  );
}

const QUICK_LINKS = [
  { to: "/dashboard/appointments", icon: RiCalendarLine, label: "Agenda", description: "Consulta o calendário" },
  { to: "/dashboard/bookings", icon: RiCalendarCheckLine, label: "Gestão", description: "Gere os teus agendamentos" },
  { to: "/dashboard/services", icon: RiScissorsCutLine, label: "Serviços", description: "Cria e edita os teus serviços" },
  { to: "/dashboard/schedule", icon: RiTimeLine, label: "Horários", description: "Define os teus dias e horas" },
  { to: "/dashboard/settings", icon: RiUserSettingsLine, label: "Perfil", description: "Edita os dados do teu negócio" },
];

export default function Dashboard() {
  const { business, loading: bizLoading } = useBusiness();
  const { services, loading: svcLoading } = useServices();
  const { appointments, today, loading: apptLoading } = useAppointments();
  const [copied, setCopied] = useState(false);

  const PUBLIC_BASE = "https://agendly.app/p";
  const publicUrl = business?.slug ? `${PUBLIC_BASE}/${business.slug}` : null;

  async function handleCopy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = publicUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const totalServices = services.length;
  const activeServices = services.filter(s => s.active).length;
  const featuredServices = services.filter(s => s.is_featured).length;
  const todayCount = today.length;

  const weekCount = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return appointments.filter(a => {
      const d = new Date(a.starts_at);
      return d >= start && d <= end;
    }).length;
  }, [appointments]);

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(a => {
        if (a.status !== "concluido") return false;
        const d = new Date(a.starts_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0);
  }, [appointments]);

  // Próximos agendamentos — em aberto, a partir de agora, máx 5
  const upcoming = useMemo(() => {
    const now = new Date();
    return appointments
      .filter(a => resolveStatus(a) === "em_aberto" && new Date(a.starts_at) >= now)
      .slice(0, 5);
  }, [appointments]);

  if (bizLoading) {
    return (
      <div className="db-page">
        <div className="db-loading">
          <span className="db-loading-text">A carregar...</span>
        </div>
      </div>
    );
  }

  const isNewAccount = !svcLoading && totalServices === 0;

  return (
    <div className="db-page">
      {/* Boas-vindas */}
      <div className="db-welcome">
        <div className="db-welcome-info">
          <div className="db-welcome-avatar">
            {business?.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="db-welcome-avatar-img" />
            ) : (
              <div className="db-welcome-avatar-initials">{getInitials(business?.name)}</div>
            )}
          </div>
          <div>
            <h1 className="pg-title">Olá, {business?.name ?? "bem-vindo"}!</h1>
            <p className="pg-subtitle">Aqui tens um resumo do teu negócio.</p>
          </div>
        </div>

        {publicUrl && (
          <div className="db-public-link">
            <span className="db-public-link-url">{publicUrl}</span>
            <button
              className={`db-public-link-btn ${copied ? "db-public-link-btn--copied" : ""}`}
              onClick={handleCopy}
              title="Copiar link"
            >
              <RiFileCopyLine aria-hidden="true" />
              {copied ? "Copiado!" : "Copiar"}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="db-public-link-btn"
              title="Abrir página pública"
            >
              <RiExternalLinkLine aria-hidden="true" />
            </a>
          </div>
        )}
      </div>

      {isNewAccount && (
        <div className="db-onboarding-banner">
          <div className="db-onboarding-icon">
            <RiAlertLine aria-hidden="true" />
          </div>
          <div className="db-onboarding-body">
            <p className="db-onboarding-title">Começa por criar os teus serviços</p>
            <p className="db-onboarding-desc">
              Para os clientes conseguirem agendar, precisas de ter pelo menos um serviço activo.
            </p>
          </div>
          <Link to="/dashboard/services" className="btn-primary db-onboarding-btn">
            <RiScissorsCutLine aria-hidden="true" />
            Criar serviço
          </Link>
        </div>
      )}

      {/* Cards de estatísticas */}
      <div className="pg-stats-grid">
        <div className="pg-stat-card">
          <p className="pg-stat-label">Receita mensal</p>
          <p className="pg-stat-value">
            {apptLoading ? "—" : new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(monthlyRevenue)}
          </p>
          <p className="pg-stat-meta">mês actual</p>
        </div>
        <div className="pg-stat-card">
          <p className="pg-stat-label">Agendamentos hoje</p>
          <p className="pg-stat-value">{apptLoading ? "—" : todayCount}</p>
          <p className="pg-stat-meta">{apptLoading ? "" : `${today.filter(a => resolveStatus(a) === "em_aberto").length} por acontecer`}</p>
        </div>
        <div className="pg-stat-card">
          <p className="pg-stat-label">Agendamentos semana</p>
          <p className="pg-stat-value">{apptLoading ? "—" : weekCount}</p>
          <p className="pg-stat-meta">esta semana</p>
        </div>
        <div className="pg-stat-card">
          <p className="pg-stat-label">Serviços ativos</p>
          <p className="pg-stat-value">{svcLoading ? "—" : activeServices}</p>
          {!svcLoading && <p className="pg-stat-meta">{totalServices} no total</p>}
        </div>
        <div className="pg-stat-card">
          <p className="pg-stat-label">Serviços em destaque</p>
          <p className="pg-stat-value">{svcLoading ? "—" : featuredServices}</p>
          {!svcLoading && <p className="pg-stat-meta">{activeServices} {activeServices === 1 ? "ativo" : "ativos"}</p>}
        </div>
      </div>

      {/* Próximos agendamentos */}
      <div className="pg-section" style={{ marginBottom: 24 }}>
        <div className="pg-section-header">
          <h2 className="pg-section-title">Próximos agendamentos</h2>
          <Link to="/dashboard/bookings" className="btn-secondary">Ver todos</Link>
        </div>

        {apptLoading ? (
          <div className="appt-loading">A carregar...</div>
        ) : upcoming.length === 0 ? (
          <div className="pg-empty">
            <RiCalendarLine className="pg-empty-icon" aria-hidden="true" />
            <p className="pg-empty-text">Sem agendamentos futuros</p>
            <p className="pg-empty-subtext">
              Partilha o teu link de agendamento com os clientes para começares.
            </p>
          </div>
        ) : (
          <div style={{ padding: "0 4px" }}>
            {upcoming.map((appt) => (
              <UpcomingCard key={appt.id} appt={appt} />
            ))}
          </div>
        )}
      </div>

      {/* Acesso rápido */}
      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Acesso rápido</h2>
        </div>
        <div className="db-quick-links">
          {QUICK_LINKS.map(({ to, icon: Icon, label, description }) => (
            <Link key={to} to={to} className="db-quick-link">
              <div className="db-quick-link-icon">
                <Icon aria-hidden="true" />
              </div>
              <div>
                <p className="db-quick-link-label">{label}</p>
                <p className="db-quick-link-desc">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}