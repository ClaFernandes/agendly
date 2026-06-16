// src/hooks/useAppointments.js

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useBusiness } from "../context/BusinessContext";

export const APPOINTMENT_STATUS = {
  EM_ABERTO: "em_aberto",
  CONCLUIDO: "concluido",
  CANCELADO: "cancelado",
};

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

export function resolveStatus(appt) {
  if (appt.status !== APPOINTMENT_STATUS.EM_ABERTO) return appt.status;
  if (new Date(appt.ends_at) < new Date()) return APPOINTMENT_STATUS.CONCLUIDO;
  return APPOINTMENT_STATUS.EM_ABERTO;
}

const APPOINTMENT_SELECT = `
  *,
  service:services (
    id,
    name,
    duration_min,
    price
  )
`;

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

    let query = supabase
      .from("appointments")
      .select(APPOINTMENT_SELECT)
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

  async function updateStatus(id, newStatus) {
    setSaving(true);

    const previous = appointments.find((a) => a.id === id);

    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)),
    );

    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id)
      .eq("business_id", business.id);

    if (error) {
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

  async function completeAppointment(id) {
    return updateStatus(id, APPOINTMENT_STATUS.CONCLUIDO);
  }

  async function cancelAppointment(id) {
    return updateStatus(id, APPOINTMENT_STATUS.CANCELADO);
  }

  async function reopenAppointment(id) {
    return updateStatus(id, APPOINTMENT_STATUS.EM_ABERTO);
  }

  async function rescheduleAppointment(id, startsAt, endsAt) {
    return updateAppointment(id, { starts_at: startsAt, ends_at: endsAt });
  }

  // Cria um agendamento manualmente
  async function createAppointment(payload) {
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        business_id: business.id,
        status: APPOINTMENT_STATUS.EM_ABERTO,
        ...payload,
      })
      .select(APPOINTMENT_SELECT)
      .single();

    if (error) {
      setError(error.message);
      setSaving(false);
      return { success: false, error: error.message };
    }

    setAppointments((prev) =>
      [...prev, data].sort(
        (a, b) => new Date(a.starts_at) - new Date(b.starts_at),
      ),
    );

    setSaving(false);
    return { success: true, data };
  }

  // Edição genérica de qualquer campo
  async function updateAppointment(id, updates) {
    setSaving(true);
    setError(null);

    const { data, error } = await supabase
      .from("appointments")
      .update(updates)
      .eq("id", id)
      .eq("business_id", business.id)
      .select(APPOINTMENT_SELECT)
      .single();

    if (error) {
      setError(error.message);
      setSaving(false);
      return { success: false, error: error.message };
    }

    setAppointments((prev) =>
      prev
        .map((a) => (a.id === id ? data : a))
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)),
    );

    setSaving(false);
    return { success: true, data };
  }

  // Agrupamentos com status derivado
  const emAberto = appointments.filter(
    (a) => resolveStatus(a) === APPOINTMENT_STATUS.EM_ABERTO,
  );
  const concluidos = appointments.filter(
    (a) => resolveStatus(a) === APPOINTMENT_STATUS.CONCLUIDO,
  );
  const cancelados = appointments.filter(
    (a) => resolveStatus(a) === APPOINTMENT_STATUS.CANCELADO,
  );

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
    createAppointment,
    updateAppointment,
    refetch: load,
    emAberto,
    concluidos,
    cancelados,
    today,
  };
}