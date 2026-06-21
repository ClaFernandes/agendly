// src/pages/public-booking/TimePage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { generateSlots, filterAvailableSlots } from "../../lib/slots";
import { supabase } from "../../lib/supabase";
import { FiArrowLeft } from "react-icons/fi";

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

      try {
        const dateObj = new Date(`${selectedDate}T00:00:00`);
        const dayOfWeek = dateObj.getDay();

        // Busca todos os turnos para aquele dia
        const { data: hoursData, error: hoursError } = await supabase
          .from("working_hours")
          .select("start_time, end_time")
          .eq("business_id", business.id)
          .eq("day_of_week", dayOfWeek)
          .eq("is_active", true);

        if (hoursError) throw hoursError;

        if (!hoursData || hoursData.length === 0) {
          setSlots([]);
          return;
        }

        // Gera slots para cada turno e juntamos tudo numa lista só
        let allPossibleSlots = [];
        hoursData.forEach((turno) => {
          const turnoSlots = generateSlots(
            turno.start_time,
            turno.end_time,
            selectedService.duration_min,
          );
          allPossibleSlots = [...allPossibleSlots, ...turnoSlots];
        });

        // Buscar agendamentos existentes
        const startOfDay = new Date(`${selectedDate}T00:00:00`).toISOString();
        const endOfDay = new Date(`${selectedDate}T23:59:59`).toISOString();

        const { data: appointments, error: apptError } = await supabase
          .from("appointments")
          .select("starts_at, ends_at")
          .eq("business_id", business.id)
          .gte("starts_at", startOfDay)
          .lte("starts_at", endOfDay);

        if (apptError) throw apptError;

        // Filtrar colisões
        let filtered = filterAvailableSlots(
          allPossibleSlots,
          appointments || [],
          selectedService.duration_min,
          selectedDate,
        );

        // Impedir que horários no passado apareçam se for o dia de hoje
        const todayStr = new Date().toISOString().split("T")[0];
        if (selectedDate === todayStr) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();

          filtered = filtered.map((slot) => {
            const [slotH, slotM] = slot.time.split(":").map(Number);
            const slotMinutes = slotH * 60 + slotM;

            // Se o horário do slot já passou no dia de hoje, marcamos como indisponível
            if (slotMinutes <= currentMinutes) {
              return { ...slot, available: false };
            }
            return slot;
          });
        }

        // Remove de vez os botões do ecrã se preferires escondê-los, ou deixa apenas desativados
        const visibleSlots = filtered.filter((slot) => slot.available);

        setSlots(visibleSlots);
      } catch (error) {
        console.error("Erro ao carregar horários:", error.message);
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    loadAvailableTimes();
  }, [business, selectedService, selectedDate]);

  const handleSelectTime = (time) => {
    setSelectedTime(time);
    navigate("../form");
  };

  if (loadingSlots) return <div>A procurar horários disponíveis...</div>;

  return (
    <div className="time-page-container">
      {slots.length === 0 && !loadingSlots ? (
        <div className="closed-message">
          Sem horários disponíveis. Seleciona outra data.
        </div>
      ) : (
        <div className="time-section">
          <h2>Seleciona um horário</h2>
          <div className="time-grid">
            {slots.map((slot) => (
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
          <div className="page-actions">
            <button
              type="button"
              className="onboarding-btn-back"
              onClick={() => navigate("../date")}
            >
              <FiArrowLeft /> Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
