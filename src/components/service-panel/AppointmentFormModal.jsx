// src/components/service-panel/AppointmentFormModal.jsx

import { useState, useMemo } from "react";
import { RiCloseLine } from "react-icons/ri";

function toDateInputValue(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInputValue(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AppointmentFormModal({
    mode = "create", // "create" | "edit"
    appointment = null, // agendamento a editar (necessário quando mode === "edit")
    initialDate = null, // pré-preenchimento ao clicar num slot do calendário
    services = [],
    clients = [],
    saving = false,
    onClose,
    onSubmit,
}) {
    const isEdit = mode === "edit";

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

    // Sugestões de clientes existentes, filtradas pelo nome/email digitado
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

    function validate() {
        if (!formData.client_name.trim()) return "O nome do cliente é obrigatório.";
        if (!formData.client_email.trim() && !formData.client_phone.trim())
            return "Indica pelo menos um contacto (email ou telefone).";
        if (!formData.service_id) return "Escolhe um serviço.";
        if (!formData.date || !formData.time) return "Escolhe a data e a hora.";
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
        const startsAtDate = new Date(`${formData.date}T${formData.time}:00`);
        const endsAtDate = new Date(
            startsAtDate.getTime() + (service?.duration_min ?? 0) * 60000,
        );

        const payload = {
            client_name: formData.client_name.trim(),
            client_email: formData.client_email.trim(),
            client_phone: formData.client_phone.trim(),
            notes: formData.notes.trim(),
            service_id: formData.service_id,
            starts_at: startsAtDate.toISOString(),
            ends_at: endsAtDate.toISOString(),
        };

        const result = await onSubmit(payload);
        if (!result?.success) {
            setFormError(result?.error || "Não foi possível guardar o agendamento.");
        }
    }

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
                                placeholder="9XX XXX XXX"
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
