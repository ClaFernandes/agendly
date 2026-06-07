import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { supabase } from '../../lib/supabase';

export default function SummaryPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Consome os dados reais inseridos pelo cliente passo a passo
  const { business, selectedService, selectedDate, selectedTime, clientData } = useBooking();

  const handleConfirmAppointment = async () => {
    setIsSubmitting(true);
    
    // Une a Data ("YYYY-MM-DD") e Hora ("HH:MM") num formato Timestamptz legível para o Postgres
    const startsAtTimestamp = `${selectedDate}T${selectedTime}:00Z`;

    try {
      const { error } = await supabase
        .from('appointments')
        .insert({
          business_id: business.id,
          service_id: selectedService.id,
          starts_at: startsAtTimestamp,
          client_name: clientData.client_name,
          client_email: clientData.client_email,
          client_phone: clientData.client_phone,
          notes: clientData.notes,
          status: 'confirmed'
        });

      if (error) throw error;

      // Sucesso! Avança para a página de parabéns
      navigate('../confirm');
    } catch (err) {
      alert("Falha ao salvar agendamento: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="summary-page-container">
      <h2>Confirme seu Agendamento</h2>
      <div className="summary-card">
        <h3>{business?.name}</h3>
        <p><strong>Serviço:</strong> {selectedService?.name} ({selectedService?.price}€)</p>
        <p><strong>Dia:</strong> {selectedDate} às {selectedTime}</p>
        <p><strong>Nome:</strong> {clientData.client_name}</p>
      </div>
      <button onClick={handleConfirmAppointment} disabled={isSubmitting} className="confirm-booking-btn">
        {isSubmitting ? 'A processar...' : 'Confirmar Agendamento ✓'}
      </button>
    </div>
  );
}