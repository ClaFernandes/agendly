// src/pages/public-booking/TimePage.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { generateSlots, filterAvailableSlots } from "../../lib/slots";
import { supabase } from "../../lib/supabase";

export default function TimePage() {
  const navigate = useNavigate();
  const { business, selectedService, selectedDate, selectedTime, setSelectedTime } = useBooking();
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    async function loadAvailableTimes() {
      if (!business || !selectedService || !selectedDate) return;
      setLoadingSlots(true);

      try {
        const dateObj = new Date(`${selectedDate}T00:00:00`);
        const dayOfWeek = dateObj.getDay();

        // 1. Agora buscamos TODOS os turnos para aquele dia (sem o maybeSingle)
        const { data: hoursData, error: hoursError } = await supabase
          .from("working_hours")
          .select("start_time, end_time")
          .eq("business_id", business.id)
          .eq("day_of_week", dayOfWeek)
          .eq("is_active", true); // Filtra apenas os ativos

        if (hoursError) throw hoursError;

        if (!hoursData || hoursData.length === 0) {
          setSlots([]);
          return;
        }

        // 2. Geramos slots para CADA turno e juntamos tudo numa lista só
        let allPossibleSlots = [];
        hoursData.forEach((turno) => {
          const turnoSlots = generateSlots(
            turno.start_time,
            turno.end_time,
            selectedService.duration_min
          );
          allPossibleSlots = [...allPossibleSlots, ...turnoSlots];
        });

        // 3. Buscar agendamentos (igual ao que já tinhas)
        const startOfDay = new Date(`${selectedDate}T00:00:00`).toISOString();
        const endOfDay = new Date(`${selectedDate}T23:59:59`).toISOString();

        const { data: appointments, error: apptError } = await supabase
          .from("appointments")
          .select("starts_at, ends_at")
          .eq("business_id", business.id)
          .gte("starts_at", startOfDay)
          .lte("starts_at", endOfDay);

        if (apptError) throw apptError;

        // 4. Filtrar colisões
        const filtered = filterAvailableSlots(
          allPossibleSlots,
          appointments || [],
          selectedService.duration_min,
          selectedDate
        );

        setSlots(filtered);
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

  const morningSlots = slots.filter((s) => s.time < "12:00");
  const afternoonSlots = slots.filter((s) => s.time >= "12:00");

  if (loadingSlots) return <div>A procurar horários disponíveis...</div>;

  return (
    <div className="time-page-container">
      <h2>Escolha o Horário</h2>

      {slots.length === 0 && !loadingSlots ? (
        <div className="closed-message">Sem horários disponíveis. Seleciona outra data.</div>
      ) : (
        <>
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
        </>
      )}

      <Link to="../date" className="back-btn">← Voltar</Link>
    </div>
  );
}