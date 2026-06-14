// src/pages/dashboard/Dashboard.jsx

import { Link } from "react-router-dom";

import {
  RiCalendarLine,
  RiScissorsCutLine,
  RiTimeLine,
  RiSettings4Line,
  RiExternalLinkLine,
  RiFileCopyLine,
} from "react-icons/ri";

import { useState } from "react";
import { useBusiness } from "../../context/BusinessContext";
import { useServices } from "../../hooks/useServices";

import "./Dashboard.css";

// Extrai iniciais do nome do negócio, ignorando palavras de ligação
function getInitials(name) {
  if (!name) return "?";
  const stopWords = new Set(["do", "da", "de", "dos", "das", "e", "o", "a"]);
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => !stopWords.has(w.toLowerCase()));
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Cards de acesso rápido às secções do dashboard
const QUICK_LINKS = [
  {
    to: "/dashboard/appointments",
    icon: RiCalendarLine,
    label: "Agenda",
    description: "Gere os teus agendamentos",
  },
  {
    to: "/dashboard/services",
    icon: RiScissorsCutLine,
    label: "Serviços",
    description: "Cria e edita os teus serviços",
  },
  {
    to: "/dashboard/schedule",
    icon: RiTimeLine,
    label: "Horários",
    description: "Define os teus dias e horas",
  },
  {
    to: "/dashboard/settings",
    icon: RiSettings4Line,
    label: "Negócio",
    description: "Edita os dados do teu negócio",
  },
];

export default function Dashboard() {
  const { business, loading: bizLoading } = useBusiness();
  const { services, loading: svcLoading } = useServices();
  const [copied, setCopied] = useState(false);

  // URL pública do negócio — domínio fixo de produção
  const PUBLIC_BASE = "https://agendly.app/p";
  const publicUrl = business?.slug ? `${PUBLIC_BASE}/${business.slug}` : null;

  // Copia o link público para a área de transferência
  async function handleCopy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      // Fallback para browsers sem suporte à Clipboard API
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

  // Estatísticas calculadas a partir dos serviços carregados
  const totalServices = services.length;
  const activeServices = services.filter((s) => s.active).length;
  const featuredServices = services.filter((s) => s.is_featured).length;

  // Mostra loading enquanto o negócio não estiver disponível
  if (bizLoading) {
    return (
      <div className="db-page">
        <div className="db-loading">
          <span className="db-loading-text">A carregar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="db-page">
      {/* Cabeçalho com avatar, saudação e link público */}
      <div className="db-welcome">
        <div className="db-welcome-info">
          {/* Avatar: usa logo do negócio ou iniciais como fallback */}
          <div className="db-welcome-avatar">
            {business?.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="db-welcome-avatar-img"
              />
            ) : (
              <div className="db-welcome-avatar-initials">
                {getInitials(business?.name)}
              </div>
            )}
          </div>
          <div>
            <h1 className="pg-title">Olá, {business?.name ?? "bem-vindo"}!</h1>
            <p className="pg-subtitle">Aqui tens um resumo do teu negócio.</p>
          </div>
        </div>

        {/* Link público do negócio — só aparece se o slug estiver definido */}
        {publicUrl && (
          <div className="db-public-link">
            <span className="db-public-link-url">{publicUrl}</span>

            {/* Botão copiar — muda de estado visual após cópia bem-sucedida */}
            <button
              className={`db-public-link-btn ${copied ? "db-public-link-btn--copied" : ""}`}
              onClick={handleCopy}
              title="Copiar link"
            >
              <RiFileCopyLine aria-hidden="true" />
              {copied ? "Copiado!" : "Copiar"}
            </button>

            {/* Link externo para abrir a página pública num novo separador */}
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

      {/* Grelha de estatísticas do negócio */}
      <div className="pg-stats-grid">
        {/* Receita mensal — placeholder até integração com pagamentos */}
        <div className="pg-stat-card">
          <p className="pg-stat-label">Receita mensal</p>
          <p className="pg-stat-value db-stat-placeholder">
            {new Intl.NumberFormat("pt-PT", {
              style: "currency",
              currency: "EUR",
            }).format(0)}
          </p>
          <p className="pg-stat-meta">Em breve</p>
        </div>

        {/* Agendamentos hoje — placeholder até integração com appointments */}
        <div className="pg-stat-card">
          <p className="pg-stat-label">Agendamentos hoje</p>
          <p className="pg-stat-value db-stat-placeholder">—</p>
          <p className="pg-stat-meta">Em breve</p>
        </div>

        {/* Agendamentos esta semana — placeholder */}
        <div className="pg-stat-card">
          <p className="pg-stat-label">Agendamentos semana</p>
          <p className="pg-stat-value db-stat-placeholder">—</p>
          <p className="pg-stat-meta">Em breve</p>
        </div>

        {/* Serviços ativos — calculado em tempo real a partir do hook useServices */}
        <div className="pg-stat-card">
          <p className="pg-stat-label">Serviços ativos</p>
          <p className="pg-stat-value">{svcLoading ? "—" : activeServices}</p>
          {/* Meta só aparece depois de os serviços estarem carregados */}
          {!svcLoading && (
            <p className="pg-stat-meta">{totalServices} no total</p>
          )}
        </div>

        {/* Serviços em destaque — filtra por is_featured === true */}
        <div className="pg-stat-card">
          <p className="pg-stat-label">Serviços em destaque</p>
          <p className="pg-stat-value">{svcLoading ? "—" : featuredServices}</p>
          {/* Indica quantos dos serviços ativos estão marcados como destaque */}
          {!svcLoading && (
            <p className="pg-stat-meta">
              {activeServices} {activeServices === 1 ? "ativo" : "ativos"}
            </p>
          )}
        </div>
      </div>

      {/* Próximos agendamentos — secção placeholder até os dados estarem disponíveis */}
      <div className="pg-section" style={{ marginBottom: 24 }}>
        <div className="pg-section-header">
          <h2 className="pg-section-title">Próximos agendamentos</h2>
          <Link to="/dashboard/appointments" className="btn-secondary">
            Ver todos
          </Link>
        </div>
        <div className="pg-empty">
          <RiCalendarLine className="pg-empty-icon" aria-hidden="true" />
          <p className="pg-empty-text">
            Os agendamentos vão aparecer aqui em breve
          </p>
          <p className="pg-empty-subtext">
            Partilha o teu link de agendamento com os clientes para começares.
          </p>
        </div>
      </div>

      {/* Acesso rápido às secções principais do dashboard */}
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
