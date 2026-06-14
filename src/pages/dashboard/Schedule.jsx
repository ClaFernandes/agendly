// src/pages/dashboard/Schedule.jsx

import { useState, useEffect } from "react";
import { RiAddLine, RiDeleteBinLine, RiSaveLine } from "react-icons/ri";
import { supabase } from "../../lib/supabase";
import { useBusiness } from "../../context/BusinessContext";
import "./Dashboard.css";

// Dias da semana (0 = Domingo, 6 = Sábado)
const DAYS = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" },
];

// Converte "HH:MM" em minutos totais para comparação numérica
function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Verifica se há sobreposição entre intervalos de um dia
function hasOverlap(intervals) {
  const sorted = [...intervals].sort(
    (a, b) => toMinutes(a.start_time) - toMinutes(b.start_time),
  );
  for (let i = 0; i < sorted.length - 1; i++) {
    if (toMinutes(sorted[i].end_time) > toMinutes(sorted[i + 1].start_time)) {
      return true;
    }
  }
  return false;
}

export default function Schedule() {
  const { business } = useBusiness();

  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Carrega os horários do Supabase e agrupa por dia
  useEffect(() => {
    if (!business?.id) return;

    async function fetchHours() {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("working_hours")
          .select("*")
          .eq("business_id", business.id)
          .order("day_of_week")
          .order("start_time");

        if (error) throw error;

        // Para cada dia da semana, agrupa os intervalos existentes
        const byDay = DAYS.map((day) => {
          const dayRows = data?.filter((r) => r.day_of_week === day.id) || [];
          return {
            day_of_week: day.id,
            label: day.label,
            is_active: dayRows.length > 0,
            intervals:
              dayRows.length > 0
                ? dayRows.map((r) => ({
                    id: r.id,
                    start_time: r.start_time.slice(0, 5), // "HH:MM:SS" → "HH:MM"
                    end_time: r.end_time.slice(0, 5),
                  }))
                : [{ id: null, start_time: "09:00", end_time: "18:00" }],
          };
        });

        setHours(byDay);
      } catch (err) {
        console.error("Erro ao carregar horários:", err);
        setError("Erro ao carregar horários.");
      } finally {
        setLoading(false);
      }
    }

    fetchHours();
  }, [business?.id]);

  // Liga ou desliga um dia da semana
  function toggleDay(dayId) {
    setHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayId ? { ...h, is_active: !h.is_active } : h,
      ),
    );
  }

  // Atualiza start_time ou end_time de um intervalo específico
  function updateInterval(dayId, idx, field, value) {
    setHours((prev) =>
      prev.map((h) => {
        if (h.day_of_week !== dayId) return h;
        return {
          ...h,
          intervals: h.intervals.map((interval, i) =>
            i === idx ? { ...interval, [field]: value } : interval,
          ),
        };
      }),
    );
  }

  // Adiciona um novo intervalo ao dia com valores padrão
  function addInterval(dayId) {
    setHours((prev) =>
      prev.map((h) => {
        if (h.day_of_week !== dayId) return h;
        return {
          ...h,
          intervals: [
            ...h.intervals,
            { id: null, start_time: "09:00", end_time: "18:00" },
          ],
        };
      }),
    );
  }

  // Remove um intervalo pelo índice — nunca remove se for o único
  function removeInterval(dayId, idx) {
    setHours((prev) =>
      prev.map((h) => {
        if (h.day_of_week !== dayId || h.intervals.length === 1) return h;
        return {
          ...h,
          intervals: h.intervals.filter((_, i) => i !== idx),
        };
      }),
    );
  }

  // Guarda os horários: apaga os existentes e insere os novos
  async function handleSave() {
    setError(null);
    setSuccess(false);

    // Validação 1: início tem de ser antes do fim
    for (const day of hours) {
      if (!day.is_active) continue;
      for (const interval of day.intervals) {
        if (toMinutes(interval.start_time) >= toMinutes(interval.end_time)) {
          setError(
            `Em ${day.label}, o horário de início tem de ser anterior ao de fim.`,
          );
          return;
        }
      }
    }

    // Validação 2: sem sobreposições entre intervalos do mesmo dia
    for (const day of hours) {
      if (!day.is_active || day.intervals.length < 2) continue;
      if (hasOverlap(day.intervals)) {
        setError(`Os intervalos de ${day.label} estão sobrepostos.`);
        return;
      }
    }

    setSaving(true);

    try {
      // Apaga todos os horários existentes deste negócio
      const { error: deleteError } = await supabase
        .from("working_hours")
        .delete()
        .eq("business_id", business.id);
      if (deleteError) throw deleteError;

      // Constrói o array de linhas a inserir (apenas dias ativos)
      const toInsert = [];
      hours.forEach((day) => {
        if (!day.is_active) return;
        day.intervals.forEach((interval) => {
          toInsert.push({
            business_id: business.id,
            day_of_week: day.day_of_week,
            start_time: interval.start_time,
            end_time: interval.end_time,
            is_active: true,
          });
        });
      });

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("working_hours")
          .insert(toInsert);
        if (insertError) throw insertError;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar os horários.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="db-page">
        <div className="db-loading">
          <span className="db-loading-text">A carregar horários...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="db-page">
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Horários</h1>
          <p className="pg-subtitle">
            Define os dias e horas em que o teu negócio está disponível.
          </p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <RiSaveLine aria-hidden="true" />
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </div>

      {error && <p className="sch-error">{error}</p>}
      {success && (
        <p className="sch-success">Horários guardados com sucesso!</p>
      )}

      <div className="pg-section" style={{ padding: 0, overflow: "hidden" }}>
        {hours.map((h, dayIdx) => (
          <div
            key={h.day_of_week}
            className={`sch-day ${h.is_active ? "sch-day--active" : ""} ${dayIdx < hours.length - 1 ? "sch-day--bordered" : ""}`}
          >
            <div className="sch-day-header">
              <button
                type="button"
                className={`sch-toggle ${h.is_active ? "sch-toggle--on" : "sch-toggle--off"}`}
                onClick={() => toggleDay(h.day_of_week)}
                disabled={saving}
              >
                <span className="sch-toggle-thumb" />
              </button>
              <span className="sch-day-label">{h.label}</span>
              {h.is_active ? (
                <button
                  type="button"
                  className="sch-add-btn"
                  onClick={() => addInterval(h.day_of_week)}
                  disabled={saving}
                >
                  <RiAddLine aria-hidden="true" /> Adicionar
                </button>
              ) : (
                <span className="sch-closed">Fechado</span>
              )}
            </div>

            {h.is_active && (
              <div className="sch-intervals">
                {h.intervals.map((interval, i) => (
                  <div key={i} className="sch-interval-row">
                    <input
                      type="time"
                      value={interval.start_time}
                      disabled={saving}
                      onChange={(e) =>
                        updateInterval(
                          h.day_of_week,
                          i,
                          "start_time",
                          e.target.value,
                        )
                      }
                      className="sch-time-input"
                    />
                    <span className="sch-sep">—</span>
                    <input
                      type="time"
                      value={interval.end_time}
                      disabled={saving}
                      onChange={(e) =>
                        updateInterval(
                          h.day_of_week,
                          i,
                          "end_time",
                          e.target.value,
                        )
                      }
                      className="sch-time-input"
                    />
                    {h.intervals.length > 1 && (
                      <button
                        type="button"
                        className="sch-remove-btn"
                        onClick={() => removeInterval(h.day_of_week, i)}
                        disabled={saving}
                      >
                        <RiDeleteBinLine />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
