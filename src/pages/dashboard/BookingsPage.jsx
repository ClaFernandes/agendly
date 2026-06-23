// src/pages/dashboard/BookingsPage.jsx

import { useState, useMemo, useCallback } from "react";
import {
  RiAddLine,
  RiCheckLine,
  RiCloseLine,
  RiPencilLine,
  RiSearchLine,
  RiTimeLine,
  RiTimerLine,
  RiToolsLine,
  RiMoneyDollarCircleLine,
  RiCalendarLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiUserUnfollowLine,
} from "react-icons/ri";
import {
  useAppointments,
  resolveStatus,
  STATUS_CONFIG,
  APPOINTMENT_STATUS,
  isFuture,
  isPast,
} from "../../hooks/useAppointments";
import { useServices } from "../../hooks/useServices";
import { useBusiness } from "../../context/BusinessContext";
import { useRealtime } from "../../hooks/useRealtime";
import AppointmentFormModal from "../../components/service-panel/AppointmentFormModal";
import "./Dashboard.css";

// Helpers
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
    timeZone: "UTC",
  });
}

function formatDateLabel(iso) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

function getDurationMinutes(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 60000);
}

// Início da semana (segunda-feira)
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(weekStart) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function formatWeekLabel(weekStart) {
  const end = getWeekEnd(weekStart);
  const startStr = weekStart.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
  });

  const endStr = end.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
  });
  return `${startStr} – ${endStr}`;
}

const PILL_STYLES = {
  em_aberto: { background: "#FEF9EC", color: "#92620A" },
  concluido: { background: "#E1F5EE", color: "#0F6E56" },
  cancelado: { background: "#FCEBEB", color: "#A32D2D" },
  nao_compareceu: { background: "#F5F3FF", color: "#7C3AED" },
};

function StatusPill({ status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.em_aberto;
  return (
    <span
      className="appt-status-pill"
      style={PILL_STYLES[status] ?? PILL_STYLES.em_aberto}
    >
      {config.label}
    </span>
  );
}

// Card
function BookingCard({ appt, saving, onComplete, onCancel, onEdit, onNoShow, onReopen }) {
  const [open, setOpen] = useState(false);
  const derived = resolveStatus(appt);
  const future = isFuture(appt);
  const past = isPast(appt);

  const idx = getColorIndex(appt.client_name || appt.id);
  const avatarStyle = AVATAR_COLORS[idx];
  const barColor = TIME_BAR_COLORS[idx];
  const startTime = formatTime(appt.starts_at);
  const endTime = formatTime(appt.ends_at);
  const duration = getDurationMinutes(appt.starts_at, appt.ends_at);
  const dateLabel = formatDateLabel(appt.starts_at);
  const price =
    appt.service?.price != null
      ? Number(appt.service.price).toLocaleString("pt-PT", {
        style: "currency",
        currency: "EUR",
      })
      : "—";

  const isNoShow = appt.status === APPOINTMENT_STATUS.NAO_COMPARECEU;
  const isCancelled = derived === APPOINTMENT_STATUS.CANCELADO;

  // Permite abrir para editar estados concluído, cancelado, não compareceu
  const hasActions =
    (future && derived === APPOINTMENT_STATUS.EM_ABERTO) ||
    (past && appt.status === APPOINTMENT_STATUS.EM_ABERTO) ||
    derived === APPOINTMENT_STATUS.CONCLUIDO ||
    derived === APPOINTMENT_STATUS.CANCELADO ||
    derived === APPOINTMENT_STATUS.NAO_COMPARECEU;

  return (
    <div
      className={`appt-item-v2${open ? " appt-item-v2--open" : ""}`}
      style={{ opacity: isCancelled || isNoShow ? 0.65 : 1 }}
      onClick={() => hasActions && setOpen((o) => !o)}
      style={{
        opacity: isCancelled || isNoShow ? 0.65 : 1,
        cursor: hasActions ? "pointer" : "default",
      }}
    >
      <div className="appt-item-v2-body">
        <div className="appt-avatar" style={avatarStyle}>
          {getInitials(appt.client_name)}
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
                {appt.service?.name} · {dateLabel} · {duration} min
              </div>
            </div>
          </div>
        </div>
        <div className="appt-item-v2-right">
          <span className="appt-item-price">{price}</span>
          <StatusPill status={derived} />
        </div>
      </div>

      {open && hasActions && (
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
                {appt.service?.name}
              </div>
            </div>
            <div className="appt-detail-item">
              <RiMoneyDollarCircleLine aria-hidden="true" />
              <div>
                <span className="appt-detail-label">Valor</span>
                {price}
              </div>
            </div>
            {appt.client_email && (
              <div className="appt-detail-item">
                <RiCalendarLine aria-hidden="true" />
                <div>
                  <span className="appt-detail-label">Email</span>
                  {appt.client_email}
                </div>
              </div>
            )}
            {appt.client_phone && (
              <div className="appt-detail-item">
                <RiCalendarLine aria-hidden="true" />
                <div>
                  <span className="appt-detail-label">Telefone</span>
                  {appt.client_phone}
                </div>
              </div>
            )}
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
            {/* Futuro em aberto → Editar, Cancelar */}
            {future && derived === APPOINTMENT_STATUS.EM_ABERTO && (
              <>
                <button
                  className="appt-action-btn"
                  disabled={saving}
                  onClick={() => onEdit(appt)}
                >
                  <RiPencilLine aria-hidden="true" />
                  Editar
                </button>
                <button
                  className="appt-action-btn appt-action-btn--cancel"
                  disabled={saving}
                  onClick={() => onCancel(appt.id)}
                >
                  <RiCloseLine aria-hidden="true" />
                  Cancelar
                </button>
              </>
            )}

            {/* Atual em aberto → Confirmar conclusão ou Não compareceu */}
            {past && appt.status === APPOINTMENT_STATUS.EM_ABERTO && (
              <>
                <button
                  className="appt-action-btn appt-action-btn--complete"
                  disabled={saving}
                  onClick={() => onComplete(appt.id)}
                >
                  <RiCheckLine aria-hidden="true" />
                  Confirmar presença
                </button>
                <button
                  className="appt-action-btn appt-action-btn--noshow"
                  disabled={saving}
                  onClick={() => onNoShow(appt.id)}
                >
                  <RiUserUnfollowLine aria-hidden="true" />
                  Não compareceu
                </button>
              </>
            )}

            {/* Concluído → Marcar como Não compareceu */}
            {derived === APPOINTMENT_STATUS.CONCLUIDO && (
              <button
                className="appt-action-btn appt-action-btn--noshow"
                disabled={saving}
                onClick={() => onNoShow(appt.id)}
              >
                <RiUserUnfollowLine aria-hidden="true" />
                Não compareceu
              </button>
            )}

            {/* Não compareceu → Marcar como Concluído */}
            {derived === APPOINTMENT_STATUS.NAO_COMPARECEU && (
              <button
                className="appt-action-btn appt-action-btn--complete"
                disabled={saving}
                onClick={() => onComplete(appt.id)}
              >
                <RiCheckLine aria-hidden="true" />
                Concluído
              </button>
            )}

            {/* Cancelado → Reabrir */}
            {derived === APPOINTMENT_STATUS.CANCELADO && (
              <button
                className="appt-action-btn appt-action-btn--complete"
                disabled={saving}
                onClick={() => onReopen(appt.id)}
              >
                <RiCheckLine aria-hidden="true" />
                Reabrir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Filtros
const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "em_aberto", label: "Próximos" },
  { key: "concluido", label: "Concluídos" },
  { key: "cancelado", label: "Cancelados" },
  { key: "nao_compareceu", label: "Não compareceram" },
];

// Página
export default function BookingsPage() {
  const {
    appointments,
    loading,
    error,
    saving,
    completeAppointment,
    cancelAppointment,
    markNoShow,
    reopenAppointment,
    createAppointment,
    updateAppointment,
    refetch,
  } = useAppointments();

  const { services = [] } = useServices();
  const { business } = useBusiness();

  //  Realtime — novos agendamentos aparecem sem refresh
  const handleRealtimeUpdate = useCallback(() => {
    refetch();
  }, [refetch]);

  useRealtime(business?.id, handleRealtimeUpdate);

  // Navegação por semana
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const weekEnd = getWeekEnd(weekStart);
  const isCurrentWeek =
    getWeekStart(new Date()).toDateString() === weekStart.toDateString();

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  }
  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  }
  function goToThisWeek() {
    setWeekStart(getWeekStart(new Date()));
  }

  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState(null);

  const activeServices = useMemo(
    () => services.filter((s) => s.active),
    [services],
  );

  const clientSuggestions = useMemo(() => {
    const map = new Map();
    appointments.forEach((a) => {
      if (!a.client_email || map.has(a.client_email)) return;
      map.set(a.client_email, {
        client_name: a.client_name,
        client_email: a.client_email,
        client_phone: a.client_phone,
      });
    });
    return Array.from(map.values());
  }, [appointments]);

  // Filtra por semana → estado → pesquisa
  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const apptUtc = new Date(a.starts_at);
      // Cria uma data baseada nos números literais do UTC do agendamento
      const d = new Date(
        apptUtc.getUTCFullYear(),
        apptUtc.getUTCMonth(),
        apptUtc.getUTCDate(),
        apptUtc.getUTCHours(),
        apptUtc.getUTCMinutes()
      );

      if (d < weekStart || d > weekEnd) return false;
      if (activeFilter !== "all" && resolveStatus(a) !== activeFilter)
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !a.client_name?.toLowerCase().includes(q) &&
          !a.client_email?.toLowerCase().includes(q) &&
          !a.service?.name?.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [appointments, weekStart, weekEnd, activeFilter, search]);

  // Contagens da semana visível
  const counts = useMemo(() => {
    const base = appointments.filter((a) => {
      const apptUtc = new Date(a.starts_at);
      const d = new Date(
        apptUtc.getUTCFullYear(),
        apptUtc.getUTCMonth(),
        apptUtc.getUTCDate(),
        apptUtc.getUTCHours(),
        apptUtc.getUTCMinutes()
      );
      return d >= weekStart && d <= weekEnd;
    });
    const c = { all: base.length };
    base.forEach((a) => {
      const s = resolveStatus(a);
      c[s] = (c[s] || 0) + 1;
    });
    return c;
  }, [appointments, weekStart, weekEnd]);

  async function handleModalSubmit(payload) {
    if (modalState?.mode === "edit") {
      const result = await updateAppointment(
        modalState.appointment.id,
        payload,
      );
      if (result.success) setModalState(null);
      return result;
    }
    const result = await createAppointment(payload);
    if (result.success) setModalState(null);
    return result;
  }

  return (
    <div className="db-page">
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Gestão de agendamentos</h1>
          <p className="pg-subtitle">
            Cria, edita e gere todos os teus agendamentos.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() =>
            setModalState({ mode: "create", initialDate: new Date() })
          }
        >
          <RiAddLine aria-hidden="true" />
          Novo agendamento
        </button>
      </div>

      {error && <p className="sch-error">{error}</p>}

      {/* Navegação por semana + pesquisa */}
      <div className="bkg-toolbar">
        <div className="bkg-week-nav">
          <button
            className="appt-nav-btn"
            onClick={prevWeek}
            aria-label="Semana anterior"
          >
            <RiArrowLeftSLine aria-hidden="true" />
          </button>
          <span className="bkg-week-label">{formatWeekLabel(weekStart)}</span>
          <button
            className="appt-nav-btn"
            onClick={nextWeek}
            aria-label="Semana seguinte"
          >
            <RiArrowRightSLine aria-hidden="true" />
          </button>
          {!isCurrentWeek && (
            <button
              className="btn-secondary"
              onClick={goToThisWeek}
              style={{ height: 32, padding: "0 12px" }}
            >
              Esta semana
            </button>
          )}
        </div>

        <div className="bkg-search">
          <RiSearchLine className="bkg-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="bkg-search-input"
            placeholder="Pesquisar cliente, serviço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Filtros de estado */}
      <div className="appt-filters" style={{ marginBottom: 16 }}>
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

      {/* Lista */}
      <div className="pg-section" style={{ padding: 16 }}>
        {loading ? (
          <div className="appt-loading">A carregar agendamentos...</div>
        ) : filtered.length === 0 ? (
          <div className="pg-empty">
            <RiCalendarLine className="pg-empty-icon" aria-hidden="true" />
            <p className="pg-empty-text">Sem agendamentos nesta semana.</p>
            <p className="pg-empty-subtext">
              Navega para outra semana ou cria um novo agendamento.
            </p>
          </div>
        ) : (
          <div className="appt-list">
            {filtered.map((appt) => (
              <BookingCard
                key={appt.id}
                appt={appt}
                saving={saving}
                onComplete={completeAppointment}
                onCancel={cancelAppointment}
                onNoShow={markNoShow}
                onReopen={reopenAppointment}
                onEdit={(appt) =>
                  setModalState({ mode: "edit", appointment: appt })
                }
              />
            ))}
          </div>
        )}
      </div>

      {modalState && (
        <AppointmentFormModal
          mode={modalState.mode}
          appointment={modalState.appointment}
          initialDate={modalState.initialDate}
          services={activeServices}
          clients={clientSuggestions}
          appointments={appointments}
          saving={saving}
          onClose={() => setModalState(null)}
          onSubmit={handleModalSubmit}
        />
      )}
    </div>
  );
}
