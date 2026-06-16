// src/components/service-panel/CalendarView.jsx

import { useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import { STATUS_CONFIG, resolveStatus } from "../../hooks/useAppointments";

const locales = { pt };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

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

function DayEvent({ event }) {
  const startStr = event.start.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endStr = event.end.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const [clientName, serviceName] = event.title.split(" · ");

  return (
    <div className="rbc-day-event-custom">
      <div className="rbc-day-event-name">{clientName}</div>
      <div className="rbc-day-event-time">
        {startStr} – {endStr}
        {serviceName ? ` · ${serviceName}` : ""}
      </div>
    </div>
  );
}

export default function CalendarView({
  appointments,
  view,
  onViewChange,
  onSelectEvent,
  onSelectSlot,
  onNavigate,
  date,
}) {
  const events = useMemo(
    () =>
      appointments.map((appt) => ({
        id: appt.id,
        title: `${appt.client_name} · ${appt.service?.name ?? ""}`,
        start: new Date(appt.starts_at),
        end: new Date(appt.ends_at),
        resource: appt,
        derivedStatus: resolveStatus(appt),
      })),
    [appointments],
  );

  function eventStyleGetter(event) {
    const config = STATUS_CONFIG[event.derivedStatus] ?? STATUS_CONFIG.em_aberto;
    const bg = config.bg;
    const color = config.color;

    if (view === "day" || view === "week") {
      return {
        style: {
          backgroundColor: bg,
          color,
          borderColor: color,
          borderRadius: "var(--radius-md)",
          fontSize: "var(--text-xs)",
          // cancelados ficam com risco no texto
          textDecoration: event.derivedStatus === "cancelado" ? "line-through" : "none",
          opacity: event.derivedStatus === "cancelado" ? 0.6 : 1,
        },
      };
    }

    return {
      style: {
        backgroundColor: bg,
        color,
        border: `0.5px solid ${color}`,
        borderRadius: "var(--radius-md)",
        fontSize: "var(--text-xs)",
        fontWeight: 500,
        padding: "2px 6px",
        opacity: event.derivedStatus === "cancelado" ? 0.5 : 1,
      },
    };
  }

  const components = useMemo(
    () => ({
      day: { event: DayEvent },
      week: { event: DayEvent },
    }),
    [],
  );

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
        onSelectSlot={({ start }) => onSelectSlot?.(start)}
        selectable
        eventPropGetter={eventStyleGetter}
        components={components}
        messages={messages}
        culture="pt"
        startAccessor="start"
        endAccessor="end"
        style={{ height: "100%" }}
        min={new Date(0, 0, 0, 7, 0, 0)}
        max={new Date(0, 0, 0, 22, 0, 0)}
        toolbar={false}
        step={30}
        timeslots={2}
      />
    </div>
  );
}