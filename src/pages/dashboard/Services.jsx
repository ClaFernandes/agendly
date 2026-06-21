// src/pages/dashboard/Services.jsx

import { useState } from "react";
import {
  RiAddLine,
  RiPencilLine,
  RiDeleteBinLine,
  RiStarLine,
  RiStarFill,
  RiScissorsCutLine,
  RiAlertLine,
} from "react-icons/ri";
import { useServices } from "../../hooks/useServices";
import "./Dashboard.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  duration_min: "",
  price: "",
  active: true,
};

// ── Modal de criar/editar serviço ─────────────────────────────────

function ServiceModal({ service, saving, onClose, onSubmit }) {
  const isEditing = Boolean(service);

  const [form, setForm] = useState(
    isEditing
      ? {
          name: service.name,
          description: service.description || "",
          duration_min: service.duration_min,
          price: service.price,
          active: service.active,
        }
      : EMPTY_FORM,
  );
  const [formError, setFormError] = useState(null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("O nome do serviço é obrigatório.");
      return;
    }
    if (!form.duration_min || Number(form.duration_min) <= 0) {
      setFormError("A duração deve ser superior a 0 minutos.");
      return;
    }
    if (!form.price || Number(form.price) < 0) {
      setFormError("O preço deve ser um valor válido.");
      return;
    }

    const result = await onSubmit(form);
    if (!result.success) {
      setFormError(result.error || "Ocorreu um erro. Tenta novamente.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {isEditing ? "Editar serviço" : "Novo serviço"}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar modal">×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="svc-name" className="form-label">
              Nome do serviço <span className="form-required">*</span>
            </label>
            <input
              id="svc-name"
              name="name"
              type="text"
              placeholder="ex: Corte + Barba"
              value={form.name}
              onChange={handleChange}
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="svc-desc" className="form-label">
              Descrição <span className="form-optional">(opcional)</span>
            </label>
            <textarea
              id="svc-desc"
              name="description"
              placeholder="Breve descrição do serviço..."
              value={form.description}
              onChange={handleChange}
              className="form-input form-textarea"
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="svc-duration" className="form-label">
                ⏱ Duração (min) <span className="form-required">*</span>
              </label>
              <input
                id="svc-duration"
                name="duration_min"
                type="number"
                placeholder="30"
                min="1"
                value={form.duration_min}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-field">
              <label htmlFor="svc-price" className="form-label">
                Preço (€) <span className="form-required">*</span>
              </label>
              <input
                id="svc-price"
                name="price"
                type="number"
                placeholder="15"
                min="0"
                step="0.5"
                value={form.price}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {isEditing && (
            <div className="form-field form-field--checkbox">
              <input
                id="svc-active"
                name="active"
                type="checkbox"
                checked={form.active}
                onChange={handleChange}
                className="form-checkbox"
              />
              <label htmlFor="svc-active" className="form-label form-label--inline">
                Serviço ativo
              </label>
            </div>
          )}

          {formError && <p className="form-error">{formError}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "A guardar..." : isEditing ? "Guardar alterações" : "Criar serviço"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Modal de confirmação de apagar ────────────────────────────────

function DeleteConfirmModal({ serviceName, saving, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal modal--sm"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className="modal-header">
          <h2 id="delete-modal-title" className="modal-title">Apagar serviço</h2>
          <button className="modal-close" onClick={onCancel} aria-label="Fechar">×</button>
        </div>

        <div className="delete-modal-body">
          <div className="delete-modal-icon">
            <RiAlertLine aria-hidden="true" />
          </div>
          <p className="delete-modal-text">
            Tens a certeza que queres apagar <strong>"{serviceName}"</strong>?
          </p>
          <p className="delete-modal-subtext">
            Esta acção é irreversível e irá remover o serviço permanentemente.
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={saving}>
            <RiDeleteBinLine aria-hidden="true" />
            {saving ? "A apagar..." : "Apagar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────

export default function Services() {
  const {
    services,
    loading,
    error,
    saving,
    createService,
    updateService,
    deleteService,
    toggleFeatured,
    toggleActive,
  } = useServices();

  const [modalMode, setModalMode]           = useState(null); // null | "new" | serviceObj
  const [deleteTarget, setDeleteTarget]     = useState(null); // null | serviceObj

  async function handleCreate(fields) {
    const result = await createService(fields);
    if (result.success) setModalMode(null);
    return result;
  }

  async function handleUpdate(fields) {
    const result = await updateService(modalMode.id, fields);
    if (result.success) setModalMode(null);
    return result;
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deleteService(deleteTarget.id);
    setDeleteTarget(null);
  }

  const totalServices  = services.length;
  const activeServices = services.filter(s => s.active).length;

  return (
    <div className="db-page">
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Serviços</h1>
          {!loading && (
            <p className="pg-subtitle">
              {totalServices} {totalServices === 1 ? "serviço" : "serviços"}
              {" · "}
              {activeServices} {activeServices === 1 ? "ativo" : "ativos"}
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={() => setModalMode("new")}>
          <RiAddLine aria-hidden="true" />
          Novo serviço
        </button>
      </div>

      {loading && (
        <div className="db-loading">
          <span className="db-loading-text">A carregar serviços...</span>
        </div>
      )}

      {error && !loading && (
        <div className="svc-error">Erro ao carregar serviços: {error}</div>
      )}

      {!loading && !error && services.length === 0 && (
        <div className="pg-section">
          <div className="pg-empty">
            <RiScissorsCutLine className="pg-empty-icon" aria-hidden="true" />
            <p className="pg-empty-text">Ainda não tens serviços criados</p>
            <p className="pg-empty-subtext">Começa por criar o teu primeiro serviço.</p>
            <button
              className="btn-primary"
              style={{ marginTop: "12px" }}
              onClick={() => setModalMode("new")}
            >
              <RiAddLine aria-hidden="true" />
              Criar primeiro serviço
            </button>
          </div>
        </div>
      )}

      {!loading && services.length > 0 && (
        <div className="pg-section" style={{ padding: 0, overflow: "hidden" }}>
          <table className="svc-table">
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Estado</th>
                <th>Preço</th>
                <th className="svc-th-center" title="Destaque na página pública">★</th>
                <th className="svc-th-actions">Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <tr key={service.id} className="svc-row">
                  {/* Nome + duração */}
                  <td className="svc-td-name">
                    <p className="svc-name">{service.name}</p>
                    <p className="svc-duration">{service.duration_min} min</p>
                  </td>

                  {/* Badge estado */}
                  <td>
                    <button
                      className={`svc-badge ${service.active ? "svc-badge--active" : "svc-badge--inactive"}`}
                      onClick={() => toggleActive(service.id, service.active)}
                      title={service.active ? "Clica para desativar" : "Clica para ativar"}
                    >
                      {service.active ? "ativo" : "inativo"}
                    </button>
                  </td>

                  {/* Preço */}
                  <td className="svc-td-price">
                    €{Number(service.price).toFixed(2)}
                  </td>

                  {/* Estrela — maior */}
                  <td className="svc-td-center">
                    <button
                      className={`svc-star ${service.is_featured ? "svc-star--on" : "svc-star--off"}`}
                      onClick={() => toggleFeatured(service.id, service.is_featured)}
                      title={service.is_featured ? "Remover destaque" : "Marcar como destaque"}
                      aria-label={service.is_featured ? "Remover destaque" : "Marcar como destaque"}
                    >
                      {service.is_featured
                        ? <RiStarFill aria-hidden="true" />
                        : <RiStarLine aria-hidden="true" />}
                    </button>
                  </td>

                  {/* Ações — alinhadas com o th */}
                  <td className="svc-td-actions">
                    <button
                      className="svc-action-btn"
                      onClick={() => setModalMode(service)}
                      title="Editar serviço"
                      aria-label={`Editar ${service.name}`}
                    >
                      <RiPencilLine aria-hidden="true" />
                    </button>
                    <button
                      className="svc-action-btn svc-action-btn--danger"
                      onClick={() => setDeleteTarget(service)}
                      title="Apagar serviço"
                      aria-label={`Apagar ${service.name}`}
                    >
                      <RiDeleteBinLine aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar/editar */}
      {modalMode !== null && (
        <ServiceModal
          service={modalMode === "new" ? null : modalMode}
          saving={saving}
          onClose={() => setModalMode(null)}
          onSubmit={modalMode === "new" ? handleCreate : handleUpdate}
        />
      )}

      {/* Modal de confirmação de apagar */}
      {deleteTarget !== null && (
        <DeleteConfirmModal
          serviceName={deleteTarget.name}
          saving={saving}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
