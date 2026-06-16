// src/pages/admin/AdminDashboard.jsx

import { Link } from "react-router-dom";
import { useAdmin } from "../../hooks/useAdmin";
import { FiBriefcase, FiArrowRight, FiAlertCircle } from "react-icons/fi";
import "./AdminPanel.css";

export default function AdminDashboard() {
  const { stats, recentBusinesses, loading, error } = useAdmin();

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />A carregar painel...
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Painel de administração</h1>
          <p>
            Visão geral da plataforma —{" "}
            {new Date().toLocaleDateString("pt-PT", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {error && (
        <div className="admin-error-banner">
          <FiAlertCircle />
          {error}
        </div>
      )}

      <div className="admin-stats-grid">
        <div className="admin-stat-card accent">
          <div className="admin-stat-label">Negócios registados</div>
          <div className="admin-stat-value">{stats.totalBusinesses}</div>
          <div className="admin-stat-sub">na plataforma</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Agendamentos totais</div>
          <div className="admin-stat-value">
            {stats.totalAppointments.toLocaleString("pt-PT")}
          </div>
          <div className="admin-stat-sub">todos os negócios</div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-label">Negócios ativos</div>
          <div className="admin-stat-value">{stats.activeBusinesses}</div>
          <div className="admin-stat-sub">
            de {stats.totalBusinesses} registados
          </div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Negócios recentes</h2>
          <Link to="/admin/businesses" className="admin-shortcut-link">
            Ver todos <FiArrowRight />
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
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentBusinesses.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="admin-table-name">{b.name}</div>
                    </td>
                    <td>
                      <span className="admin-table-slug">{b.slug}</span>
                    </td>
                    <td>{formatDate(b.created_at)}</td>
                    <td>
                      <span
                        className={`admin-badge ${b.is_active ? "active" : "inactive"}`}
                      >
                        <span className="admin-badge-dot" />
                        {b.is_active ? "ativo" : "inativo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <div>
            <h2>Gestão de administradores</h2>
          </div>
          <Link to="/admin/users" className="admin-shortcut-link">
            Gerir administradores <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}