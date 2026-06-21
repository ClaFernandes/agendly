// src/pages/public-booking/SummaryPage.jsx

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { supabase } from "../../lib/supabase";
import { FiArrowLeft, FiCheck } from "react-icons/fi";

export default function SummaryPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Consome os dados reais inseridos pelo cliente passo a passo
  const { business, selectedService, selectedDate, selectedTime, clientData } =
    useBooking();

  const handleConfirmAppointment = async () => {
  setIsSubmitting(true);

  // 1. Criar os objetos de data baseados na hora local do browser
  const startsAtDate = new Date(`${selectedDate}T${selectedTime}:00`);
  const endsAtDate = new Date(startsAtDate.getTime() + selectedService.duration_min * 60000);

  // 2. Aplicar a Opção B: Forçar o ISO a manter a hora literal pretendida
  const tzOffsetStart = startsAtDate.getTimezoneOffset() * 60000;
  const forcedStartDate = new Date(startsAtDate.getTime() - tzOffsetStart);

  const tzOffsetEnd = endsAtDate.getTimezoneOffset() * 60000;
  const forcedEndDate = new Date(endsAtDate.getTime() - tzOffsetEnd);

  try {
    const { error } = await supabase.from("appointments").insert({
      business_id: business.id,
      service_id: selectedService.id,
      starts_at: forcedStartDate.toISOString(), // Grava a hora exata selecionada
      ends_at: forcedEndDate.toISOString(),     // Grava o fim exato calculado
      client_name: clientData.client_name,
      client_email: clientData.client_email,
      client_phone: clientData.client_phone,
      notes: clientData.notes,
      status: "em_aberto",
    });

    if (error) throw error;
    navigate("../confirm");
  } catch (err) {
    alert("Falha ao salvar agendamento: " + err.message);
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="page-header">
      <h2>Revisa o teu agendamento</h2>
      <div className="summary-card">
        <h3>{business?.name}</h3>
        <p>
          <strong>Serviço:</strong> {selectedService?.name} (
          {selectedService?.price}€)
        </p>
        <p>
          <strong>Dia:</strong> {selectedDate} às {selectedTime}
        </p>
        <p>
          <strong>Nome:</strong> {clientData.client_name}
        </p>
      </div>
      <div className="summary-btns">
        <button
          type="button"
          className="onboarding-btn-back"
          onClick={() => navigate("../form")}
        >
          <FiArrowLeft /> Voltar
        </button>

        <button
          onClick={handleConfirmAppointment}
          disabled={isSubmitting}
          className="confirm-booking-btn"
        >
          {isSubmitting ? "A processar..." : "Confirmar Agendamento"} {<FiCheck />}
        </button>
      </div>
    </div>
  );
}
