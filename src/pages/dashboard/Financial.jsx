// src/pages/dashboard/Financial.jsx

import { useMemo, useState } from "react";
import { useAppointments } from "../../hooks/useAppointments";
import { exportFinancialCSV } from "../../lib/exportCsv";

import { RiDownloadLine, RiBarChartLine } from "react-icons/ri";
import "./Dashboard.css";

// Formata preço em euros
function formatPrice(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(value ?? 0);
}

// Formata data para pt-PT
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Nomes dos meses em português
const MONTH_NAMES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export default function Financial() {
  const { appointments, loading, error } = useAppointments();

  // Filtro de período — mês actual por omissão
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed

  // Filtra apenas agendamentos concluídos do período seleccionado
  const periodAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (a.status !== "concluido") return false;
      const date = new Date(a.starts_at);
      return (
        date.getFullYear() === selectedYear && date.getMonth() === selectedMonth
      );
    });
  }, [appointments, selectedYear, selectedMonth]);

  // Todos os concluídos (para o total acumulado)
  const allCompleted = useMemo(
    () => appointments.filter((a) => a.status === "concluido"),
    [appointments],
  );

  // Métricas do período
  const metrics = useMemo(() => {
    const revenue = periodAppointments.reduce(
      (sum, a) => sum + Number(a.service?.price ?? 0),
      0,
    );
    const count = periodAppointments.length;
    const avg = count > 0 ? revenue / count : 0;

    // Serviço mais popular no período
    const serviceCount = {};
    periodAppointments.forEach((a) => {
      const name = a.service?.name ?? "Desconhecido";
      serviceCount[name] = (serviceCount[name] ?? 0) + 1;
    });
    const topService = Object.entries(serviceCount).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return { revenue, count, avg, topService };
  }, [periodAppointments]);

  // Total acumulado (todos os tempos)
  const totalRevenue = useMemo(
    () =>
      allCompleted.reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0),
    [allCompleted],
  );

  // Receita por serviço no período (para o gráfico de barras simples)
  const revenueByService = useMemo(() => {
    const map = {};
    periodAppointments.forEach((a) => {
      const name = a.service?.name ?? "Desconhecido";
      map[name] = (map[name] ?? 0) + Number(a.service?.price ?? 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6); // Máximo de 6 serviços
  }, [periodAppointments]);

  // Máximo para calcular a largura das barras
  const maxRevenue = Math.max(...revenueByService.map(([, v]) => v), 1);

  // Prepara dados para exportação CSV
  function handleExport() {
    const rows = periodAppointments.map((a) => ({
      date: formatDate(a.starts_at),
      client_name: a.client_name,
      service_name: a.service?.name ?? "",
      price: a.service?.price ?? 0,
      status: a.status,
    }));
    exportFinancialCSV(rows);
  }

  // Anos disponíveis para o selector (desde o primeiro agendamento)
  const years = useMemo(() => {
    const now = new Date();
    const set = new Set(
      appointments.map((a) => new Date(a.starts_at).getFullYear()),
    );
    set.add(now.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [appointments]);

  return (
    <div className="db-page">
      {/* Cabeçalho */}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Financeiro</h1>
          <p className="pg-subtitle">
            Acompanha as receitas e o desempenho do teu negócio.
          </p>
        </div>

        <button
          className="btn-secondary"
          onClick={handleExport}
          disabled={loading || periodAppointments.length === 0}
        >
          <RiDownloadLine aria-hidden="true" />
          Exportar CSV
        </button>
      </div>

      {error && <p className="sch-error">{error}</p>}

      {/* Selector de período */}
      <div className="fin-period-selector">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="fin-select"
        >
          {MONTH_NAMES.map((name, i) => (
            <option key={i} value={i}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="fin-select"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Cards de métricas */}
      <div className="pg-stats-grid">
        <div className="pg-stat-card">
          <p className="pg-stat-label">Receita do mês</p>
          <p className="pg-stat-value">
            {loading ? "—" : formatPrice(metrics.revenue)}
          </p>
          <p className="pg-stat-meta">{metrics.count} serviços concluídos</p>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Ticket médio</p>
          <p className="pg-stat-value">
            {loading ? "—" : formatPrice(metrics.avg)}
          </p>
          <p className="pg-stat-meta">por agendamento</p>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Serviço mais popular</p>
          <p className="pg-stat-value" style={{ fontSize: "var(--text-lg)" }}>
            {loading ? "—" : metrics.topService ? metrics.topService[0] : "—"}
          </p>
          {metrics.topService && (
            <p className="pg-stat-meta">{metrics.topService[1]} vezes</p>
          )}
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Receita total acumulada</p>
          <p className="pg-stat-value">
            {loading ? "—" : formatPrice(totalRevenue)}
          </p>
          <p className="pg-stat-meta">
            {allCompleted.length} serviços no total
          </p>
        </div>
      </div>

      {/* Gráfico de barras simples por serviço */}
      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Receita por serviço</h2>
          <span className="pg-section-meta">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>
        </div>

        {revenueByService.length === 0 ? (
          <div className="pg-empty">
            <RiBarChartLine className="pg-empty-icon" aria-hidden="true" />
            <p className="pg-empty-text">Sem dados para este período.</p>
            <p className="pg-empty-subtext">
              Os dados aparecem quando há agendamentos concluídos.
            </p>
          </div>
        ) : (
          <div className="fin-chart">
            {revenueByService.map(([name, value]) => (
              <div key={name} className="fin-bar-row">
                <span className="fin-bar-label">{name}</span>
                <div className="fin-bar-track">
                  <div
                    className="fin-bar-fill"
                    style={{ width: `${(value / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="fin-bar-value">{formatPrice(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabela de transacções do período */}
      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Transacções</h2>
          <span className="pg-section-meta">
            {periodAppointments.length} registos
          </span>
        </div>

        {periodAppointments.length === 0 ? (
          <div className="pg-empty">
            <p className="pg-empty-text">Sem transacções neste período.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {periodAppointments.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDate(a.starts_at)}</td>
                    <td>{a.client_name}</td>
                    <td>{a.service?.name ?? "—"}</td>
                    <td>{formatPrice(a.service?.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
