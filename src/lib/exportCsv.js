// src/lib/exportCsv.js

/**
 * Converte um array de objectos em string CSV
 * @param {Object[]} rows - Array de objectos a exportar
 * @param {string[]} columns - Colunas a incluir (keys dos objectos)
 * @param {Object} headers - Mapeamento de key → label da coluna (opcional)
 * @returns {string}
 */

function toCSV(rows, columns, headers = {}) {
  if (!rows?.length) return "";

  // Cabeçalho
  const headerLine = columns.map((col) => `"${headers[col] ?? col}"`).join(",");

  // Linhas de dados
  const dataLines = rows.map((row) =>
    columns
      .map((col) => {
        const value = row[col] ?? "";
        const str = String(value).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(","),
  );

  return [headerLine, ...dataLines].join("\n");
}

/**
 * Descarrega um ficheiro CSV no browser
 * @param {string} content - Conteúdo CSV
 * @param {string} filename - Nome do ficheiro (sem extensão)
 */

function downloadCSV(content, filename) {
  // Garante que o Excel abra correctamente com caracteres especiais
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Liberta a URL após o download
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Exporta agendamentos para CSV
 * @param {Object[]} appointments - Array de agendamentos
 */

export function exportAppointmentsCSV(appointments) {
  const columns = [
    "client_name",
    "client_email",
    "client_phone",
    "service_name",
    "starts_at",
    "ends_at",
    "status",
    "notes",
  ];

  const headers = {
    client_name: "Nome do cliente",
    client_email: "Email",
    client_phone: "Telefone",
    service_name: "Serviço",
    starts_at: "Data e hora",
    ends_at: "Fim",
    status: "Estado",
    notes: "Notas",
  };

  // Formata os dados antes de exportar
  const rows = appointments.map((a) => ({
    client_name: a.client_name,
    client_email: a.client_email,
    client_phone: a.client_phone,
    service_name: a.service?.name ?? a.service_name ?? "",
    starts_at: a.starts_at ? new Date(a.starts_at).toLocaleString("pt-PT") : "",
    ends_at: a.ends_at ? new Date(a.ends_at).toLocaleString("pt-PT") : "",
    status: a.status,
    notes: a.notes ?? "",
  }));

  const csv = toCSV(rows, columns, headers);
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `agendamentos_${date}`);
}

/**
 * Exporta dados financeiros para CSV
 * @param {Object[]} rows - Array de linhas financeiras
 */

export function exportFinancialCSV(rows) {
  const columns = ["date", "client_name", "service_name", "price", "status"];

  const headers = {
    date: "Data",
    client_name: "Cliente",
    service_name: "Serviço",
    price: "Valor (€)",
    status: "Estado",
  };

  const csv = toCSV(rows, columns, headers);
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `financeiro_${date}`);
}

/**
 * Exporta lista de clientes para CSV
 * @param {Object[]} clients - Array de clientes
 */

export function exportClientsCSV(clients) {
  const columns = [
    "client_name",
    "client_email",
    "client_phone",
    "total_visits",
    "total_spent",
    "last_visit",
  ];

  const headers = {
    client_name: "Nome",
    client_email: "Email",
    client_phone: "Telefone",
    total_visits: "Visitas",
    total_spent: "Total gasto (€)",
    last_visit: "Última visita",
  };

  const csv = toCSV(clients, columns, headers);
  const date = new Date().toISOString().slice(0, 10);
  downloadCSV(csv, `clientes_${date}`);
}
