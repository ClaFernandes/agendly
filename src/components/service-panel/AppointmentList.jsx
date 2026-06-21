// src/components/service-panel/AppointmentList.jsx

import { useState } from "react";
import {
  RiCheckLine,
  RiCloseLine,
  RiArrowGoBackLine,
  RiTimeLine,
  RiTimerLine,
  RiToolsLine,
  RiMoneyDollarCircleLine,
} from "react-icons/ri";
import {
  resolveStatus,
  STATUS_CONFIG,
  APPOINTMENT_STATUS,
} from "../../hooks/useAppointments";

const AVATAR_COLORS = [
  { bg: "#EEEDFE", color: "#534AB7" },
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#FAECE7", color: "#993C1D" },
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#FBEAF0", color: "#993556" },
  { bg: "#EAF3DE", color: "#3B6D11" },
];

const TIME_BAR_COLORS = [
  "#7F77DD",
  "#1D9E75",
  "#D85A30",
  "#378ADD",
  "#D4537E",
  "#639922",
];

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function getColorIndex(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return hash % AVATAR_COLORS.length;
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDurationMinutes(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 60000);
}

function formatDateLabel(iso) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function StatusPill({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.em_aberto;
  const pillStyles = {
    em_aberto: { background: "#FEF9EC", color: "#92620A" },
    concluido: { background: "#E1F5EE", color: "#0F6E56" },
    cancelado: { background: "#FCEBEB", color: "#A32D2D" },
  };
  return (
    <span
      className="appt-status-pill"
      style={pillStyles[status] ?? pillStyles.em_aberto}
    >
      {config.label}
    </span>
  );
}

function AppointmentCard({ appt, saving, onComplete, onCancel, onReopen }) {
  const [open, setOpen] = useState(false);

  const derived = resolveStatus(appt);
  const idx = getColorIndex(appt.client_name || appt.id);
  const avatarStyle = AVATAR_COLORS[idx];
  const barColor = TIME_BAR_COLORS[idx];
  const startTime = formatTime(appt.starts_at);
  const endTime = formatTime(appt.ends_at);
  const duration = getDurationMinutes(appt.starts_at, appt.ends_at);
  const initials = getInitials(appt.client_name);
  const dateLabel = formatDateLabel(appt.starts_at);
  const price =
    typeof appt.price === "number"
      ? appt.price.toLocaleString("pt-PT", {
          style: "currency",
          currency: "EUR",
        })
      : appt.service?.price != null
        ? Number(appt.service.price).toLocaleString("pt-PT", {
            style: "currency",
            currency: "EUR",
          })
        : "—";

  const cardStyle =
    derived === APPOINTMENT_STATUS.CANCELADO ? { opacity: 0.6 } : {};

  return (
    <div
      className={`appt-item-v2${open ? " appt-item-v2--open" : ""}`}
      style={cardStyle}
      onClick={() => setOpen((o) => !o)}
    >
      <div className="appt-item-v2-body">
        <div className="appt-avatar" style={avatarStyle}>
          {initials}
        </div>

        <div className="appt-item-info">
          <div className="appt-item-name">{appt.client_name}</div>
          <div className="appt-time-block">
            <div className="appt-time-bar" style={{ background: barColor }} />
            <div>
              <div className="appt-time-text">
                {startTime} – {endTime}
              </div>
              <div className="appt-time-sub">
                {appt.service?.name ?? appt.service_name} · {dateLabel} ⏱{" "}
                {duration} min
              </div>
            </div>
          </div>
        </div>

        <div className="appt-item-v2-right">
          <span className="appt-item-price">{price}</span>
          <StatusPill status={derived} />
        </div>
      </div>

      {open && (
        <div className="appt-item-details" onClick={(e) => e.stopPropagation()}>
          <div className="appt-detail-grid">
            <div className="appt-detail-item">
              <RiTimeLine aria-hidden="true" />
              <div>
                <span className="appt-detail-label">Início</span>
                {startTime}
              </div>
            </div>
            <div className="appt-detail-item">
              <RiTimerLine aria-hidden="true" />
              <div>
                <span className="appt-detail-label">Fim</span>
                {endTime}
              </div>
            </div>
            <div className="appt-detail-item">
              <RiToolsLine aria-hidden="true" />
              <div>
                <span className="appt-detail-label">Serviço</span>
                {appt.service?.name ?? appt.service_name}
              </div>
            </div>
            <div className="appt-detail-item">
              <RiMoneyDollarCircleLine aria-hidden="true" />
              <div>
                <span className="appt-detail-label">Valor</span>
                {price}
              </div>
            </div>
            {appt.notes && (
              <div className="appt-detail-item appt-detail-item--full">
                <div>
                  <span className="appt-detail-label">Notas</span>
                  {appt.notes}
                </div>
              </div>
            )}
          </div>

          <div className="appt-item-actions">
            {/* Cancelado → só reabrir */}
            {derived === APPOINTMENT_STATUS.CANCELADO && (
              <button
                className="appt-action-btn appt-action-btn--reopen"
                disabled={saving}
                onClick={() => onReopen(appt.id)}
              >
                <RiArrowGoBackLine aria-hidden="true" />
                Reabrir
              </button>
            )}

            {/* Em aberto → cancelar ou concluir */}
            {derived === APPOINTMENT_STATUS.EM_ABERTO && (
              <>
                <button
                  className="appt-action-btn appt-action-btn--cancel"
                  disabled={saving}
                  onClick={() => onCancel(appt.id)}
                >
                  <RiCloseLine aria-hidden="true" />
                  Cancelar
                </button>
                <button
                  className="appt-action-btn appt-action-btn--complete"
                  disabled={saving}
                  onClick={() => onComplete(appt.id)}
                >
                  <RiCheckLine aria-hidden="true" />
                  Concluir
                </button>
              </>
            )}

            {/* Concluído (automático ou manual) → cancelar ou reabrir */}
            {derived === APPOINTMENT_STATUS.CONCLUIDO && (
              <>
                <button
                  className="appt-action-btn appt-action-btn--cancel"
                  disabled={saving}
                  onClick={() => onCancel(appt.id)}
                >
                  <RiCloseLine aria-hidden="true" />
                  Cancelar
                </button>
                <button
                  className="appt-action-btn appt-action-btn--reopen"
                  disabled={saving}
                  onClick={() => onReopen(appt.id)}
                >
                  <RiArrowGoBackLine aria-hidden="true" />
                  Reabrir
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "em_aberto", label: "Próximos" },
  { key: "concluido", label: "Concluídos" },
  { key: "cancelado", label: "Cancelados" },
];

export default function AppointmentList({
  appointments = [],
  loading,
  saving,
  onComplete,
  onCancel,
  onReopen,
}) {
  const [activeFilter, setActiveFilter] = useState("all");

  // Conta usando o status derivado
  const counts = appointments.reduce((acc, a) => {
    const s = resolveStatus(a);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  counts.all = appointments.length;

  const filtered =
    activeFilter === "all"
      ? appointments
      : appointments.filter((a) => resolveStatus(a) === activeFilter);

  if (loading) {
    return <div className="appt-loading">A carregar agendamentos...</div>;
  }

  return (
    <>
      <div className="appt-filters">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`appt-filter-btn${activeFilter === key ? " appt-filter-btn--active" : ""}`}
            onClick={() => setActiveFilter(key)}
          >
            {label}
            <span className="appt-filter-count">{counts[key] ?? 0}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="appt-empty">Sem agendamentos para este filtro.</p>
      ) : (
        <div className="appt-list">
          {filtered.map((appt) => (
            <AppointmentCard
              key={appt.id}
              appt={appt}
              saving={saving}
              onComplete={onComplete}
              onCancel={onCancel}
              onReopen={onReopen}
            />
          ))}
        </div>
      )}
    </>
  );
}
