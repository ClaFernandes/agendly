// src/pages/public-booking/DatePage.jsx

import { useNavigate, Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext"; // 👈 IMPORTANTE: Adicionámos o contexto

export default function DatePage() {
  const navigate = useNavigate();
  
  // 👈 SUBSTITUÍMOS o useState pelo useBooking para guardar a data globalmente
  const { selectedDate, setSelectedDate } = useBooking();

  // Configuração de datas limite (Hoje até 30 dias para frente)
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);

  // Gera uma lista simples com os próximos 14 dias para o cliente escolher rápido
  const generateQuickDays = () => {
    const days = [];
    const tempDate = new Date(today);

    for (let i = 0; i < 14; i++) {
      // 1. Extraímos Ano, Mês e Dia do fuso LOCAL (do cliente)
      const year = tempDate.getFullYear();
      const month = String(tempDate.getMonth() + 1).padStart(2, "0"); // +1 porque Janeiro é 0
      const day = String(tempDate.getDate()).padStart(2, "0");
      
      const localIsoString = `${year}-${month}-${day}`;

      days.push({
        isoString: localIsoString, // Usamos a nossa string formatada localmente
        dayNum: tempDate.getDate(),
        month: tempDate
          .toLocaleDateString("pt-BR", { month: "short" })
          .replace(".", ""),
        weekday: tempDate
          .toLocaleDateString("pt-BR", { weekday: "short" })
          .split(",")[0],
      });
      
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return days;
  };

  const quickDays = generateQuickDays();

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr); // Agora guarda no contexto global!
    console.log("Data guardada no Contexto:", dateStr);

    // Avança para a tela de horários
    navigate("../time");
  };

  return (
    <div className="date-page-container">
      <div className="page-header">
        <h2>Escolha a Data</h2>
        <p>Selecione o melhor dia para o seu atendimento.</p>
      </div>

      {/* Opção 1: Seleção Rápida em Carrossel/Grid */}
      <div className="quick-dates-grid">
        {quickDays.map((day) => {
          const isSelected = selectedDate === day.isoString;
          return (
            <button
              key={day.isoString}
              type="button"
              className={`date-card ${isSelected ? "selected" : ""}`}
              onClick={() => handleSelectDate(day.isoString)}
            >
              <span className="date-card-weekday">{day.weekday}</span>
              <span className="date-card-num">{day.dayNum}</span>
              <span className="date-card-month">{day.month}</span>
            </button>
          );
        })}
      </div>

      {/* Opção 2: Input de Data Tradicional */}
      <div className="manual-date-picker">
        <label htmlFor="manual-date">Ou escolha outra data:</label>
        <input
          type="date"
          id="manual-date"
          min={today.toISOString().split("T")[0]}
          max={maxDate.toISOString().split("T")[0]}
          value={selectedDate || ""} // Garante que não dá erro se for null
          onChange={(e) => handleSelectDate(e.target.value)}
        />
      </div>

      {/* Ações de Navegação */}
      <div className="page-actions">
        <Link to="../" className="back-btn">
          ← Voltar aos Serviços
        </Link>
      </div>
    </div>
  );
}