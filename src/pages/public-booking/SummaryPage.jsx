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

    // Cria a data de INÍCIO correta baseada no fuso local do navegador
    const startsAtDate = new Date(`${selectedDate}T${selectedTime}:00`);

    // Calcula a data de FIM somando os minutos de duração do serviço
    const endsAtDate = new Date(startsAtDate.getTime() + selectedService.duration_min * 60000);

    try {
      const { error } = await supabase.from("appointments").insert({
        business_id: business.id,
        service_id: selectedService.id,
        starts_at: startsAtDate.toISOString(), // Envia UTC seguro para o Postgres
        ends_at: endsAtDate.toISOString(),     // Fundamental para o filtro de colisão
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
