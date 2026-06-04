import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const TempSlots = [
  { time: '08:00', available: true },
  { time: '08:30', available: false },
  { time: '09:00', available: true },
  { time: '09:30', available: true },
  { time: '10:00', available: true },
  { time: '10:30', available: false },
];

export default function TimePage() {
  const navigate = useNavigate();
  const [selectedTime, setSelectedTime] = useState('');


  const handleSelectTime = (time) => {
    setSelectedTime(time);
    console.log('Horário selecionado:', time);
    
    // Avança para a tela de formulário dos dados do cliente
    navigate('../form');
  };

  return (
    <div>
      <div>
        <h2>Escolha o Horário</h2>
        <p>Selecione um dos horários disponíveis para o dia escolhido.</p>
      </div>

      <div >
        <h3> horarios</h3>
        <div >
          {TempSlots.map((slot) => (
            <button
              key={slot.time}
              type="button"
              disabled={!slot.available}
              onClick={() => handleSelectTime(slot.time)}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>    

      <div>
        <Link to="../date" > Voltar para a Data</Link>
      </div>
    </div>
  );
}