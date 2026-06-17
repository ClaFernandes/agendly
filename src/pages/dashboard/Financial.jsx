// src/pages/dashboard/Financial.jsx

import { useMemo, useState } from "react";
import { useAppointments, resolveStatus } from "../../hooks/useAppointments";
import { exportFinancialCSV } from "../../lib/exportCsv";
import { RiDownloadLine, RiBarChartLine } from "react-icons/ri";
import "./Dashboard.css";

function formatPrice(value) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const MONTH_NAMES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const STATUS_LABEL = {
  concluido:      "Concluído",
  nao_compareceu: "Não compareceu",
  em_aberto:      "Em aberto",
};

export default function Financial() {
  const { appointments, loading, error } = useAppointments();

  const now = new Date();
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());

  const years = useMemo(() => {
    const set = new Set(appointments.map((a) => new Date(a.starts_at).getFullYear()));
    set.add(now.getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [appointments]);

  // Agendamentos do período — exclui cancelados
  const periodAll = useMemo(() => {
    return appointments.filter((a) => {
      const d = new Date(a.starts_at);
      if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) return false;
      const s = resolveStatus(a);
      return s !== "cancelado"; // cancelados não contam para nada
    });
  }, [appointments, selectedYear, selectedMonth]);

  // Receita confirmada = concluídos (BD) + em_aberto que já passou (automático)
  const periodConfirmed = useMemo(() =>
    periodAll.filter((a) => resolveStatus(a) === "concluido"),
    [periodAll]
  );

  // Receita prevista = em_aberto no futuro
  const periodFuture = useMemo(() =>
    periodAll.filter((a) => resolveStatus(a) === "em_aberto"),
    [periodAll]
  );

  // Não compareceram
  const periodNoShow = useMemo(() =>
    periodAll.filter((a) => a.status === "nao_compareceu"),
    [periodAll]
  );

  // Total acumulado — concluídos de todos os tempos (automático + manual)
  const allConfirmed = useMemo(() =>
    appointments.filter((a) => resolveStatus(a) === "concluido"),
    [appointments]
  );

  const metrics = useMemo(() => {
    const revenue = periodConfirmed.reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0);
    const count   = periodConfirmed.length;
    const avg     = count > 0 ? revenue / count : 0;

    const serviceCount = {};
    periodConfirmed.forEach((a) => {
      const name = a.service?.name ?? "Desconhecido";
      serviceCount[name] = (serviceCount[name] ?? 0) + 1;
    });
    const topService = Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0];

    return { revenue, count, avg, topService };
  }, [periodConfirmed]);

  const projectedRevenue = useMemo(() =>
    periodFuture.reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0),
    [periodFuture]
  );

  const totalRevenue = useMemo(() =>
    allConfirmed.reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0),
    [allConfirmed]
  );

  const revenueByService = useMemo(() => {
    const map = {};
    periodConfirmed.forEach((a) => {
      const name = a.service?.name ?? "Desconhecido";
      map[name] = (map[name] ?? 0) + Number(a.service?.price ?? 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [periodConfirmed]);

  const maxRevenue = Math.max(...revenueByService.map(([, v]) => v), 1);

  function handleExport() {
    const rows = periodConfirmed.map((a) => ({
      date:         formatDate(a.starts_at),
      client_name:  a.client_name,
      service_name: a.service?.name ?? "",
      price:        a.service?.price ?? 0,
      status:       STATUS_LABEL[resolveStatus(a)] ?? resolveStatus(a),
    }));
    exportFinancialCSV(rows);
  }

  return (
    <div className="db-page">
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Financeiro</h1>
          <p className="pg-subtitle">Acompanha as receitas e o desempenho do teu negócio.</p>
        </div>
        <button
          className="btn-secondary"
          onClick={handleExport}
          disabled={loading || periodConfirmed.length === 0}
        >
          <RiDownloadLine aria-hidden="true" />
          Exportar CSV
        </button>
      </div>

      {error && <p className="sch-error">{error}</p>}

      <div className="fin-period-selector">
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="fin-select">
          {MONTH_NAMES.map((name, i) => <option key={i} value={i}>{name}</option>)}
        </select>
        <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="fin-select">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="pg-stats-grid">
        <div className="pg-stat-card">
          <p className="pg-stat-label">Receita confirmada</p>
          <p className="pg-stat-value">{loading ? "—" : formatPrice(metrics.revenue)}</p>
          <p className="pg-stat-meta">{metrics.count} serviços realizados</p>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Receita prevista</p>
          <p className="pg-stat-value">{loading ? "—" : formatPrice(projectedRevenue)}</p>
          <p className="pg-stat-meta">{periodFuture.length} agendamentos futuros</p>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Ticket médio</p>
          <p className="pg-stat-value">{loading ? "—" : formatPrice(metrics.avg)}</p>
          <p className="pg-stat-meta">por serviço realizado</p>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Não compareceram</p>
          <p className="pg-stat-value" style={{ color: periodNoShow.length > 0 ? "#7C3AED" : undefined }}>
            {loading ? "—" : periodNoShow.length}
          </p>
          <p className="pg-stat-meta">este mês</p>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Serviço mais popular</p>
          <p className="pg-stat-value" style={{ fontSize: "var(--text-lg)" }}>
            {loading ? "—" : metrics.topService ? metrics.topService[0] : "—"}
          </p>
          {metrics.topService && <p className="pg-stat-meta">{metrics.topService[1]} vezes</p>}
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Receita total acumulada</p>
          <p className="pg-stat-value">{loading ? "—" : formatPrice(totalRevenue)}</p>
          <p className="pg-stat-meta">{allConfirmed.length} serviços no total</p>
        </div>
      </div>

      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Receita por serviço</h2>
          <span className="pg-section-meta">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
        </div>
        {revenueByService.length === 0 ? (
          <div className="pg-empty">
            <RiBarChartLine className="pg-empty-icon" aria-hidden="true" />
            <p className="pg-empty-text">Sem dados para este período.</p>
            <p className="pg-empty-subtext">Os dados aparecem quando há serviços realizados.</p>
          </div>
        ) : (
          <div className="fin-chart">
            {revenueByService.map(([name, value]) => (
              <div key={name} className="fin-bar-row">
                <span className="fin-bar-label">{name}</span>
                <div className="fin-bar-track">
                  <div className="fin-bar-fill" style={{ width: `${(value / maxRevenue) * 100}%` }} />
                </div>
                <span className="fin-bar-value">{formatPrice(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Transacções confirmadas</h2>
          <span className="pg-section-meta">{periodConfirmed.length} registos</span>
        </div>
        {periodConfirmed.length === 0 ? (
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
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {periodConfirmed.map((a) => (
                  <tr key={a.id}>
                    <td>{formatDate(a.starts_at)}</td>
                    <td>{a.client_name}</td>
                    <td>{a.service?.name ?? "—"}</td>
                    <td>{formatPrice(a.service?.price)}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        padding: "2px 8px", borderRadius: 99,
                        background: a.status === "concluido" ? "#E1F5EE" : "#F5F3FF",
                        color: a.status === "concluido" ? "#0F6E56" : "#7C3AED",
                      }}>
                        {a.status === "concluido" ? "Manual" : "Automático"}
                      </span>
                    </td>
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
