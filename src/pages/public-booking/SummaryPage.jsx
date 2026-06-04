import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function SummaryPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const TempSummaryData = {
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
      phone: '99999-9999',
      notes: 'Gostaria de cortar com a máquina 2 nas laterais.'
    }
  };

  const formatDate = (dateStr) => {
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
    
    setTimeout(() => {
      setIsSubmitting(false);
      console.log('Agendamento gravado com sucesso no Supabase!');
      
      // Redireciona para a página final de sucesso/confirmação
      navigate('../confirm');
    }, 1500);
  };

  const data = TempSummaryData;

  return (
    <div >
      <div >
        <h2>Confirme seu Agendamento</h2>
        <p>Revise as informações abaixo antes de finalizar a reserva.</p>
      </div>

      <div>
        {/* Detalhes do Profissional/Empresa */}
        <div>
          <span>Você vai agendar em</span>
          <h3>{data.business_name}</h3>
        </div>

        {/* Detalhes do Serviço */}
        <div>
          <h4>Serviço Selecionado</h4>
          <div >
            <div>
              <p >{data.service.name}</p>
              <p >{data.service.duration_min} minutos</p>
            </div>
            <span >
              {data.service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>

        {/* Detalhes de Data e Hora */}
        <div >
          <h4>Data e Horário</h4>
          <div >
            <p>📅 <span>{formatDate(data.appointment.date)}</span></p>
            <p>⏰ <strong>{data.appointment.time} às 14:30</strong></p>
          </div>
        </div>

        {/* Seus Dados */}
        <div >
          <h4>Seus Dados</h4>
          <div >
            <p><strong>Nome:</strong> {data.client.name}</p>
            <p><strong>Telefone:</strong> {data.client.phone}</p>
            <p><strong>E-mail:</strong> {data.client.email}</p>
            {data.client.notes && (
              <p ><strong>Obs:</strong> "{data.client.notes}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Botões de Ação */}
      <div >
        <Link to="../form"  disabled={isSubmitting}>
          ← Corrigir Dados
        </Link>
        <button 
          onClick={handleConfirmAppointment} 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Confirmando...' : 'Confirmar Agendamento ✓'}
        </button>
      </div>
    </div>
  );
}