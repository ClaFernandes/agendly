// src/pages/public-booking/DatePage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function DatePage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');

  // Configuração de datas limite (Hoje até 30 dias para frente)
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 30);

  // Gera uma lista simples com os próximos 14 dias para o cliente escolher rápido
  const generateQuickDays = () => {
    const days = [];
    const tempDate = new Date(today);

    for (let i = 0; i < 14; i++) {
      // Ignora domingos se o negócio fechar (exemplo rápido, controlável pelo banco depois)
      // if (tempDate.getDay() === 0) { ... }

      days.push({
        isoString: tempDate.toISOString().split('T')[0],
        dayNum: tempDate.getDate(),
        month: tempDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
        weekday: tempDate.toLocaleDateString('pt-BR', { weekday: 'short' }).split(',')[0]
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }
    return days;
  };

  const quickDays = generateQuickDays();

  const handleSelectDate = (dateStr) => {
    setSelectedDate(dateStr);
    console.log('Data selecionada:', dateStr);
    
    // Avança para a tela de horários
    navigate('../time');
  };

  return (
    <div className="date-page-container">
      <div className="page-header">
        <h2>Escolha a Data</h2>
        <p>Selecione o melhor dia para o seu atendimento.</p>
      </div>

      {/* Opção 1: Seleção Rápida em Carrossel/Grid (Excelente para Mobile) */}
      <div className="quick-dates-grid">
        {quickDays.map((day) => {
          const isSelected = selectedDate === day.isoString;
          return (
            <button
              key={day.isoString}
              type="button"
              className={`date-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectDate(day.isoString)}
            >
              <span className="date-card-weekday">{day.weekday}</span>
              <span className="date-card-num">{day.dayNum}</span>
              <span className="date-card-month">{day.month}</span>
            </button>
          );
        })}
      </div>

      {/* Opção 2: Input de Data Tradicional para escolher mais à frente */}
      <div className="manual-date-picker">
        <label htmlFor="manual-date">Ou escolha outra data:</label>
        <input
          type="date"
          id="manual-date"
          min={today.toISOString().split('T')[0]}
          max={maxDate.toISOString().split('T')[0]}
          value={selectedDate}
          onChange={(e) => handleSelectDate(e.target.value)}
        />
      </div>

      {/* Ações de Navegação */}
      <div className="page-actions">
        <Link to="../" className="back-btn">← Voltar aos Serviços</Link>
      </div>
    </div>
  );
}
