// src/pages/admin/AdminUsers.jsx

import { useState } from "react";
import { useAdmin } from "../../hooks/useAdmin";
import { useAuth } from "../../context/AuthContext";
import {
  FiInfo,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import "./AdminPanel.css";

// Formata data para pt-PT
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsers() {
  const { user, logout } = useAuth();
  const {
    admins,
    pendingAdmins,
    loading,
    error,
    saving,
    removeAdmin,
    approveAdmin,
    rejectAdmin,
  } = useAdmin();

  // ID do admin a confirmar remoção — null = nenhum modal aberto
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);

  // Mensagem de sucesso após aprovar
  const [successMessage, setSuccessMessage] = useState(null);

  // Aprova e mostra mensagem de sucesso temporária
  async function handleApprove(adminId, email) {
    const result = await approveAdmin(adminId);
    if (result.success) {
      setSuccessMessage(`${email} foi aprovado e já tem acesso ao painel.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  }

  // Confirma e remove o admin
  // Se o admin removido for o próprio utilizador logado, faz logout imediato
  async function handleRemove(adminId) {
    const result = await removeAdmin(adminId);
    setConfirmRemoveId(null);

    if (result.success && adminId === user?.id) {
      // O utilizador removeu-se a si próprio — termina sessão
      await logout();
    }
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />A carregar administradores...
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="admin-page-header">
        <div>
          <h1>Administradores</h1>
          <p>Gere quem tem acesso ao painel de administração.</p>
        </div>
      </div>

      {/* Erro global */}
      {error && (
        <div className="admin-error-banner">
          <FiAlertCircle />
          {error}
        </div>
      )}

      {/* Mensagem de sucesso após aprovação */}
      {successMessage && (
        <div className="admin-success-banner">
          <FiCheck />
          {successMessage}
        </div>
      )}

      {/* Pedidos pendentes */}
      {pendingAdmins.length > 0 && (
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Pedidos pendentes</h2>
            <span className="admin-section-count admin-section-count--pending">
              {pendingAdmins.length}
            </span>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Pedido em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pendingAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td>
                      <div className="admin-table-name">{admin.email}</div>
                    </td>
                    <td>
                      {admin.created_at ? formatDate(admin.created_at) : "—"}
                    </td>
                    <td>
                      <div className="admin-action-group">
                        <button
                          className="admin-action-btn approve"
                          onClick={() => handleApprove(admin.id, admin.email)}
                          disabled={saving}
                        >
                          <FiCheck /> Aprovar
                        </button>
                        <button
                          className="admin-action-btn remove"
                          onClick={() => rejectAdmin(admin.id)}
                          disabled={saving}
                        >
                          <FiX /> Rejeitar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-note">
            <FiInfo />
            Os administradores aprovados ganham acesso imediato ao painel.
          </div>
        </div>
      )}

      {/* Admins ativos */}
      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Admins ativos</h2>
          <span className="admin-section-count">{admins.length}</span>
        </div>

        {admins.length === 0 ? (
          <div className="admin-empty">
            <p>Nenhum administrador encontrado.</p>
          </div>
        ) : (
          <>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Adicionado em</th>
                    <th>Tipo</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.id}>
                      <td>
                        <div className="admin-table-name">{admin.email}</div>
                      </td>
                      <td>
                        {admin.created_at ? formatDate(admin.created_at) : "—"}
                      </td>
                      <td>
                        {admin.is_super ? (
                          <span className="admin-badge super">super admin</span>
                        ) : (
                          <span className="admin-badge inactive">admin</span>
                        )}
                      </td>
                      <td>
                        {/* Super admin não pode ser removido */}
                        {admin.is_super ? (
                          <span
                            style={{
                              fontSize: "var(--text-xs)",
                              color: "var(--color-text-subtle)",
                            }}
                          >
                            —
                          </span>
                        ) : (
                          <button
                            className="admin-action-btn remove"
                            onClick={() => setConfirmRemoveId(admin.id)}
                            disabled={saving}
                          >
                            Remover
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-note">
              <FiInfo />O super admin não pode ser removido. Os admins removidos
              perdem acesso imediatamente.
            </div>
          </>
        )}
      </div>

      {/* Modal de confirmação de remoção */}
      {confirmRemoveId && (
        <div
          className="admin-modal-overlay"
          onClick={() => setConfirmRemoveId(null)}
        >
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 48,
                height: 48,
                borderRadius: "var(--radius-full)",
                background: "var(--color-error-subtle)",
                color: "var(--color-error)",
                margin: "0 auto 16px",
              }}
            >
              <FiAlertTriangle size={22} />
            </div>

            <h3 style={{ textAlign: "center" }}>Remover administrador?</h3>
            <p style={{ textAlign: "center" }}>
              Esta ação é permanente. O administrador perderá acesso
              imediatamente e não poderá ser recuperado.
              {/* Aviso extra se for o próprio utilizador */}
              {confirmRemoveId === user?.id && (
                <strong
                  style={{
                    display: "block",
                    marginTop: 8,
                    color: "var(--color-error)",
                  }}
                >
                  Atenção: estás a remover a tua própria conta. Serás desligado
                  imediatamente.
                </strong>
              )}
            </p>

            <div className="admin-modal-actions">
              <button
                className="admin-modal-cancel"
                onClick={() => setConfirmRemoveId(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                className="admin-modal-submit"
                style={{ background: "var(--color-error)" }}
                onClick={() => handleRemove(confirmRemoveId)}
                disabled={saving}
              >
                {saving ? "A remover..." : "Sim, remover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
