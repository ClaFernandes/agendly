// src/pages/dashboard/Financial.jsx

import { useMemo, useState } from "react";
import { useAppointments, resolveStatus } from "../../hooks/useAppointments";
import { exportFinancialCSV } from "../../lib/exportCsv";
import { RiDownloadLine, RiBarChartLine } from "react-icons/ri";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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

const STATUS_LABEL = {
  concluido: "Concluído",
  nao_compareceu: "Não compareceu",
  em_aberto: "Em aberto",
};

// Tooltip partilhado — declarado fora do componente
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--color-surface)",
        border: "0.5px solid var(--color-border-strong)",
        borderRadius: "var(--radius-md)",
        padding: "8px 12px",
        fontSize: 13,
        color: "var(--color-text)",
      }}
    >
      <p style={{ margin: 0, fontWeight: "var(--font-semi)" }}>{label}</p>
      <p style={{ margin: "2px 0 0", color: "var(--color-brand)" }}>
        {formatPrice(payload[0].value)}
      </p>
    </div>
  );
}

export default function Financial() {
  const { appointments, loading, error } = useAppointments();

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const years = useMemo(() => {
    const set = new Set(
      appointments.map((a) => new Date(a.starts_at).getFullYear()),
    );
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [appointments]);

  // ── Todos os confirmados de sempre ──────────────────────────────
  const allConfirmed = useMemo(
    () => appointments.filter((a) => resolveStatus(a) === "concluido"),
    [appointments],
  );

  const totalRevenue = useMemo(
    () =>
      allConfirmed.reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0),
    [allConfirmed],
  );

  // ── Dados mensais do ano seleccionado (gráfico de evolução) ─────
  const monthlyData = useMemo(() => {
    return MONTH_NAMES.map((name, i) => {
      const total = appointments
        .filter((a) => {
          const d = new Date(a.starts_at);
          return (
            d.getFullYear() === selectedYear &&
            d.getMonth() === i &&
            resolveStatus(a) === "concluido"
          );
        })
        .reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0);
      return { name, total, isCurrent: i === selectedMonth };
    });
  }, [appointments, selectedYear, selectedMonth]);

  // ── Período seleccionado (mês + ano) — exclui cancelados ────────
  const periodAll = useMemo(() => {
    return appointments.filter((a) => {
      const d = new Date(a.starts_at);
      if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth)
        return false;
      return resolveStatus(a) !== "cancelado";
    });
  }, [appointments, selectedYear, selectedMonth]);

  const periodConfirmed = useMemo(
    () => periodAll.filter((a) => resolveStatus(a) === "concluido"),
    [periodAll],
  );

  const periodFuture = useMemo(
    () => periodAll.filter((a) => resolveStatus(a) === "em_aberto"),
    [periodAll],
  );

  const metrics = useMemo(() => {
    const revenue = periodConfirmed.reduce(
      (sum, a) => sum + Number(a.service?.price ?? 0),
      0,
    );
    const count = periodConfirmed.length;
    const avg = count > 0 ? revenue / count : 0;

    const serviceCount = {};
    periodConfirmed.forEach((a) => {
      const name = a.service?.name ?? "Desconhecido";
      serviceCount[name] = (serviceCount[name] ?? 0) + 1;
    });
    const topService = Object.entries(serviceCount).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return { revenue, count, avg, topService };
  }, [periodConfirmed]);

  const projectedRevenue = useMemo(
    () =>
      periodFuture.reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0),
    [periodFuture],
  );

  // ── Receita por serviço (gráfico vertical) ──────────────────────
  const revenueByService = useMemo(() => {
    const map = {};
    periodConfirmed.forEach((a) => {
      const name = a.service?.name ?? "Desconhecido";
      map[name] = (map[name] ?? 0) + Number(a.service?.price ?? 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, total]) => ({ name, total }));
  }, [periodConfirmed]);

  function handleExport() {
    const rows = periodConfirmed.map((a) => ({
      date: formatDate(a.starts_at),
      client_name: a.client_name,
      service_name: a.service?.name ?? "",
      price: a.service?.price ?? 0,
      status: STATUS_LABEL[resolveStatus(a)] ?? resolveStatus(a),
    }));
    exportFinancialCSV(rows);
  }

  return (
    <div className="db-page">
      {/* ── Cabeçalho ─────────────────────────────────────────── */}
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
          disabled={loading || periodConfirmed.length === 0}
        >
          <RiDownloadLine aria-hidden="true" />
          Exportar CSV
        </button>
      </div>

      {error && <p className="sch-error">{error}</p>}

      {/* ── Selector de período ───────────────────────────────── */}
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

      {/* ── 5 cards ───────────────────────────────────────────── */}
      <div className="pg-stats-grid">
        <div className="pg-stat-card">
          <p className="pg-stat-label">Receita total</p>
          <div>
            <p className="pg-stat-value">
              {loading ? "—" : formatPrice(totalRevenue)}
            </p>
            <p className="pg-stat-meta">
              {allConfirmed.length} serviços no total
            </p>
          </div>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Receita do mês</p>
          <div>
            <p className="pg-stat-value">
              {loading ? "—" : formatPrice(metrics.revenue)}
            </p>
            <p className="pg-stat-meta">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Receita prevista</p>
          <div>
            <p className="pg-stat-value">
              {loading ? "—" : formatPrice(projectedRevenue)}
            </p>
            <p className="pg-stat-meta">
              {periodFuture.length} agend. futuros
            </p>
          </div>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Serviço mais popular</p>
          <div>
            <p className="pg-stat-value" style={{ fontSize: "var(--text-lg)" }}>
              {loading ? "—" : metrics.topService ? metrics.topService[0] : "—"}
            </p>
            {metrics.topService && (
              <p className="pg-stat-meta">
                {metrics.topService[1]} vezes este mês
              </p>
            )}
          </div>
        </div>

        <div className="pg-stat-card">
          <p className="pg-stat-label">Transacções confirmadas</p>
          <div>
            <p className="pg-stat-value">{loading ? "—" : metrics.count}</p>
            <p className="pg-stat-meta">
              {MONTH_NAMES[selectedMonth]} {selectedYear}
            </p>
          </div>
        </div>
      </div>

      {/* ── Evolução mensal ───────────────────────────────────── */}
      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Evolução mensal</h2>
          <span className="pg-section-meta">{selectedYear}</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={monthlyData}
            barSize={28}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${v}€`}
              tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "var(--color-surface-2)" }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {monthlyData.map((entry, index) => (
                <Cell
                  key={index}
                  fill="var(--color-brand)"
                  fillOpacity={entry.isCurrent ? 1 : 0.25}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Receita por serviço (barras verticais) ────────────── */}
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
              Os dados aparecem quando há serviços realizados.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={revenueByService}
              barSize={36}
              margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${v}€`}
                tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
                axisLine={false}
                tickLine={false}
                width={48}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--color-surface-2)" }}
              />
              <Bar
                dataKey="total"
                fill="var(--color-brand)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Tabela de transacções ─────────────────────────────── */}
      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Transacções confirmadas</h2>
          <span className="pg-section-meta">
            {periodConfirmed.length} registos
          </span>
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
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: 99,
                          background:
                            a.status === "concluido" ? "#E1F5EE" : "#F5F3FF",
                          color:
                            a.status === "concluido" ? "#0F6E56" : "#7C3AED",
                        }}
                      >
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
