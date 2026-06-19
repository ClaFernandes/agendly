// src/components/service-panel/ClientTable.jsx

import { RiHeartLine, RiHeartFill, RiSearchLine, RiPencilLine } from "react-icons/ri";

// Formata data para pt-PT
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Formata preço em euros
function formatPrice(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function ClientTable({
  clients = [],
  loading = false,
  search = "",
  onSearchChange,
  isFavorite,
  onToggleFavorite,
  favoritesLoading = false,
  onEditClient,
}) {
  if (loading) {
    return <div className="appt-loading">A carregar clientes...</div>;
  }

  return (
    <div className="client-table-wrapper">
      {/* Barra de pesquisa */}
      <div className="client-search">
        <RiSearchLine className="client-search-icon" aria-hidden="true" />
        <input
          type="text"
          placeholder="Pesquisar por nome ou email..."
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="client-search-input"
        />
      </div>

      {/* Tabela vazia */}
      {clients.length === 0 && (
        <div className="pg-empty">
          <p className="pg-empty-text">
            {search ? "Nenhum cliente encontrado." : "Ainda sem clientes."}
          </p>
          {!search && (
            <p className="pg-empty-subtext">
              Os clientes aparecem aqui assim que fizerem agendamentos.
            </p>
          )}
        </div>
      )}

      {/* Tabela */}
      {clients.length > 0 && (
        <table className="client-table">
          <thead>
            <tr>
              <th></th> {/* Coluna do coração */}
              <th>Cliente</th>
              <th>Visitas</th>
              <th>Total gasto</th>
              <th>Última visita</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const fav = isFavorite?.(client.client_email);
              return (
                <tr
                  key={client.client_email}
                  className={fav ? "client-row--favorite" : ""}
                >
                  {/* Botão de favorito */}
                  <td className="client-fav-cell">
                    <button
                      className={`client-fav-btn ${fav ? "client-fav-btn--active" : ""}`}
                      onClick={() => onToggleFavorite?.(client.client_email)}
                      disabled={favoritesLoading}
                      title={
                        fav
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                      aria-label={
                        fav
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                    >
                      {fav ? (
                        <RiHeartFill aria-hidden="true" />
                      ) : (
                        <RiHeartLine aria-hidden="true" />
                      )}
                    </button>
                  </td>

                  {/* Nome e email */}
                  <td>
                    <div className="client-name">{client.client_name}</div>
                    <div className="client-email">{client.client_email}</div>
                    {client.client_phone && (
                      <div className="client-phone">{client.client_phone}</div>
                    )}
                  </td>

                  {/* Nº de visitas */}
                  <td>
                    <span className="client-visits">{client.total_visits}</span>
                  </td>

                  {/* Total gasto */}
                  <td>
                    <span className="client-spent">
                      {formatPrice(client.total_spent)}
                    </span>
                  </td>

                  {/* Última visita */}
                  <td>
                    <span className="client-last-visit">
                      {formatDate(client.last_visit)}
                    </span>
                  </td>

                  {/* Editar */}
                  <td className="client-td-actions">
                    <button
                      className="client-edit-btn"
                      onClick={() => onEditClient?.(client)}
                      title="Editar dados de contacto"
                      aria-label={`Editar ${client.client_name}`}
                    >
                      <RiPencilLine aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
