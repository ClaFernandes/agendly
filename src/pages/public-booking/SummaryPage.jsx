// src/pages/public-booking/SummaryPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function SummaryPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dados mockados consolidando o que foi escolhido nas etapas anteriores
  const mockSummaryData = {
    business_name: 'Barbearia Premium',
    service: {
      name: 'Corte de Cabelo Masculino',
      duration_min: 30,
      price: 50.00
    },
    appointment: {
      date: '2026-06-10', // Formato ISO vindo do DatePage
      time: '14:00',
    },
    client: {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '(11) 99999-9999',
      notes: 'Gostaria de cortar com a máquina 2 nas laterais.'
    }
  };

  // Formatação amigável da data para o cliente
  const formatFriendlyDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const handleConfirmAppointment = async () => {
    setIsSubmitting(true);
    
    // Simula a requisição ao Supabase (ex: supabase.from('appointments').insert(...))
    setTimeout(() => {
      setIsSubmitting(false);
      console.log('Agendamento gravado com sucesso no Supabase!');
      
      // Redireciona para a página final de sucesso/confirmação
      navigate('../confirm');
    }, 1500);
  };

  const data = mockSummaryData;

  return (
    <div className="summary-page-container">
      <div className="page-header">
        <h2>Confirme seu Agendamento</h2>
        <p>Revise as informações abaixo antes de finalizar a reserva.</p>
      </div>

      <div className="summary-card">
        {/* Detalhes do Profissional/Empresa */}
        <div className="summary-section text-center">
          <span className="summary-business-tag">Você vai agendar em</span>
          <h3>{data.business_name}</h3>
        </div>

        {/* Detalhes do Serviço */}
        <div className="summary-section">
          <h4>Serviço Selecionado</h4>
          <div className="summary-row-item">
            <div>
              <p className="item-title">{data.service.name}</p>
              <p className="item-subtitle">⏱ {data.service.duration_min} minutos</p>
            </div>
            <span className="item-price">
              {data.service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        {/* Detalhes de Data e Hora */}
        <div className="summary-section">
          <h4>Data e Horário</h4>
          <div className="summary-datetime-box">
            <p>📅 <span className="capitalize">{formatFriendlyDate(data.appointment.date)}</span></p>
            <p>⏰ <strong>{data.appointment.time} às 14:30</strong></p>
          </div>
        </div>

        {/* Seus Dados */}
        <div className="summary-section">
          <h4>Seus Dados</h4>
          <div className="summary-client-box">
            <p><strong>Nome:</strong> {data.client.name}</p>
            <p><strong>Telefone:</strong> {data.client.phone}</p>
            <p><strong>E-mail:</strong> {data.client.email}</p>
            {data.client.notes && (
              <p className="summary-notes"><strong>Obs:</strong> "{data.client.notes}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="summary-actions">
        <Link to="../form" className="back-btn" disabled={isSubmitting}>
          ← Corrigir Dados
        </Link>
        <button 
          onClick={handleConfirmAppointment} 
          className="confirm-booking-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento ✓'}
        </button>
      </div>
    </div>
  );
}
