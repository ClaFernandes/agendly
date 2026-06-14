// src/components/service-panel/AppointmentList.jsx

import { useState } from "react";
import { STATUS_CONFIG } from "../../hooks/useAppointments";
import {
  RiCheckLine,
  RiCloseLine,
  RiRefreshLine,
  RiUserLine,
  RiPhoneLine,
  RiMailLine,
  RiTimeLine,
  RiFileTextLine,
  RiCalendarLine,
} from "react-icons/ri";

// Formata data e hora para pt-PT
function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Formata duração em minutos para "1h 30min" ou "45min"
function formatDuration(minutes) {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Formata preço em euros
function formatPrice(price) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(price ?? 0);
}

export default function AppointmentList({
  appointments = [],
  loading = false,
  saving = false,
  onComplete,
  onCancel,
  onReopen,
}) {
  // Filtro activo por estado — null = todos
  const [activeFilter, setActiveFilter] = useState(null);

  // Agendamento expandido para ver detalhes — null = nenhum
  const [expandedId, setExpandedId] = useState(null);

  // Aplica o filtro de estado
  const filtered = activeFilter
    ? appointments.filter((a) => a.status === activeFilter)
    : appointments;

  // Contagens por estado para os botões de filtro
  const counts = {
    em_aberto: appointments.filter((a) => a.status === "em_aberto").length,
    concluido: appointments.filter((a) => a.status === "concluido").length,
    cancelado: appointments.filter((a) => a.status === "cancelado").length,
  };

  if (loading) {
    return (
      <div className="appt-loading">
        <span>A carregar agendamentos...</span>
      </div>
    );
  }

  return (
    <div className="appt-list">
      {/* Filtros por estado */}
      <div className="appt-filters">
        <button
          className={`appt-filter-btn ${!activeFilter ? "appt-filter-btn--active" : ""}`}
          onClick={() => setActiveFilter(null)}
        >
          Todos
          <span className="appt-filter-count">{appointments.length}</span>
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            className={`appt-filter-btn ${activeFilter === key ? "appt-filter-btn--active" : ""}`}
            onClick={() => setActiveFilter(activeFilter === key ? null : key)}
          >
            {config.label}
            <span className="appt-filter-count">{counts[key] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Lista vazia */}
      {filtered.length === 0 && (
        <div className="pg-empty">
          <RiCalendarLine className="pg-empty-icon" />
          <p className="pg-empty-text">
            {activeFilter
              ? `Sem agendamentos ${STATUS_CONFIG[activeFilter]?.label.toLowerCase()}`
              : "Sem agendamentos neste período"}
          </p>
        </div>
      )}

      {/* Itens */}
      {filtered.map((appt) => {
        const config = STATUS_CONFIG[appt.status] ?? {};
        const isExpanded = expandedId === appt.id;

        return (
          <div key={appt.id} className="appt-item">
            {/* Cabeçalho do item */}
            <div
              className="appt-item-header"
              onClick={() => setExpandedId(isExpanded ? null : appt.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && setExpandedId(isExpanded ? null : appt.id)
              }
            >
              {/* Badge de estado */}
              <span
                className="appt-status-badge"
                style={{ color: config.color, background: config.bg }}
              >
                {config.label}
              </span>

              {/* Info principal */}
              <div className="appt-item-info">
                <p className="appt-item-name">{appt.client_name}</p>
                <p className="appt-item-meta">
                  {appt.service?.name} · {formatDateTime(appt.starts_at)}
                </p>
              </div>

              {/* Preço */}
              <span className="appt-item-price">
                {formatPrice(appt.service?.price)}
              </span>
            </div>

            {/* Detalhes expandidos */}
            {isExpanded && (
              <div className="appt-item-details">
                <div className="appt-detail-grid">
                  {/* Contacto do cliente */}
                  <div className="appt-detail-item">
                    <RiUserLine aria-hidden="true" />
                    <span>{appt.client_name}</span>
                  </div>
                  {appt.client_email && (
                    <div className="appt-detail-item">
                      <RiMailLine aria-hidden="true" />
                      <span>{appt.client_email}</span>
                    </div>
                  )}
                  {appt.client_phone && (
                    <div className="appt-detail-item">
                      <RiPhoneLine aria-hidden="true" />
                      <span>{appt.client_phone}</span>
                    </div>
                  )}

                  {/* Detalhes do serviço */}
                  <div className="appt-detail-item">
                    <RiTimeLine aria-hidden="true" />
                    <span>
                      {formatDateTime(appt.starts_at)}
                      {appt.service?.duration_min && (
                        <> · {formatDuration(appt.service.duration_min)}</>
                      )}
                    </span>
                  </div>

                  {/* Notas */}
                  {appt.notes && (
                    <div className="appt-detail-item appt-detail-item--full">
                      <RiFileTextLine aria-hidden="true" />
                      <span>{appt.notes}</span>
                    </div>
                  )}
                </div>

                {/* Acções */}
                <div className="appt-item-actions">
                  {appt.status === "em_aberto" && (
                    <>
                      <button
                        className="appt-action-btn appt-action-btn--complete"
                        onClick={() => onComplete?.(appt.id)}
                        disabled={saving}
                      >
                        <RiCheckLine aria-hidden="true" />
                        Marcar concluído
                      </button>
                      <button
                        className="appt-action-btn appt-action-btn--cancel"
                        onClick={() => onCancel?.(appt.id)}
                        disabled={saving}
                      >
                        <RiCloseLine aria-hidden="true" />
                        Cancelar
                      </button>
                    </>
                  )}
                  {(appt.status === "concluido" ||
                    appt.status === "cancelado") && (
                    <button
                      className="appt-action-btn appt-action-btn--reopen"
                      onClick={() => onReopen?.(appt.id)}
                      disabled={saving}
                    >
                      <RiRefreshLine aria-hidden="true" />
                      Reabrir
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
