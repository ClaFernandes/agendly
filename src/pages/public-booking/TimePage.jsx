// src/pages/public-booking/TimePage.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { generateSlots, filterAvailableSlots } from "../../lib/slots";
import { supabase } from "../../lib/supabase";

export default function TimePage() {
  const navigate = useNavigate();
  const {
    business,
    selectedService,
    selectedDate,
    selectedTime,
    setSelectedTime,
  } = useBooking();
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    async function loadAvailableTimes() {
      if (!business || !selectedService || !selectedDate) return;
      setLoadingSlots(true);

      // 1. Gera todos os blocos teóricos baseado no expediente da empresa
      // Exemplo padrão: 08:00 às 18:00 caso não haja tabela dinâmica de horários ainda
      const allPossibleSlots = generateSlots(
        business.start_time || "08:00",
        business.end_time || "18:00",
        selectedService.duration_min,
      );

      // 2. Busca no Supabase agendamentos existentes neste dia para este negócio
      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("starts_at")
        .eq("business_id", business.id)
        .gte("starts_at", `${selectedDate}T00:00:00`)
        .lte("starts_at", `${selectedDate}T23:59:59`);

      if (error) {
        console.error("Erro ao buscar agendamentos:", error.message);
        setSlots([]);
      } else {
        // 3. Aplica o filtro desenvolvido pelo seu colega de equipe
        const filtered = filterAvailableSlots(
          allPossibleSlots,
          appointments || [],
        );
        setSlots(filtered);
      }
      setLoadingSlots(false);
    }

    loadAvailableTimes();
  }, [business, selectedService, selectedDate]);

  const handleSelectTime = (time) => {
    setSelectedTime(time);
    navigate("../form");
  };

  const morningSlots = slots.filter((s) => s.time < "12:00");
  const afternoonSlots = slots.filter((s) => s.time >= "12:00");

  if (loadingSlots) return <div>A procurar horários disponíveis...</div>;

  return (
    <div className="time-page-container">
      <h2>Escolha o Horário</h2>

      <div className="time-section">
        <h3>🌅 Manhã</h3>
        <div className="time-grid">
          {morningSlots.map((slot) => (
            <button
              key={slot.time}
              className={`time-slot-btn ${selectedTime === slot.time ? "selected" : ""}`}
              disabled={!slot.available}
              onClick={() => handleSelectTime(slot.time)}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>

      <div className="time-section">
        <h3>☀️ Tarde</h3>
        <div className="time-grid">
          {afternoonSlots.map((slot) => (
            <button
              key={slot.time}
              className={`time-slot-btn ${selectedTime === slot.time ? "selected" : ""}`}
              disabled={!slot.available}
              onClick={() => handleSelectTime(slot.time)}
            >
              {slot.time}
            </button>
          ))}
        </div>
      </div>

      <Link to="../date" className="back-btn">
        ← Voltar
      </Link>
    </div>
  );
}
