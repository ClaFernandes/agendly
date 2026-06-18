// src/pages/admin/AdminProviders.jsx

import { useState, useMemo } from "react";
import { useAdmin } from "../../hooks/useAdmin";
import {
  FiSearch,
  FiAlertCircle,
  FiAlertTriangle,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
  FiPhone,
  FiGlobe,
  FiMail,
  FiEdit2,
  FiSend,
  FiX,
  FiCheck,
} from "react-icons/fi";
import "./AdminPanel.css";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatPrice(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency", currency: "EUR", minimumFractionDigits: 0,
  }).format(value ?? 0);
}

// Modal de edição 
function EditModal({ business, onClose, onSave, saving }) {
  const [form, setForm] = useState({
    name: business.name ?? "",
    slug: business.slug ?? "",
    phone: business.phone ?? "",
    description: business.description ?? "",
  });
  const [formError, setFormError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) { setFormError("O nome é obrigatório."); return; }
    if (!form.slug.trim()) { setFormError("O slug é obrigatório."); return; }
    if (!/^[a-z0-9-]+$/.test(form.slug)) {
      setFormError("O slug só pode conter letras minúsculas, números e hífens.");
      return;
    }
    const result = await onSave(business.id, form);
    if (!result.success) setFormError(result.error ?? "Erro ao guardar.");
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Editar negócio</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: 20 }}>
            <FiX />
          </button>
        </div>

        {formError && (
          <div style={{ background: "var(--color-error-subtle)", color: "var(--color-error)", padding: "8px 12px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "name", label: "Nome do negócio *", placeholder: "Nome do negócio" },
            { key: "slug", label: "Slug *", placeholder: "nome-do-negocio", hint: `Só letras minúsculas, números e hífens. URL pública: /p/${form.slug}` },
            { key: "phone", label: "Telefone", placeholder: "+351 9XX XXX XXX" },
          ].map(({ key, label, placeholder, hint }) => (
            <div key={key}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
              </label>
              <input name={key} value={form[key]} onChange={handleChange} className="admin-edit-input" placeholder={placeholder} />
              {hint && <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>{hint}</p>}
            </div>
          ))}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Descrição
            </label>
            <textarea name="description" value={form.description} onChange={handleChange}
              className="admin-edit-input" rows={3} placeholder="Descrição do negócio..." style={{ resize: "vertical" }} />
          </div>

          <div className="admin-modal-actions">
            <button type="button" className="admin-modal-cancel" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="admin-modal-submit" disabled={saving}>
              {saving ? "A guardar..." : "Guardar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Linha de prestador

function ProviderRow({ business, onToggle, onDelete, onEdit, onResetPassword, saving }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleReset() {
    await onResetPassword(business.email);
    setResetSent(true);
    setTimeout(() => setResetSent(false), 4000);
  }

  return (
    <>
      {/* Linha principal */}
      <tr
        className={`admin-provider-row ${!business.is_active ? "admin-provider-row--inactive" : ""}`}
        onClick={() => setExpanded((e) => !e)}
        style={{ cursor: "pointer" }}
      >
        {/* Avatar + nome */}
        <td>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name}
                style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", border: "1px solid var(--color-border)", flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "var(--color-brand-subtle)", color: "var(--color-brand)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 600, fontSize: 12,
              }}>
                {business.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div className="admin-table-name">{business.name}</div>
              <span className="admin-table-slug">{business.slug}</span>
            </div>
          </div>
        </td>

        <td style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{business.email ?? "—"}</td>
        <td style={{ whiteSpace: "nowrap" }}>{formatDate(business.created_at)}</td>

        {/* Agendamentos */}
        <td style={{ fontWeight: 600, color: "var(--color-text)", textAlign: "center" }}>
          {business.appointment_count ?? 0}
        </td>

        {/* Receita */}
        <td style={{ fontWeight: 600, color: "var(--color-ok)", whiteSpace: "nowrap" }}>
          {formatPrice(business.revenue ?? 0)}
        </td>

        {/* Estado */}
        <td>
          <span className={`admin-badge ${business.is_active ? "active" : "inactive"}`}>
            <span className="admin-badge-dot" />
            {business.is_active ? "ativo" : "suspenso"}
          </span>
        </td>

        {/* Ações — com label de texto para maior clareza */}
        <td onClick={(e) => e.stopPropagation()}>
          <div className="admin-action-group">
            {/* Editar */}
            <button
              className="admin-action-btn admin-action-btn--labeled edit"
              onClick={() => setShowEdit(true)}
              disabled={saving}
              title="Editar dados do negócio"
            >
              <FiEdit2 size={13} />
            </button>

            {/* Suspender / Reativar */}
            <button
              className={`admin-action-btn admin-action-btn--labeled ${business.is_active ? "deactivate" : "activate"}`}
              onClick={() => onToggle(business.id, business.is_active)}
              disabled={saving}
              title={business.is_active ? "Suspender acesso" : "Reativar acesso"}
            >
              {business.is_active
                ? <><FiToggleRight size={13} /></>
                : <><FiToggleLeft size={13} /></>
              }
            </button>

            {/* Apagar */}
            <button
              className="admin-action-btn admin-action-btn--labeled delete"
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              title="Apagar negócio permanentemente"
            >
              <FiTrash2 size={13} />
            </button>
          </div>
        </td>

        {/* Seta de expandir */}
        <td style={{ color: "var(--color-text-subtle)", textAlign: "center" }}>
          {expanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
        </td>
      </tr>

      {/* ── Linha de detalhe expandida ── */}
      {expanded && (
        <tr className="admin-provider-detail-row">
          <td colSpan={8} style={{ padding: 0 }}>
            <div className="admin-provider-detail">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
                {[
                  { icon: FiMail, label: "Email", value: business.email },
                  { icon: FiPhone, label: "Telefone", value: business.phone },
                  { icon: FiCalendar, label: "Registado", value: formatDate(business.created_at) },
                ].filter((f) => f.value).map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                      <div style={{ fontSize: 13 }}>{value}</div>
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <FiGlobe size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Link público</div>
                    <a href={`/p/${business.slug}`} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 13, color: "var(--color-brand)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      /p/{business.slug}
                    </a>
                  </div>
                </div>
              </div>

              {/* Reset de password */}
              {business.email && (
                <div style={{ borderTop: "0.5px solid var(--color-border)", paddingTop: 12, marginTop: 12 }}>
                  <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8 }}>
                    Se o prestador perdeu acesso, podes enviar um email de recuperação de password.
                  </p>
                  <button
                    className={`admin-action-btn ${resetSent ? "approve" : ""}`}
                    onClick={handleReset}
                    disabled={saving || resetSent}
                  >
                    {resetSent ? <><FiCheck /> Email enviado!</> : <><FiSend /> Enviar reset de password</>}
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* ── Modal apagar ── */}
      {confirmDelete && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDelete(false)} style={{ position: "fixed" }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", background: "var(--color-error-subtle)", color: "var(--color-error)", margin: "0 auto 16px" }}>
              <FiAlertTriangle size={22} />
            </div>
            <h3 style={{ textAlign: "center" }}>Apagar prestador?</h3>
            <p style={{ textAlign: "center", fontSize: 14, color: "var(--color-text-muted)" }}>
              Vais apagar <strong>{business.name}</strong> permanentemente. Todos os dados serão removidos e o acesso revogado. Esta ação é irreversível.
            </p>
            <div className="admin-modal-actions">
              <button className="admin-modal-cancel" onClick={() => setConfirmDelete(false)} disabled={saving}>Cancelar</button>
              <button className="admin-modal-submit" style={{ background: "var(--color-error)" }}
                onClick={() => { onDelete(business.id); setConfirmDelete(false); }} disabled={saving}>
                {saving ? "A apagar..." : "Apagar tudo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {showEdit && (
        <EditModal
          business={business}
          onClose={() => setShowEdit(false)}
          onSave={async (id, data) => {
            const result = await onEdit(id, data);
            if (result.success) setShowEdit(false);
            return result;
          }}
          saving={saving}
        />
      )}
    </>
  );
}

// Card de prestador (mobile) 
// Em telemóvel a tabela é substituída por cards empilhados.
function ProviderCard({ business, onToggle, onDelete, onEdit, onResetPassword, saving }) {
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleReset() {
    await onResetPassword(business.email);
    setResetSent(true);
    setTimeout(() => setResetSent(false), 4000);
  }

  return (
    <div className={`admin-provider-card ${!business.is_active ? "admin-provider-card--inactive" : ""}`}>
      {/* Cabeçalho do card */}
      <div className="admin-provider-card__header">
        {business.logo_url ? (
          <img src={business.logo_url} alt={business.name}
            style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover", border: "1px solid var(--color-border)", flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: "var(--color-brand-subtle)", color: "var(--color-brand)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 14,
          }}>
            {business.name?.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="admin-table-name" style={{ fontSize: 15 }}>{business.name}</div>
          <span className="admin-table-slug">{business.slug}</span>
        </div>
        <span className={`admin-badge ${business.is_active ? "active" : "inactive"}`}>
          <span className="admin-badge-dot" />
          {business.is_active ? "ativo" : "suspenso"}
        </span>
      </div>

      {/* Metadados */}
      <div className="admin-provider-card__meta">
        <span><FiMail size={12} /> {business.email ?? "—"}</span>
        <span><FiCalendar size={12} /> {formatDate(business.created_at)}</span>
        <span>📅 {business.appointment_count ?? 0} agendamentos</span>
        <span style={{ color: "var(--color-ok)", fontWeight: 600 }}>💶 {formatPrice(business.revenue ?? 0)}</span>
      </div>

      {/* Ações */}
      <div className="admin-provider-card__actions">
        <button
          className="admin-action-btn admin-action-btn--labeled edit"
          onClick={() => setShowEdit(true)}
          disabled={saving}
        >
          <FiEdit2 size={13} />
        </button>
        <button
          className={`admin-action-btn admin-action-btn--labeled ${business.is_active ? "deactivate" : "activate"}`}
          onClick={() => onToggle(business.id, business.is_active)}
          disabled={saving}
        >
          {business.is_active
            ? <><FiToggleRight size={13} /></>
            : <><FiToggleLeft size={13} /></>
          }
        </button>
        <button
          className="admin-action-btn admin-action-btn--labeled delete"
          onClick={() => setConfirmDelete(true)}
          disabled={saving}
        >
          <FiTrash2 size={13} />
        </button>
      </div>

      {/* Reset de password */}
      {business.email && (
        <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10, marginTop: 4 }}>
          <button
            className={`admin-action-btn ${resetSent ? "approve" : ""}`}
            onClick={handleReset}
            disabled={saving || resetSent}
            style={{ fontSize: 12 }}
          >
            {resetSent ? <><FiCheck /> Email enviado!</> : <><FiSend /> Enviar reset de password</>}
          </button>
        </div>
      )}

      {/* Modais */}
      {confirmDelete && (
        <div className="admin-modal-overlay" onClick={() => setConfirmDelete(false)} style={{ position: "fixed" }}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", background: "var(--color-error-subtle)", color: "var(--color-error)", margin: "0 auto 16px" }}>
              <FiAlertTriangle size={22} />
            </div>
            <h3 style={{ textAlign: "center" }}>Apagar prestador?</h3>
            <p style={{ textAlign: "center", fontSize: 14, color: "var(--color-text-muted)" }}>
              Vais apagar <strong>{business.name}</strong> permanentemente. Esta ação é irreversível.
            </p>
            <div className="admin-modal-actions">
              <button className="admin-modal-cancel" onClick={() => setConfirmDelete(false)} disabled={saving}>Cancelar</button>
              <button className="admin-modal-submit" style={{ background: "var(--color-error)" }}
                onClick={() => { onDelete(business.id); setConfirmDelete(false); }} disabled={saving}>
                {saving ? "A apagar..." : "Apagar tudo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <EditModal
          business={business}
          onClose={() => setShowEdit(false)}
          onSave={async (id, data) => {
            const result = await onEdit(id, data);
            if (result.success) setShowEdit(false);
            return result;
          }}
          saving={saving}
        />
      )}
    </div>
  );
}

// Página principal 

export default function AdminProviders() {
  const { businesses, loading, error, saving, toggleBusinessActive, deleteBusiness, updateBusiness, sendPasswordReset } = useAdmin();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date");

  const filtered = useMemo(() => {
    let list = [...businesses];
    if (filter === "active") list = list.filter((b) => b.is_active);
    if (filter === "inactive") list = list.filter((b) => !b.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) =>
        b.name?.toLowerCase().includes(q) || b.slug?.toLowerCase().includes(q) || b.email?.toLowerCase().includes(q)
      );
    }
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name, "pt"));
    else if (sort === "revenue") list.sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
    else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }, [businesses, filter, search, sort]);

  const counts = useMemo(() => ({
    all: businesses.length,
    active: businesses.filter((b) => b.is_active).length,
    inactive: businesses.filter((b) => !b.is_active).length,
  }), [businesses]);

  if (loading) return <div className="admin-loading"><div className="admin-spinner" />A carregar prestadores...</div>;

  const sharedProps = {
    onToggle: toggleBusinessActive,
    onDelete: deleteBusiness,
    onEdit: updateBusiness,
    onResetPassword: sendPasswordReset,
    saving,
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1>Negócios</h1>
          <p>{counts.all} registados na plataforma</p>
        </div>
      </div>

      {error && <div className="admin-error-banner"><FiAlertCircle />{error}</div>}

      <div className="admin-section">
        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-search-wrapper">
            <FiSearch />
            <input
              type="text"
              placeholder="Pesquisar por nome, slug ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="admin-filter-tabs">
            {[
              { key: "all", label: `Todos (${counts.all})` },
              { key: "active", label: `Ativos (${counts.active})` },
              { key: "inactive", label: `Suspensos (${counts.inactive})` },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`admin-filter-tab ${filter === tab.key ? "active" : ""}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <select className="admin-sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="date">Mais recentes</option>
            <option value="name">Nome A→Z</option>
            <option value="revenue">Maior receita</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty"><FiAlertCircle /><p>Nenhum negócio encontrado.</p></div>
        ) : (
          <>
            {/* Tabela (desktop/tablet) */}
            <div className="admin-table-wrapper admin-table-wrapper--desktop">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Negócio</th>
                    <th>Email</th>
                    <th>Registo</th>
                    <th style={{ textAlign: "center" }}>Agendamentos</th>
                    <th>Receita</th>
                    <th>Estado</th>
                    <th>Ações</th>
                    <th style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <ProviderRow key={b.id} business={b} {...sharedProps} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Cards (mobile) ── */}
            <div className="admin-cards-mobile">
              {filtered.map((b) => (
                <ProviderCard key={b.id} business={b} {...sharedProps} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}