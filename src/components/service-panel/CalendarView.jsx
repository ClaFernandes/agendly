// src/components/service-panel/CalendarView.jsx

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import { STATUS_CONFIG } from "../../hooks/useAppointments";

// Configura o localizer com date-fns e locale português
const locales = { pt };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Segunda-feira
  getDay,
  locales,
});

// Mensagens em português para o calendário
const messages = {
  allDay: "Dia inteiro",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Lista",
  date: "Data",
  time: "Hora",
  event: "Agendamento",
  noEventsInRange: "Sem agendamentos neste período.",
  showMore: (total) => `+${total} mais`,
};

export default function CalendarView({
  appointments,
  view,
  onViewChange,
  onSelectEvent,
  onNavigate,
  date,
}) {
  // Converte os agendamentos para o formato que o react-big-calendar espera
  const events = useMemo(
    () =>
      appointments.map((appt) => ({
        id: appt.id,
        title: `${appt.client_name} · ${appt.service?.name ?? ""}`,
        start: new Date(appt.starts_at),
        end: new Date(appt.ends_at),
        resource: appt, // guarda o objecto original para acesso no onSelectEvent
        status: appt.status,
      })),
    [appointments],
  );

  // Estilo de cada evento baseado no estado do agendamento
  function eventStyleGetter(event) {
    const config = STATUS_CONFIG[event.status] ?? {};
    return {
      style: {
        backgroundColor: config.bg ?? "var(--color-primary-100)",
        color: config.color ?? "var(--color-primary-700)",
        border: `1px solid ${config.color ?? "var(--color-primary-300)"}`,
        borderRadius: "var(--radius-md)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        padding: "2px 6px",
      },
    };
  }

  return (
    <div className="calendar-wrapper">
      <Calendar
        localizer={localizer}
        events={events}
        view={view}
        date={date}
        onView={onViewChange}
        onNavigate={onNavigate}
        onSelectEvent={(event) => onSelectEvent?.(event.resource)}
        eventPropGetter={eventStyleGetter}
        messages={messages}
        culture="pt"
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 22, 0, 0)}
        toolbar={false}
      />
    </div>
  );
}
