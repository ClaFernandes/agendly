// src/pages/admin/AdminDashboard.jsx

import { Link } from "react-router-dom";
import { useAdmin } from "../../hooks/useAdmin";
import { FiBriefcase, FiArrowRight, FiAlertCircle, FiTrendingUp, FiAward } from "react-icons/fi";
import "./AdminPanel.css";

function formatPrice(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency", currency: "EUR", minimumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "2-digit",
  });
}

export default function AdminDashboard() {
  const { stats, recentBusinesses, loading, error } = useAdmin();

  if (loading) {
    return <div className="admin-loading"><div className="admin-spinner" />A carregar painel...</div>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Painel de administração</h1>
          <p>Visão geral da plataforma — {new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {error && <div className="admin-error-banner"><FiAlertCircle />{error}</div>}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <div className="admin-stat-card accent">
          <div className="admin-stat-label">Negócios registados</div>
          <div className="admin-stat-value">{stats.totalBusinesses}</div>
          <div className="admin-stat-sub">{stats.activeBusinesses} ativos</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Agendamentos totais</div>
          <div className="admin-stat-value">{stats.totalAppointments.toLocaleString("pt-PT")}</div>
          <div className="admin-stat-sub">todos os negócios</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Receita total plataforma</div>
          <div className="admin-stat-value" style={{ fontSize: "1.4rem" }}>
            {formatPrice(stats.totalRevenue)}
          </div>
          <div className="admin-stat-sub">agendamentos concluídos</div>
        </div>

        {stats.topProvider && (
          <div className="admin-stat-card">
            <div className="admin-stat-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <FiAward size={13} /> Negócio mais ativo
            </div>
            <div className="admin-stat-value" style={{ fontSize: "1.1rem" }}>
              {stats.topProvider.name}
            </div>
            <div className="admin-stat-sub">
              {stats.topProvider.appointment_count} agendamentos · {formatPrice(stats.topProvider.revenue)}
            </div>
          </div>
        )}
      </div>

      {/* Negócios recentes */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Negócios recentes</h2>
          <Link to="/admin/providers" className="admin-shortcut-link">
            Ver todos
          </Link>
        </div>

        {recentBusinesses.length === 0 ? (
          <div className="admin-empty">
            <FiBriefcase />
            <p>Nenhum negócio registado ainda.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Negócio</th>
                  <th>Slug</th>
                  <th>Registo</th>
                  <th>Agendamentos</th>
                  <th>Receita</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentBusinesses.map((b) => (
                  <tr key={b.id}>
                    <td><div className="admin-table-name">{b.name}</div></td>
                    <td><span className="admin-table-slug">{b.slug}</span></td>
                    <td>{formatDate(b.created_at)}</td>
                    <td style={{ fontWeight: 600 }}>{b.appointment_count ?? 0}</td>
                    <td style={{ fontWeight: 600, color: "var(--color-ok)" }}>
                      {formatPrice(b.revenue ?? 0)}
                    </td>
                    <td>
                      <span className={`admin-badge ${b.is_active ? "active" : "inactive"}`}>
                        <span className="admin-badge-dot" />
                        {b.is_active ? "ativo" : "suspenso"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gestão de administradores */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Gestão de administradores</h2>
          <Link to="/admin/users" className="admin-shortcut-link">
            Gerir administradores
          </Link>
        </div>
      </div>
    </div>
  );
}
