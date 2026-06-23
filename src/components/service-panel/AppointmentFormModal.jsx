// src/components/service-panel/AppointmentFormModal.jsx

import { useState, useMemo, useEffect, useCallback } from "react";
import { RiCloseLine, RiAlertLine, RiErrorWarningLine } from "react-icons/ri";
import { supabase } from "../../lib/supabase";
import { useBusiness } from "../../context/BusinessContext";

function toDateInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export default function AppointmentFormModal({
  mode = "create", // "create" | "edit"
  appointment = null,
  initialDate = null,
  services = [],
  clients = [],
  appointments = [], // lista de agendamentos existentes para verificar conflitos
  saving = false,
  onClose,
  onSubmit,
}) {
  const isEdit = mode === "edit";
  const { business } = useBusiness();

  const [formData, setFormData] = useState(() => {
    if (isEdit && appointment) {
      const start = new Date(appointment.starts_at);
      return {
        client_name: appointment.client_name || "",
        client_email: appointment.client_email || "",
        client_phone: appointment.client_phone || "",
        notes: appointment.notes || "",
        service_id: appointment.service?.id || "",
        date: toDateInputValue(start),
        time: toTimeInputValue(start),
      };
    }

    const base = initialDate ? new Date(initialDate) : new Date();
    return {
      client_name: "",
      client_email: "",
      client_phone: "",
      notes: "",
      service_id: "",
      date: toDateInputValue(base),
      time: "",
    };
  });

  const [formError, setFormError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Estados dos avisos de horário
  const [scheduleWarning, setScheduleWarning] = useState(null); // aviso amarelo — fora do horário
  const [conflictError, setConflictError] = useState(null);     // erro vermelho — conflito de agendamento
  const [checkingSchedule, setCheckingSchedule] = useState(false);

  // Sugestões de clientes existentes
  const suggestions = useMemo(() => {
    const q = formData.client_name.trim().toLowerCase();
    if (!q) return [];
    return clients
      .filter(
        (c) =>
          c.client_name?.toLowerCase().includes(q) ||
          c.client_email?.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [formData.client_name, clients]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "client_name") setShowSuggestions(true);
  }

  function handleSelectClient(client) {
    setFormData((prev) => ({
      ...prev,
      client_name: client.client_name || "",
      client_email: client.client_email || "",
      client_phone: client.client_phone || "",
    }));
    setShowSuggestions(false);
  }

  // Verifica horário e conflitos sempre que data, hora ou serviço mudam
  const checkScheduleAndConflicts = useCallback(async () => {
    // Limpa avisos anteriores
    setScheduleWarning(null);
    setConflictError(null);

    // Só verifica se tiver data, hora e serviço preenchidos
    if (!formData.date || !formData.time || !formData.service_id || !business?.id) return;

    const service = services.find((s) => s.id === formData.service_id);
    if (!service) return;

    setCheckingSchedule(true);

    try {
      // Calcula início e fim do novo agendamento em minutos do dia
      const slotStartMin = toMinutes(formData.time);
      const slotEndMin = slotStartMin + (service.duration_min ?? 0);

      // Verifica se está dentro do horário de trabalho 
      const dateObj = new Date(`${formData.date}T00:00:00`);
      const dayOfWeek = dateObj.getDay();

      const { data: hoursData } = await supabase
        .from("working_hours")
        .select("start_time, end_time")
        .eq("business_id", business.id)
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true);

      if (!hoursData || hoursData.length === 0) {
        // Dia sem horário definido — aviso amarelo
        setScheduleWarning("Este dia não está definido no teu horário de trabalho.");
      } else {
        // Verifica se o slot cabe em algum dos turnos do dia
        const fitsInAnyShift = hoursData.some((shift) => {
          const shiftStart = toMinutes(shift.start_time);
          const shiftEnd = toMinutes(shift.end_time);
          return slotStartMin >= shiftStart && slotEndMin <= shiftEnd;
        });

        if (!fitsInAnyShift) {
          // Hora fora do horário definido — aviso amarelo
          setScheduleWarning("Este horário está fora do teu horário de trabalho.");
        }
      }

      // Verifica conflitos com agendamentos existentes 
      const newStart = new Date(`${formData.date}T${formData.time}:00`);
      const newEnd = new Date(newStart.getTime() + (service.duration_min ?? 0) * 60000);

      const hasConflict = appointments.some((appt) => {
        // Em modo edição, ignora o próprio agendamento
        if (isEdit && appt.id === appointment?.id) return false;
        // Ignora cancelados — não ocupam slot
        if (appt.status === "cancelado") return false;

        const apptStart = new Date(appt.starts_at);
        const apptEnd = new Date(appt.ends_at);

        // Colisão: novo começa antes do existente terminar E novo termina depois do existente começar
        return newStart < apptEnd && newEnd > apptStart;
      });

      if (hasConflict) {
        // Conflito real — erro vermelho, bloqueia submissão
        setConflictError("Já existe um agendamento neste horário. Escolhe outra hora.");
      }

    } catch (err) {
      console.error("Erro ao verificar horário:", err);
    } finally {
      setCheckingSchedule(false);
    }
  }, [formData.date, formData.time, formData.service_id, business?.id, services, appointments, isEdit, appointment?.id]);

  // Dispara a verificação sempre que data, hora ou serviço mudam
  useEffect(() => {
    checkScheduleAndConflicts();
  }, [checkScheduleAndConflicts]);

  function validate() {
    if (!formData.client_name.trim()) return "O nome do cliente é obrigatório.";
    if (!formData.client_email.trim() && !formData.client_phone.trim())
      return "Indica pelo menos um contacto (email ou telefone).";
    if (!formData.service_id) return "Escolhe um serviço.";
    if (!formData.date || !formData.time) return "Escolhe a data e a hora.";
    if (conflictError) return conflictError;
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);

    const service = services.find((s) => s.id === formData.service_id);

    // Cria os objetos de data baseados na hora local do browser
    const startsAtDate = new Date(`${formData.date}T${formData.time}:00`);
    const endsAtDate = new Date(
      startsAtDate.getTime() + (service?.duration_min ?? 0) * 60000,
    );

    // Força a manter a hora literal pretendida
    const tzOffsetStart = startsAtDate.getTimezoneOffset() * 60000;
    const forcedStartDate = new Date(startsAtDate.getTime() - tzOffsetStart);
    const tzOffsetEnd = endsAtDate.getTimezoneOffset() * 60000;
    const forcedEndDate = new Date(endsAtDate.getTime() - tzOffsetEnd);

    const payload = {
      client_name: formData.client_name.trim(),
      client_email: formData.client_email.trim(),
      client_phone: formData.client_phone.trim(),
      notes: formData.notes.trim(),
      service_id: formData.service_id,
      starts_at: forcedStartDate.toISOString(),
      ends_at: forcedEndDate.toISOString(),
    };

    const result = await onSubmit(payload);
    if (!result?.success) {
      setFormError(result?.error || "Não foi possível guardar o agendamento.");
    }
  }

  // O botão de submeter fica desactivado se houver conflito ou se estiver a verificar
  const submitDisabled = saving || checkingSchedule || !!conflictError;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? "Editar agendamento" : "Novo agendamento"}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            <RiCloseLine aria-hidden="true" />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {formError && <div className="form-error">{formError}</div>}

          {/* Cliente — com sugestões de clientes já existentes */}
          <div className="form-field client-autocomplete">
            <label className="form-label" htmlFor="client_name">
              Cliente <span className="form-required">*</span>
            </label>
            <input
              type="text"
              id="client_name"
              name="client_name"
              className="form-input"
              placeholder="Nome do cliente"
              value={formData.client_name}
              onChange={handleChange}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 100)}
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="client-autocomplete-list">
                {suggestions.map((c) => (
                  <li key={c.client_email}>
                    <button
                      type="button"
                      className="client-autocomplete-item"
                      onClick={() => handleSelectClient(c)}
                    >
                      <span className="client-autocomplete-name">
                        {c.client_name}
                      </span>
                      <span className="client-autocomplete-email">
                        {c.client_email}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="client_email">
                Email
              </label>
              <input
                type="email"
                id="client_email"
                name="client_email"
                className="form-input"
                placeholder="exemplo@email.com"
                value={formData.client_email}
                onChange={handleChange}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="client_phone">
                Telefone
              </label>
              <input
                type="tel"
                id="client_phone"
                name="client_phone"
                className="form-input"
                placeholder="+351 XXX XXX XXX"
                value={formData.client_phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Serviço */}
          <div className="form-field">
            <label className="form-label" htmlFor="service_id">
              Serviço <span className="form-required">*</span>
            </label>
            <select
              id="service_id"
              name="service_id"
              className="form-input"
              value={formData.service_id}
              onChange={handleChange}
            >
              <option value="">Escolhe um serviço</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.duration_min}min
                </option>
              ))}
            </select>
          </div>

          {/* Data e hora */}
          <div className="form-row">
            <div className="form-field">
              <label className="form-label" htmlFor="date">
                Data <span className="form-required">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                className="form-input"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="time">
                Hora <span className="form-required">*</span>
              </label>
              <input
                type="time"
                id="time"
                name="time"
                className="form-input"
                value={formData.time}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Aviso amarelo — fora do horário de trabalho (não bloqueia) */}
          {scheduleWarning && !conflictError && (
            <div className="form-schedule-warning">
              <RiAlertLine aria-hidden="true" />
              <span>{scheduleWarning} Podes criar na mesma como excepção.</span>
            </div>
          )}

          {/* Erro vermelho — conflito de agendamento (bloqueia) */}
          {conflictError && (
            <div className="form-conflict-error">
              <RiErrorWarningLine aria-hidden="true" />
              <span>{conflictError}</span>
            </div>
          )}

          {/* Notas */}
          <div className="form-field">
            <label className="form-label" htmlFor="notes">
              Notas <span className="form-optional">(opcional)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              className="form-input form-textarea"
              rows="3"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving
                ? "A guardar..."
                : isEdit
                  ? "Guardar alterações"
                  : "Criar agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
