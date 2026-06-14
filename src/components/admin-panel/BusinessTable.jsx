// src/components/admin-panel/BusinessTable.jsx

import { FiAlertCircle } from "react-icons/fi";

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

export default function BusinessTable({ businesses, onToggle, saving }) {
  if (businesses.length === 0) {
    return (
      <div className="admin-empty">
        <FiAlertCircle />
        <p>Nenhum negócio encontrado.</p>
        <p>Tenta ajustar a pesquisa ou o filtro.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Negócio</th>
            <th>Slug</th>
            <th>Registo</th>
            <th>Estado</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {businesses.map((b) => (
            <tr key={b.id}>
              {/* Nome */}
              <td>
                <div className="admin-table-name">{b.name}</div>
              </td>

              {/* Slug em mono */}
              <td>
                <span className="admin-table-slug">{b.slug}</span>
              </td>

              {/* Data de registo */}
              <td>{formatDate(b.created_at)}</td>

              {/* Badge de estado */}
              <td>
                <span
                  className={`admin-badge ${b.is_active ? "active" : "inactive"}`}
                >
                  <span className="admin-badge-dot" />
                  {b.is_active ? "ativo" : "inativo"}
                </span>
              </td>

              {/* Botão ativar / desativar */}
              <td>
                <button
                  className={`admin-action-btn ${b.is_active ? "deactivate" : "activate"}`}
                  onClick={() => onToggle(b.id, b.is_active)}
                  disabled={saving}
                >
                  {b.is_active ? "Desativar" : "Ativar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
