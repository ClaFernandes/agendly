// src/hooks/useAppointments.js

import { useState, useEffect } from "react";
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

  // Carrega os agendamentos sempre que o business, status ou datas mudarem
  useEffect(() => {
    async function load() {
      if (!business?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      let query = supabase
        .from("appointments")
        .select(
          `*,
          service:services (
            id,
            name,
            duration_min,
            price
          )`,
        )
        .eq("business_id", business.id)
        .order("starts_at", { ascending: true });

      // Filtro por estado (ex: só pendentes, só confirmados)
      if (status) {
        query = query.eq("status", status);
      }

      // Filtro por intervalo de datas
      if (dateFrom) {
        query = query.gte("starts_at", dateFrom);
      }
      if (dateTo) {
        query = query.lte("starts_at", dateTo);
      }

      const { data, error } = await query;

      if (error) {
        setError(error.message);
      } else {
        setAppointments(data || []);
      }

      setLoading(false);
    }

    load();
  }, [business?.id, status, dateFrom, dateTo]);

  // Fetch manual
  async function fetchAppointments() {
    if (!business?.id) return;

    setLoading(true);
    setError(null);

    let query = supabase
      .from("appointments")
      .select(
        `*,
        service:services (
          id,
          name,
          duration_min,
          price
        )`,
      )
      .eq("business_id", business.id)
      .order("starts_at", { ascending: true });

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

  // Função interna — atualiza o estado com optimistic update e reverte se falhar
  async function updateStatus(id, newStatus) {
    setSaving(true);

    // Guarda o estado anterior para possível reversão
    const previous = appointments.find((a) => a.id === id);

    // Optimistic: aplica antes de confirmar na DB
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

  // Reagendar — atualiza starts_at e ends_at de um agendamento
  async function rescheduleAppointment(id, startsAt, endsAt) {
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("appointments")
      .update({
        starts_at: startsAt,
        ends_at: endsAt,
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
        a.id === id ? { ...a, starts_at: startsAt, ends_at: endsAt } : a,
      ),
    );

    setSaving(false);
    return { success: true };
  }

  // Agrupamentos prontos a usar na UI

  const pending = appointments.filter(
    (a) => a.status === APPOINTMENT_STATUS.PENDING,
  );

  const confirmed = appointments.filter(
    (a) => a.status === APPOINTMENT_STATUS.CONFIRMED,
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
    // Ações
    confirmAppointment,
    cancelAppointment,
    completeAppointment,
    markNoShow,
    rescheduleAppointment,
    refetch: fetchAppointments,
    pending,
    confirmed,
    today,
  };
}
