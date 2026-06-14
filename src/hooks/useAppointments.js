// src/hooks/useAppointments.js

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useBusiness } from "../context/BusinessContext";

// Estados possíveis de um agendamento
export const APPOINTMENT_STATUS = {
  EM_ABERTO: "em_aberto", // Agendado mas ainda não realizado
  CONCLUIDO: "concluido", // Serviço realizado com sucesso
  CANCELADO: "cancelado", // Cancelado pelo cliente ou prestador
};

// Labels e cores para uso na UI
export const STATUS_CONFIG = {
  em_aberto: {
    label: "Em aberto",
    color: "var(--color-warning-600)",
    bg: "var(--color-warning-50)",
  },
  concluido: {
    label: "Concluído",
    color: "var(--color-success-600)",
    bg: "var(--color-success-50)",
  },
  cancelado: {
    label: "Cancelado",
    color: "var(--color-error)",
    bg: "var(--color-error-subtle)",
  },
};

export function useAppointments({
  status = null,
  dateFrom = null,
  dateTo = null,
} = {}) {
  const { business } = useBusiness();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Carrega os agendamentos sempre que o business, status ou datas mudarem
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id, status, dateFrom, dateTo]);

  async function load() {
    if (!business?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Faz join com services para ter nome, duração e preço disponíveis
    let query = supabase
      .from("appointments")
      .select(
        `
        *,
        service:services (
          id,
          name,
          duration_min,
          price
        )
      `,
      )
      .eq("business_id", business.id)
      .order("starts_at", { ascending: true });

    // Filtros opcionais
    if (status) query = query.eq("status", status);
    if (dateFrom) query = query.gte("starts_at", dateFrom);
    if (dateTo) query = query.lte("starts_at", dateTo);

    const { data, error } = await query;

    if (error) {
      setError(error.message);
    } else {
      setAppointments(data || []);
    }

    setLoading(false);
  }

  // Função interna — actualiza status com optimistic update e reverte se falhar
  async function updateStatus(id, newStatus) {
    setSaving(true);

    // Guarda o estado anterior para possível reversão
    const previous = appointments.find((a) => a.id === id);

    // Aplica optimisticamente antes de confirmar na DB
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    );

    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("business_id", business.id);

    if (error) {
      // Reverte para o estado anterior se a DB falhar
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: previous?.status } : a)),
      );
      setError(error.message);
      setSaving(false);
      return { success: false, error: error.message };
    }

    setSaving(false);
    return { success: true };
  }

  // Marca como concluído
  async function completeAppointment(id) {
    return updateStatus(id, APPOINTMENT_STATUS.CONCLUIDO);
  }

  // Cancela um agendamento
  async function cancelAppointment(id) {
    return updateStatus(id, APPOINTMENT_STATUS.CANCELADO);
  }

  // Reabre um agendamento cancelado ou concluído
  async function reopenAppointment(id) {
    return updateStatus(id, APPOINTMENT_STATUS.EM_ABERTO);
  }

  // Reagenda — actualiza starts_at e ends_at
  async function rescheduleAppointment(id, startsAt, endsAt) {
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("appointments")
      .update({ starts_at: startsAt, ends_at: endsAt })
      .eq("id", id)
      .eq("business_id", business.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return { success: false, error: error.message };
    }

    // Actualiza localmente sem recarregar tudo
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, starts_at: startsAt, ends_at: endsAt } : a,
      ),
    );

    setSaving(false);
    return { success: true };
  }

  // Agrupamentos prontos a usar na UI
  const emAberto = appointments.filter(
    (a) => a.status === APPOINTMENT_STATUS.EM_ABERTO,
  );
  const concluidos = appointments.filter(
    (a) => a.status === APPOINTMENT_STATUS.CONCLUIDO,
  );
  const cancelados = appointments.filter(
    (a) => a.status === APPOINTMENT_STATUS.CANCELADO,
  );

  // Agendamentos de hoje — compara pela data local do utilizador
  const today = appointments.filter(
    (a) => new Date(a.starts_at).toDateString() === new Date().toDateString(),
  );

  return {
    appointments,
    loading,
    error,
    saving,
    completeAppointment,
    cancelAppointment,
    reopenAppointment,
    rescheduleAppointment,
    refetch: load,
    emAberto,
    concluidos,
    cancelados,
    today,
  };
}
