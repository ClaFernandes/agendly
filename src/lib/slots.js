// src/lib/slots.js

export function generateSlots(startTime, endTime, durationMin) {
  if (!startTime || !endTime || !durationMin) return [];

  const slots = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  
  let currentMin = startTotalMin;
  
  while (currentMin + durationMin <= endTotalMin) {
    const h = Math.floor(currentMin / 60).toString().padStart(2, '0');
    const m = (currentMin % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    currentMin += durationMin; // Podes alterar isto se quiseres intervalos diferentes (ex: a cada 15 min)
  }
  
  return slots;
}

export function filterAvailableSlots(allSlots, appointments, durationMin, selectedDate) {
  return allSlots.map(slotTime => {
    // Cria um objeto de data real para o início e fim do slot que estamos a avaliar
    const slotStart = new Date(`${selectedDate}T${slotTime}:00`);
    const slotEnd = new Date(slotStart.getTime() + durationMin * 60000);

    // Verifica se este slot choca com ALGUM agendamento existente
    const isOccupied = appointments.some(app => {
      const appStart = new Date(app.starts_at);
      const appEnd = new Date(app.ends_at);

      // Regra de colisão: O slot começa ANTES do agendamento terminar E termina DEPOIS do agendamento começar
      return slotStart < appEnd && slotEnd > appStart;
    });

    return {
      time: slotTime,
      available: !isOccupied
    };
  });
}