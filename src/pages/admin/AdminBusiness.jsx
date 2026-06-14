// src/pages/admin/AdminBusinesses.jsx

import { useState, useMemo } from "react";
import { useAdmin } from "../../hooks/useAdmin";
import BusinessTable from "../../components/admin-panel/BusinessTable";

import { FiSearch, FiAlertCircle } from "react-icons/fi";

import "./AdminPanel.css";

export default function AdminBusinesses() {
  const { businesses, loading, error, saving, toggleBusinessActive } =
    useAdmin();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("name");

  // Lista filtrada e ordenada
  const filtered = useMemo(() => {
    let list = [...businesses];

    // Filtro por estado
    if (filter === "active") list = list.filter((b) => b.is_active);
    if (filter === "inactive") list = list.filter((b) => !b.is_active);

    // Pesquisa por nome ou slug
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q),
      );
    }

    // Ordenação
    if (sort === "name") {
      list.sort((a, b) => a.name.localeCompare(b.name, "pt"));
    } else {
      // date desc — mais recentes primeiro
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return list;
  }, [businesses, filter, search, sort]);

  // Contagens para os tabs
  const counts = useMemo(
    () => ({
      all: businesses.length,
      active: businesses.filter((b) => b.is_active).length,
      inactive: businesses.filter((b) => !b.is_active).length,
    }),
    [businesses],
  );

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />A carregar negócios...
      </div>
    );
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="admin-page-header">
        <div>
          <h1>Negócios</h1>
          <p>{counts.all} registados na plataforma</p>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="admin-error-banner">
          <FiAlertCircle />
          {error}
        </div>
      )}

      {/* Tabela com toolbar */}
      <div className="admin-section">
        {/* Toolbar: pesquisa + filtros + ordenação */}
        <div className="admin-toolbar">
          {/* Pesquisa */}
          <div className="admin-search-wrapper">
            <FiSearch />
            <input
              type="text"
              placeholder="Pesquisar por nome ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Tabs de filtro */}
          <div className="admin-filter-tabs">
            {[
              { key: "all", label: `Todos (${counts.all})` },
              { key: "active", label: `Ativos (${counts.active})` },
              { key: "inactive", label: `Inativos (${counts.inactive})` },
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

          {/* Ordenação */}
          <select
            className="admin-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Nome A→Z</option>
            <option value="date">Mais recentes</option>
          </select>
        </div>

        {/* Tabela */}
        <BusinessTable
          businesses={filtered}
          onToggle={toggleBusinessActive}
          saving={saving}
        />
      </div>
    </div>
  );
}
