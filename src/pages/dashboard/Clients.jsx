// src/pages/dashboard/Clients.jsx

import { useState, useMemo } from "react";
import { useAppointments } from "../../hooks/useAppointments";
import { useFavorites } from "../../hooks/useFavorites";
import { exportClientsCSV } from "../../lib/exportCsv";
import ClientTable from "../../components/service-panel/ClientTable";
import { RiDownloadLine, RiHeartLine } from "react-icons/ri";
import "./Dashboard.css";

export default function Clients() {
  const { appointments, loading: apptLoading } = useAppointments();
  const { isFavorite, toggleFavorite, loading: favLoading } = useFavorites();

  const [search, setSearch] = useState("");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

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

  return (
    <div className="db-page">
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
        />
      </div>
    </div>
  );
}
