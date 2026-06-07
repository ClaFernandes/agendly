// src/pages/public-booking/TimePage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Simulação de horários vindos da lib/slots filtrados pelos já agendados
const MOCK_SLOTS = [
  { time: '08:00', available: true },
  { time: '08:30', available: false }, // Ocupado
  { time: '09:00', available: true },
  { time: '09:30', available: true },
  { time: '10:00', available: true },
  { time: '10:30', available: false }, // Ocupado
  { time: '11:00', available: true },
  { time: '11:30', available: true },
  { time: '14:00', available: true },
  { time: '14:30', available: true },
  { time: '15:00', available: true },
  { time: '15:30', available: false }, // Ocupado
  { time: '16:00', available: true },
  { time: '16:30', available: true },
  { time: '17:00', available: true },
];

export default function TimePage() {
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState('');

  // Separa os horários por turno para organizar a tela
  const morningSlots = MOCK_SLOTS.filter(slot => slot.time < '12:00');
  const afternoonSlots = MOCK_SLOTS.filter(slot => slot.time >= '12:00');

  const handleSelectTime = (time) => {
    setSelectedTime(time);
    console.log('Horário selecionado:', time);
    
    // Avança para a tela de formulário dos dados do cliente
    navigate('../form');
  };

  return (
    <div className="time-page-container">
      <div className="page-header">
        <h2>Escolha o Horário</h2>
        <p>Selecione um dos horários disponíveis para o dia escolhido.</p>
      </div>

      {/* Turno da Manhã */}
      <div className="time-section">
        <h3 className="turno-title">🌅 Manhã</h3>
        <div className="time-grid">
          {morningSlots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              className={`time-slot-btn ${selectedTime === slot.time ? 'selected' : ''}`}
              disabled={!slot.available}
              onClick={() => handleSelectTime(slot.time)}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>

      {/* Turno da Tarde */}
      <div className="time-section">
        <h3 className="turno-title">☀️ Tarde</h3>
        <div className="time-grid">
          {afternoonSlots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              className={`time-slot-btn ${selectedTime === slot.time ? 'selected' : ''}`}
              disabled={!slot.available}
              onClick={() => handleSelectTime(slot.time)}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>

      {/* Ações de Navegação */}
      <div className="page-actions">
        <Link to="../date" className="back-btn">← Voltar para a Data</Link>
      </div>
    </div>
  );
}