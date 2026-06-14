// src/pages/dashboard/Appointments.jsx

import { useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { useAppointments } from "../../hooks/useAppointments";
import CalendarView from "../../components/service-panel/CalendarView";
import AppointmentList from "../../components/service-panel/AppointmentList";
import "./Dashboard.css";

export default function Appointments() {
  const {
    appointments,
    today,
    loading,
    error,
    saving,
    completeAppointment,
    cancelAppointment,
    reopenAppointment,
  } = useAppointments();

  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());

  // Avança ou recua o período visível, de acordo com a vista activa
  function handleNavigate(direction) {
    const next = new Date(date);
    if (view === "month") {
      next.setMonth(next.getMonth() + direction);
    } else {
      next.setDate(next.getDate() + direction * 7);
    }
    setDate(next);
  }

  function goToToday() {
    setDate(new Date());
  }

  // Ao clicar num agendamento no calendário, centra a vista nesse dia
  function handleSelectEvent(appt) {
    setDate(new Date(appt.starts_at));
  }

  // Label do período actual — ex: "junho de 2026"
  const periodLabel = date.toLocaleDateString("pt-PT", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="db-page db-page--wide">
      {/* Cabeçalho */}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Agenda</h1>
          <p className="pg-subtitle">Consulta e gere os teus agendamentos.</p>
        </div>
      </div>

      {error && <p className="sch-error">{error}</p>}

      {/* Navegação de período */}
      <div className="appt-nav" style={{ marginBottom: 16 }}>
        <button
          className="appt-nav-btn"
          onClick={() => handleNavigate(-1)}
          aria-label="Período anterior"
        >
          <RiArrowLeftSLine aria-hidden="true" />
        </button>
        <span className="appt-nav-label">{periodLabel}</span>
        <button
          className="appt-nav-btn"
          onClick={() => handleNavigate(1)}
          aria-label="Próximo período"
        >
          <RiArrowRightSLine aria-hidden="true" />
        </button>
        <button className="btn-secondary" onClick={goToToday}>
          Hoje
        </button>
      </div>

      {/* Layout: calendário + lista lateral */}
      <div className="appt-layout">
        {/* Calendário */}
        <div
          className="appt-calendar-panel"
          style={{ height: "600px", display: "flex", flexDirection: "column" }}
        >
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
            />
          )}
        </div>

        {/* Lista lateral — agendamentos de hoje */}
        <div className="appt-sidebar-panel">
          <h2 className="appt-sidebar-title">Agendamentos de hoje</h2>
          <AppointmentList
            appointments={today}
            loading={loading}
            saving={saving}
            onComplete={completeAppointment}
            onCancel={cancelAppointment}
            onReopen={reopenAppointment}
          />
        </div>
      </div>
    </div>
  );
}
