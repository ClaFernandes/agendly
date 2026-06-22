// src/pages/dashboard/Appointments.jsx

import { useState, useMemo, useEffect, useRef } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCalendarLine } from "react-icons/ri";
import { useAppointments } from "../../hooks/useAppointments";
import CalendarView from "../../components/service-panel/CalendarView";
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
const TIME_BAR_COLORS = ["#7F77DD", "#1D9E75", "#D85A30", "#378ADD", "#D4537E", "#639922"];

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}
function getColorIndex(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h += name.charCodeAt(i);
  return h % AVATAR_COLORS.length;
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("pt-PT", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });
}
function getDurationMinutes(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 60000);
}
// Mobile - helper para comparar datas ignorando timezone
function sameUTCDay(isoStr, localDate) {
  const d = new Date(isoStr);
  return (
    d.getUTCFullYear() === localDate.getFullYear() &&
    d.getUTCMonth() === localDate.getMonth() &&
    d.getUTCDate() === localDate.getDate()
  );
}

// DayAppointmentCard 
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
    nao_compareceu: { bg: "#F5F3FF", color: "#7C3AED", label: "Faltou" },
  };
  const st = statusColors[appt.status] ?? statusColors.em_aberto;

  return (
    <div className="appt-day-card" style={{ opacity: appt.status === "cancelado" ? 0.6 : 1 }}>
      <div className="appt-day-card-body">
        <div style={{ width: 3, alignSelf: "stretch", borderRadius: 2, background: barColor, flexShrink: 0 }} />
        <div className="appt-avatar" style={{ ...avatarStyle, flexShrink: 0 }}>
          {getInitials(appt.client_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="appt-item-name" style={{ marginBottom: 2 }}>{appt.client_name}</div>
          <div className="appt-time-text">{startTime} – {endTime}</div>
          <div className="appt-time-sub">{appt.service?.name} · {duration} min</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          <span className="appt-item-price">{price}</span>
          <span className="appt-status-pill" style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
      </div>
    </div>
  );
}

// Mobile - Substitui o react-big-calendar em ecrãs ≤ 600px
const DAY_LABELS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

function MobileWeekStrip({ weekStart, selectedDate, onSelectDate, appointmentsByDate }) {
  const scrollRef = useRef(null);

  // 7 dias a partir da segunda-feira da semana actual
  const days = useMemo(() => (
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    })
  ), [weekStart]);

  // scroll automático para o dia seleccionado
  useEffect(() => {
    if (!scrollRef.current) return;
    const idx = days.findIndex(d => d.toDateString() === selectedDate.toDateString());
    if (idx >= 0) {
      scrollRef.current.children[idx]?.scrollIntoView({
        behavior: "smooth", inline: "center", block: "nearest",
      });
    }
  }, [selectedDate, days]);

  const today = new Date();

  return (
    <div className="appt-week-strip-wrapper">
      <div className="appt-week-strip" ref={scrollRef}>
        {days.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          const isSelected = d.toDateString() === selectedDate.toDateString();
          const count = appointmentsByDate[d.toDateString()]?.length ?? 0;

          return (
            <button
              key={i}
              className={[
                "appt-strip-day",
                isSelected ? "appt-strip-day--active" : "",
                isToday ? "appt-strip-day--today" : "",
              ].join(" ").trim()}
              onClick={() => onSelectDate(new Date(d))}
            >
              <span className="appt-strip-weekday">{DAY_LABELS_SHORT[d.getDay()]}</span>
              <span className="appt-strip-num">{d.getDate()}</span>
              {/* [MOBILE] ponto indicador de agendamentos */}
              {count > 0 && <span className="appt-strip-dot" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Página principal 
export default function Appointments() {
  const { appointments, loading, error } = useAppointments();

  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Detecta se é mobile para escolher que render usar
  const [mobile, setMobile] = useState(() => window.innerWidth <= 600);
  useEffect(() => {
    function onResize() { setMobile(window.innerWidth <= 600); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Navegação desktop 
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
    if (!mobile) setView("day");
  }

  function handleSelectEvent(appt) {
    setSelectedDate(new Date(appt.starts_at));
    if (!mobile && view !== "month") {
      setDate(new Date(appt.starts_at));
      setView("day");
    }
  }

  function handleSelectSlot(start) {
    setSelectedDate(new Date(start));
    if (!mobile && view === "day") setDate(new Date(start));
  }

  // Início da semana (segunda-feira)
  const mobileWeekStart = useMemo(() => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    d.setHours(0, 0, 0, 0);
    return d;
  }, [date]);

  function mobilePrevWeek() {
    const d = new Date(date); d.setDate(d.getDate() - 7); setDate(d);
  }
  function mobileNextWeek() {
    const d = new Date(date); d.setDate(d.getDate() + 7); setDate(d);
  }

  // Index de agendamentos por data 
  const appointmentsByDate = useMemo(() => {
    const map = {};
    appointments.forEach(a => {
      const raw = new Date(a.starts_at);
      const key = new Date(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate()).toDateString();
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [appointments]);

  // Agendamentos do dia seleccionado — partilhado entre desktop e mobile 
  const dayAppointments = useMemo(() => (
    appointments
      .filter(a => sameUTCDay(a.starts_at, selectedDate))
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
  ), [appointments, selectedDate]);

  // Labels
  const periodLabel = date.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const sidebarTitle = isToday
    ? "Hoje"
    : selectedDate.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" });

  // Label da semana (ex: "16 jun – 22 jun")
  const mobileWeekLabel = useMemo(() => {
    const end = new Date(mobileWeekStart);
    end.setDate(end.getDate() + 6);
    const fmt = d => d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
    return `${fmt(mobileWeekStart)} – ${fmt(end)}`;
  }, [mobileWeekStart]);

  // Mobile - react-big-calendar NÃO é renderizado em mobile porque:
  // ocupa muito espaço vertical
  // interacção touch é difícil (scroll conflitua com a página)
  // a faixa de dias é muito mais rápida de usar no telemóvel
  if (mobile) {
    return (
      <div className="db-page">
        <div className="pg-header">
          <div>
            <h1 className="pg-title">Agenda</h1>
            <p className="pg-subtitle">Consulta os teus agendamentos.</p>
          </div>
        </div>

        {error && <p className="sch-error">{error}</p>}

        {/* Mobile - navegação de semana compacta */}
        <div className="appt-mobile-week-nav">
          <button className="appt-nav-btn" onClick={mobilePrevWeek} aria-label="Semana anterior">
            <RiArrowLeftSLine aria-hidden="true" />
          </button>
          <span className="appt-mobile-week-label">{mobileWeekLabel}</span>
          <button className="appt-nav-btn" onClick={mobileNextWeek} aria-label="Semana seguinte">
            <RiArrowRightSLine aria-hidden="true" />
          </button>
          <button className="btn-secondary appt-today-btn" onClick={goToToday}>Hoje</button>
        </div>

        {/* Mobile - faixa de 7 dias clicáveis */}
        <MobileWeekStrip
          weekStart={mobileWeekStart}
          selectedDate={selectedDate}
          onSelectDate={d => { setSelectedDate(d); setDate(d); }}
          appointmentsByDate={appointmentsByDate}
        />

        {/* Mobile - lista do dia seleccionado */}
        <div className="appt-mobile-day-section">
          <h2 className="appt-mobile-day-title" style={{ textTransform: "capitalize" }}>
            {sidebarTitle}
          </h2>

          {loading ? (
            <div className="appt-loading">A carregar...</div>
          ) : dayAppointments.length === 0 ? (
            <div className="pg-empty" style={{ padding: "24px 0" }}>
              <RiCalendarLine className="pg-empty-icon" aria-hidden="true" />
              <p className="pg-empty-text">Sem agendamentos neste dia.</p>
            </div>
          ) : (
            <div className="appt-list">
              {dayAppointments.map(appt => (
                <DayAppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render desktop — calendário react-big-calendar + sidebar
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
        <div
          className="appt-calendar-panel"
          style={{ height: view === "day" ? "820px" : "600px", display: "flex", flexDirection: "column" }}
        >
          {loading
            ? <div className="appt-loading">A carregar agendamentos...</div>
            : <CalendarView
              appointments={appointments}
              view={view}
              date={date}
              onViewChange={setView}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
            />
          }
        </div>

        <div className="appt-sidebar-panel">
          <h2 className="appt-sidebar-title" style={{ textTransform: "capitalize", marginBottom: 16 }}>
            {sidebarTitle}
          </h2>
          {loading ? (
            <div className="appt-loading">A carregar...</div>
          ) : dayAppointments.length === 0 ? (
            <p className="appt-empty">Sem agendamentos neste dia.</p>
          ) : (
            <div className="appt-list">
              {dayAppointments.map(appt => (
                <DayAppointmentCard key={appt.id} appt={appt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
