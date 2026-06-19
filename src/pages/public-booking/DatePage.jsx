// src/pages/public-booking/DatePage.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { supabase } from "../../lib/supabase";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

export default function DatePage() {
  const navigate = useNavigate();
  const { business, selectedDate, setSelectedDate } = useBooking();

  // Guarda o mês/ano que o utilizador está a visualizar no calendário
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  // Guarda quais os dias da semana (0-6) que o estabelecimento está ativo
  const [activeDaysOfWeek, setActiveDaysOfWeek] = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Limpa horas para comparação justa de dias passados

  // Limite de navegação: Atual + 2 meses para a frente
  const minMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxMonthDate = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  // Procura quais os dias da semana que o negócio realmente abre
  useEffect(() => {
    async function loadBusinessConfig() {
      if (!business?.id) return;
      try {
        const { data, error } = await supabase
          .from("working_hours")
          .select("day_of_week")
          .eq("business_id", business.id)
          .eq("is_active", true);

        if (error) throw error;

        // Guarda uma lista única de números dos dias que abrem (ex: [1, 2, 3, 4, 5])
        const openDays = data.map((item) => item.day_of_week);
        setActiveDaysOfWeek(openDays);
      } catch (err) {
        console.error("Erro ao carregar dias ativos:", err.message);
      } finally {
        setLoadingConfig(false);
      }
    }
    loadBusinessConfig();
  }, [business]);

  const viewYear = currentViewDate.getFullYear();
  const viewMonth = currentViewDate.getMonth();

  // Controladores das setas do topo
  const handlePrevMonth = () => {
    const prev = new Date(viewYear, viewMonth - 1, 1);
    if (prev >= minMonthDate) setCurrentViewDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(viewYear, viewMonth + 1, 1);
    if (next <= maxMonthDate) setCurrentViewDate(next);
  };

  // Construção da Matriz do Calendário (Alinhada à Segunda-feira)
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  // No JS: 0=Dom, 1=Seg, 2=Ter... Queremos transformar para: 0=Seg, 1=Ter... 6=Dom
  let startDayIndex = firstDayOfMonth.getDay() - 1;
  if (startDayIndex === -1) startDayIndex = 6; // Se for Domingo, passa a ser o índice 6

  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Gera array final de células
  const calendarCells = [];

  // Preenche os quadradinhos vazios do início do mês (dias do mês anterior)
  for (let i = 0; i < startDayIndex; i++) {
    calendarCells.push({ isBlank: true, key: `blank-${i}` });
  }

  // Preenche os dias reais do mês corrente
  for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
    const cellDate = new Date(viewYear, viewMonth, dayNum);

    // Gera string local YYYY-MM-DD sem quebra de fuso horário
    const y = cellDate.getFullYear();
    const m = String(cellDate.getMonth() + 1).padStart(2, "0");
    const d = String(cellDate.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    const cellDayOfWeek = cellDate.getDay();

    // Validações de estado do dia
    const isPast = cellDate < today;
    const hasNoHours = !activeDaysOfWeek.includes(cellDayOfWeek);
    const isDisabled = isPast || hasNoHours;

    calendarCells.push({
      isBlank: false,
      key: dateStr,
      dateStr,
      dayNum,
      isPast,
      hasNoHours,
      isDisabled,
    });
  }

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    navigate("../time");
  };

  const monthLabel = currentViewDate.toLocaleDateString("pt-PT", {
    month: "long"
  });

  const isPrevDisabled = new Date(viewYear, viewMonth - 1, 1) < minMonthDate;
  const isNextDisabled = new Date(viewYear, viewMonth + 1, 1) > maxMonthDate;

  if (loadingConfig) return <div className="loading-calendar">A carregar calendário...</div>;

  return (
    <div className="date-page-container">
      <div className="page-header">
        <h2>Qual dia preferes?</h2>
        <p>Seleciona o melhor dia para o teu atendimento.</p>
      </div>

      {/* Calendário Customizado */}
      <div className="custom-calendar-card">
        {/* Topo / Cabeçalho */}
        <div className="calendar-header">
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
          >
            <FiArrowLeft />
          </button>
          <span className="calendar-month-title">{monthLabel}</span>
          <button
            type="button"
            className="calendar-nav-btn"
            onClick={handleNextMonth}
            disabled={isNextDisabled}
          >
            <FiArrowRight />
          </button>
        </div>

        {/* Dias da Semana fixos (Iniciando na Segunda) */}
        <div className="calendar-weekdays-grid">
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>

        {/* Grelha de Quadradinhos dos Dias */}
        <div className="calendar-days-grid">
          {calendarCells.map((cell) => {
            if (cell.isBlank) {
              return <div key={cell.key} className="calendar-cell blank-cell"></div>;
            }

            const isSelected = selectedDate === cell.dateStr;

            // Determinar a classe de cor conforme o teu requisito
            let statusClass = "";
            if (cell.isPast) statusClass = "past-day";
            else if (cell.hasNoHours) statusClass = "no-hours-day";
            else if (isSelected) statusClass = "selected-day";

            return (
              <button
                key={cell.key}
                type="button"
                className={`calendar-cell day-btn ${statusClass}`}
                disabled={cell.isDisabled}
                onClick={() => handleSelectDate(cell.dateStr)}
                title={cell.hasNoHours && !cell.isPast ? "Sem horários de funcionamento" : ""}
              >
                {cell.dayNum}
              </button>
            );
          })}
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="onboarding-btn-back"
            onClick={() => navigate("../")}
          >
            <FiArrowLeft /> Voltar
          </button>
        </div>
      </div>
    </div>
  );
}