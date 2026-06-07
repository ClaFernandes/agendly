// src/lib/slots.js

/**
 * Gera todos os horários possíveis (slots) de um dia de trabalho.
 * @param {string} startTime - Hora de início do expediente (Ex: "08:00")
 * @param {string} endTime - Hora de término do expediente (Ex: "18:00")
 * @param {number} durationMin - Duração do serviço em minutos (Ex: 30 ou 45)
 * @returns {string[]} - Array de horários gerados (Ex: ["08:00", "08:30", "09:00", ...])
 */
export function generateSlots(startTime, endTime, durationMin) {
  if (!startTime || !endTime || !durationMin) return [];

  const slots = [];
  
  // Converte "HH:MM" para minutos totais do dia para facilitar o cálculo
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  
  let currentMin = startTotalMin;
  
  // Loop para criar os blocos de tempo enquanto couber dentro do expediente
  while (currentMin + durationMin <= endTotalMin) {
    const h = Math.floor(currentMin / 60).toString().padStart(2, '0');
    const m = (currentMin % 60).toString().padStart(2, '0');
    
    slots.push(`${h}:${m}`);
    
    // Avança para o próximo bloco
    currentMin += durationMin;
  }
  
  return slots;
}

/**
 * Filtra os slots gerados, removendo os que já estão ocupados por outros agendamentos.
 * @param {string[]} allSlots - Todos os slots gerados pela função acima
 * @param {Object[]} appointments - Lista de agendamentos vindos do Supabase para aquele dia
 * @returns {Object[]} - Array contendo o horário e se ele está disponível (Ex: { time: "08:00", available: true })
 */
export function filterAvailableSlots(allSlots, appointments) {
  return allSlots.map(slotTime => {
    // Verifica se já existe algum agendamento que começa exatamente nesse horário
    // Nota: Futuramente podemos melhorar isso para checar colisões em intervalos de tempo completos
    const isOccupied = appointments.some(app => {
      // Extrai apenas o "HH:MM" do campo starts_at (timestamptz) do banco
      const appTime = new Date(app.starts_at).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return appTime === slotTime;
    });

    return {
      time: slotTime,
      available: !isOccupied
    };
  });
}