// src/pages/dashboard/Clients.jsx

import { useState, useMemo } from "react";
import { useAppointments } from "../../hooks/useAppointments";
import { useFavorites } from "../../hooks/useFavorites";
import { useBusiness } from "../../context/BusinessContext";
import { exportClientsCSV } from "../../lib/exportCsv";
import ClientTable from "../../components/service-panel/ClientTable";
import { RiDownloadLine, RiHeartLine } from "react-icons/ri";
import { supabase } from "../../lib/supabase";
import "./Dashboard.css";

// Modal de edição de dados do cliente 
function EditClientModal({ client, saving, onClose, onSubmit }) {
  const [form, setForm] = useState({
    client_name: client.client_name || "",
    client_email: client.client_email || "",
    client_phone: client.client_phone || "",
  });
  const [formError, setFormError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);

    if (!form.client_name.trim()) {
      setFormError("O nome é obrigatório.");
      return;
    }
    if (!form.client_email.trim() && !form.client_phone.trim()) {
      setFormError("Indica pelo menos um contacto (email ou telefone).");
      return;
    }

    const result = await onSubmit(form);
    if (!result?.success) {
      setFormError(result?.error || "Não foi possível guardar as alterações.");
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--sm"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-client-title"
      >
        <div className="modal-header">
          <h2 id="edit-client-title" className="modal-title">
            Editar dados do cliente
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {formError && <div className="form-error">{formError}</div>}

          <div className="form-field">
            <label className="form-label" htmlFor="edit-client-name">
              Nome <span className="form-required">*</span>
            </label>
            <input
              id="edit-client-name"
              name="client_name"
              type="text"
              className="form-input"
              value={form.client_name}
              onChange={handleChange}
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="edit-client-email">
              Email
            </label>
            <input
              id="edit-client-email"
              name="client_email"
              type="email"
              className="form-input"
              placeholder="exemplo@email.com"
              value={form.client_email}
              onChange={handleChange}
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="edit-client-phone">
              Telefone
            </label>
            <input
              id="edit-client-phone"
              name="client_phone"
              type="tel"
              className="form-input"
              placeholder="+351 9XX XXX XXX"
              value={form.client_phone}
              onChange={handleChange}
            />
          </div>

          <p className="pg-empty-subtext" style={{ textAlign: "left" }}>
            Esta alteração atualiza os dados de contacto em todos os
            agendamentos deste cliente, incluindo o histórico.
          </p>

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
              {saving ? "A guardar..." : "Guardar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Página principal
export default function Clients() {
  const { business } = useBusiness();
  const { appointments, loading: apptLoading, refetch } = useAppointments();
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites();

  const [search, setSearch] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null | client
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState(null);

  // Agrupa agendamentos por client_email e calcula métricas
  const clients = useMemo(() => {
    const map = new Map();

    appointments.forEach((appt) => {
      // Ignora cancelados para as métricas
      if (appt.status === "cancelado") return;

      const key = appt.client_email;
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          client_email: key,
          client_name: appt.client_name,
          client_phone: appt.client_phone,
          total_visits: 0,
          total_spent: 0,
          last_visit: null,
        });
      }

      const client = map.get(key);
      client.total_visits += 1;

      // Soma o preço do serviço se disponível
      if (appt.service?.price) {
        client.total_spent += Number(appt.service.price);
      }

      // Guarda a data da visita mais recente
      const apptDate = new Date(appt.starts_at);
      if (!client.last_visit || apptDate > new Date(client.last_visit)) {
        client.last_visit = appt.starts_at;
      }
    });

    // Converte para array e ordena por número de visitas (desc)
    return Array.from(map.values()).sort(
      (a, b) => b.total_visits - a.total_visits,
    );
  }, [appointments]);

  // Aplica filtros de pesquisa e favoritos
  const filteredClients = useMemo(() => {
    let result = clients;

    if (showOnlyFavorites) {
      result = result.filter((c) => isFavorite(c.client_email));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.client_name?.toLowerCase().includes(q) ||
          c.client_email?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [clients, search, showOnlyFavorites, isFavorite]);

  // Totais para os cards de estatísticas
  const totalClients = clients.length;
  const favoriteCount = clients.filter((c) =>
    isFavorite(c.client_email),
  ).length;
  const totalVisits = clients.reduce((sum, c) => sum + c.total_visits, 0);

  function handleExport() {
    exportClientsCSV(filteredClients);
  }

  // Atualiza nome/email/telefone em todos os agendamentos do cliente
  async function handleSaveClientEdit(form) {
    if (!editTarget || !business?.id) {
      return { success: false, error: "Não foi possível identificar o negócio." };
    }

    setSavingEdit(true);
    setEditError(null);

    const { error } = await supabase
      .from("appointments")
      .update({
        client_name: form.client_name.trim(),
        client_email: form.client_email.trim(),
        client_phone: form.client_phone.trim(),
      })
      .eq("business_id", business.id)
      .eq("client_email", editTarget.client_email);

    if (error) {
      setEditError(error.message);
      setSavingEdit(false);
      return { success: false, error: error.message };
    }

    // Se o favorito estava marcado com o email antigo e o email mudou, favorito "perde-se" 
    // os favoritos também são indexados por client_email.
    await refetch();
    setSavingEdit(false);
    setEditTarget(null);
    return { success: true };
  }

  return (
    <div className="db-page">
      {editError && <p className="sch-error">{editError}</p>}
      {/* Cabeçalho */}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Clientes</h1>
          <p className="pg-subtitle">
            Acompanha os teus clientes e identifica os mais fiéis.
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={handleExport}
          disabled={apptLoading || filteredClients.length === 0}
        >
          <RiDownloadLine aria-hidden="true" />
          Exportar
        </button>
      </div>

      {/* Cards de estatísticas */}
      <div className="pg-stats-grid">
        <div className="pg-stat-card">
          <p className="pg-stat-label">Total de clientes</p>
          <p className="pg-stat-value">{apptLoading ? "—" : totalClients}</p>
          <p className="pg-stat-meta">{totalVisits} visitas no total</p>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Clientes favoritos</p>
          <p className="pg-stat-value">{favLoading ? "—" : favoriteCount}</p>
          <p className="pg-stat-meta">marcados com ❤️</p>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Média de visitas</p>
          <p className="pg-stat-value">
            {apptLoading || totalClients === 0
              ? "—"
              : (totalVisits / totalClients).toFixed(1)}
          </p>
          <p className="pg-stat-meta">por cliente</p>
        </div>
      </div>

      {/* Filtro de favoritos */}
      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Lista de clientes</h2>
          <button
            className={`btn-secondary ${showOnlyFavorites ? "btn-secondary--active" : ""}`}
            onClick={() => setShowOnlyFavorites((v) => !v)}
          >
            <RiHeartLine aria-hidden="true" />
            {showOnlyFavorites ? "Ver todos" : "Só favoritos"}
          </button>
        </div>

        {/* Tabela de clientes */}
        <ClientTable
          clients={filteredClients}
          loading={apptLoading}
          search={search}
          onSearchChange={setSearch}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          favoritesLoading={favLoading}
          onEditClient={setEditTarget}
        />
      </div>

      {/* Modal de edição */}
      {editTarget && (
        <EditClientModal
          client={editTarget}
          saving={savingEdit}
          onClose={() => setEditTarget(null)}
          onSubmit={handleSaveClientEdit}
        />
      )}

    </div>
  );
}
