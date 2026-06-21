// src/pages/dashboard/Appointments.jsx

import { useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { useAppointments } from "../../hooks/useAppointments";
import CalendarView from "../../components/service-panel/CalendarView";
import "./Dashboard.css";

const AVATAR_COLORS = [
  { bg: "#EEEDFE", color: "#534AB7" },
  { bg: "#E1F5EE", color: "#0F6E56" },
  { bg: "#FAECE7", color: "#993C1D" },
  { bg: "#E6F1FB", color: "#185FA5" },
  { bg: "#FBEAF0", color: "#993556" },
  { bg: "#EAF3DE", color: "#3B6D11" },
];
const TIME_BAR_COLORS = ["#7F77DD", "#1D9E75", "#D85A30", "#378ADD", "#D4537E", "#639922"];

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}
function getColorIndex(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return hash % AVATAR_COLORS.length;
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}
function getDurationMinutes(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 60000);
}

function DayAppointmentCard({ appt }) {
  const idx = getColorIndex(appt.client_name || appt.id);
  const avatarStyle = AVATAR_COLORS[idx];
  const barColor = TIME_BAR_COLORS[idx];
  const startTime = formatTime(appt.starts_at);
  const endTime = formatTime(appt.ends_at);
  const duration = getDurationMinutes(appt.starts_at, appt.ends_at);
  const price = appt.service?.price != null
    ? Number(appt.service.price).toLocaleString("pt-PT", { style: "currency", currency: "EUR" })
    : "—";

  const statusColors = {
    em_aberto: { bg: "#FEF9EC", color: "#92620A", label: "Próximo" },
    concluido: { bg: "#E1F5EE", color: "#0F6E56", label: "Concluído" },
    cancelado: { bg: "#FCEBEB", color: "#A32D2D", label: "Cancelado" },
  };
  const statusStyle = statusColors[appt.status] ?? statusColors.em_aberto;

  return (
    <div className="appt-day-card" style={{ opacity: appt.status === "cancelado" ? 0.6 : 1 }}>
      <div className="appt-day-card-body">
        {/* Barra de cor lateral */}
        <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: barColor, flexShrink: 0 }} />

        {/* Avatar */}
        <div className="appt-avatar" style={{ ...avatarStyle, flexShrink: 0 }}>
          {getInitials(appt.client_name)}
        </div>

        {/* Info principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="appt-item-name" style={{ marginBottom: 2 }}>{appt.client_name}</div>
          <div className="appt-time-text">{startTime} – {endTime}</div>
          <div className="appt-time-sub">{appt.service?.name} ⏱ {duration} min</div>
        </div>

        {/* Preço + status */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span className="appt-item-price">{price}</span>
          <span className="appt-status-pill" style={{ background: statusStyle.bg, color: statusStyle.color }}>
            {statusStyle.label}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Appointments() {
  const { appointments, loading, error } = useAppointments();

  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  function handleNavigate(direction) {
    const next = new Date(date);
    if (view === "month") next.setMonth(next.getMonth() + direction);
    else if (view === "week") next.setDate(next.getDate() + direction * 7);
    else next.setDate(next.getDate() + direction);
    setDate(next);
  }

  function goToToday() {
    const today = new Date();
    setDate(today);
    setSelectedDate(today);
    setView("day");
  }

  function handleSelectEvent(appt) {
    setSelectedDate(new Date(appt.starts_at));
    if (view !== "month") {
      setDate(new Date(appt.starts_at));
      setView("day");
    }
  }

  function handleSelectSlot(start) {
    setSelectedDate(new Date(start));
    if (view === "day") setDate(new Date(start));
  }

  const periodLabel = date.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const sidebarTitle = isToday
    ? "Hoje"
    : selectedDate.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" });

  const sidebarAppointments = appointments.filter(
    (a) => new Date(a.starts_at).toDateString() === selectedDate.toDateString()
  );

  return (
    <div className="db-page db-page--wide">
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Agenda</h1>
          <p className="pg-subtitle">Consulta os teus agendamentos no calendário.</p>
        </div>
      </div>

      {error && <p className="sch-error">{error}</p>}

      <div className="appt-nav" style={{ marginBottom: 16 }}>
        <button className="appt-nav-btn" onClick={() => handleNavigate(-1)} aria-label="Período anterior">
          <RiArrowLeftSLine aria-hidden="true" />
        </button>
        <span className="appt-nav-label">{periodLabel}</span>
        <button className="appt-nav-btn" onClick={() => handleNavigate(1)} aria-label="Próximo período">
          <RiArrowRightSLine aria-hidden="true" />
        </button>
        <button className="btn-secondary" onClick={goToToday}>Hoje</button>
        <button
          className={`btn-secondary ${view === "month" ? "btn-secondary--active" : ""}`}
          onClick={() => setView("month")}
        >
          Mês
        </button>
      </div>

      <div className="appt-layout">
        <div className="appt-calendar-panel" style={{ height: view === "day" ? "820px" : "600px", display: "flex", flexDirection: "column" }}>
          {loading ? (
            <div className="appt-loading">A carregar agendamentos...</div>
          ) : (
            <CalendarView
              appointments={appointments}
              view={view}
              date={date}
              onViewChange={setView}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
            />
          )}
        </div>

        <div className="appt-sidebar-panel">
          <h2 className="appt-sidebar-title" style={{ textTransform: "capitalize", marginBottom: 16 }}>
            {sidebarTitle}
          </h2>
          {loading ? (
            <div className="appt-loading">A carregar...</div>
          ) : sidebarAppointments.length === 0 ? (
            <p className="appt-empty">Sem agendamentos neste dia.</p>
          ) : (
            <div className="appt-list">
              {sidebarAppointments.map((appt) => (
                <DayAppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}