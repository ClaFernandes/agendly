// src/hooks/useAppointments.js
// Hook personalizado para gestão de agendamentos

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useBusiness } from "../context/BusinessContext";

// Estados possíveis de um agendamento
export const APPOINTMENT_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
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

  // Carrega os agendamentos com filtros opcionais
  const fetchAppointments = useCallback(async () => {
    if (!business?.id) return;

    setLoading(true);
    setError(null);

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
      .order("start_at", { ascending: true });

    // Filtro por estado (ex: só pendentes, só confirmados)
    if (status) {
      query = query.eq("status", status);
    }

    // Filtro por intervalo de datas
    if (dateFrom) {
      query = query.gte("start_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("start_at", dateTo);
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
    } else {
      setAppointments(data || []);
    }

    setLoading(false);
  }, [business?.id, status, dateFrom, dateTo]);

  // Carrega quando o business ou os filtros mudarem
  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Confirmar agendamento (pending → confirmed)
  async function confirmAppointment(id) {
    return updateStatus(id, APPOINTMENT_STATUS.CONFIRMED);
  }

  // Cancelar agendamento
  async function cancelAppointment(id) {
    return updateStatus(id, APPOINTMENT_STATUS.CANCELLED);
  }

  // Marcar como concluído
  async function completeAppointment(id) {
    return updateStatus(id, APPOINTMENT_STATUS.COMPLETED);
  }

  // Marcar como não compareceu
  async function markNoShow(id) {
    return updateStatus(id, APPOINTMENT_STATUS.NO_SHOW);
  }

  // Função interna que atualiza o estado de um agendamento
  async function updateStatus(id, newStatus) {
    setSaving(true);

    // Guarda o estado anterior para possível reversão
    const previous = appointments.find((a) => a.id === id);

    // Optimistic update
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

  // Reagendar — atualiza start_at e end_at de um agendamento
  async function rescheduleAppointment(id, startAt, endAt) {
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("appointments")
      .update({
        start_at: startAt,
        end_at: endAt,
      })
      .eq("id", id)
      .eq("business_id", business.id);

    if (error) {
      setError(error.message);
      setSaving(false);
      return { success: false, error: error.message };
    }

    // Atualiza localmente sem recarregar tudo
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, start_at: startAt, end_at: endAt } : a,
      ),
    );

    setSaving(false);
    return { success: true };
  }

  // Agendamentos filtrados por estado — úteis para contagens na UI
  const pending = appointments.filter(
    (a) => a.status === APPOINTMENT_STATUS.PENDING,
  );
  const confirmed = appointments.filter(
    (a) => a.status === APPOINTMENT_STATUS.CONFIRMED,
  );
  const today = appointments.filter((a) => {
    const date = new Date(a.start_at).toDateString();
    return date === new Date().toDateString();
  });

  return {
    appointments,
    loading,
    error,
    saving,
    // Ações
    confirmAppointment,
    cancelAppointment,
    completeAppointment,
    markNoShow,
    rescheduleAppointment,
    refetch: fetchAppointments,
    // Agrupamentos prontos a usar
    pending,
    confirmed,
    today,
  };
}
