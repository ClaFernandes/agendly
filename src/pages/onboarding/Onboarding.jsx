import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBusiness } from "../../context/BusinessContext";
import { supabase } from "../../lib/supabase";
import {
  FiBriefcase,
  FiLink,
  FiPhone,
  FiImage,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import logo from "../../assets/logo.svg";
import "./Onboarding.css";

// Dias da semana — 0 = domingo, 6 = sábado
const DAYS = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" },
];

// Estado inicial dos horários. Cada dia tem um array de intervalos para múltiplos períodos por dia
const initialHours = DAYS.map((day) => ({
  day_of_week: day.id,
  label: day.label,
  is_active: day.id >= 1 && day.id <= 5,
  intervals: [{ start_time: "09:00", end_time: "18:00" }],
}));

export default function Onboarding() {
  // Hooks de navegação e contexto
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateBusiness } = useBusiness();

  // Estados para gestão do onboarding
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Passo 1 — Dados do negócio
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [slugAvailable, setSlugAvailable] = useState(null);

  // Passo 2 — Identidade visual
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Passo 3 — Horários
  const [workingHours, setWorkingHours] = useState(initialHours);

  // Gera slug a partir do nome — remove acentos, espaços → hífens
  function generateSlug(value) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  // Atualiza nome e slug simultaneamente, e reseta a disponibilidade do slug
  function handleNameChange(e) {
    const value = e.target.value;
    setName(value);
    setSlug(generateSlug(value));
    setSlugAvailable(null);
  }

  function handleSlugChange(e) {
    setSlug(generateSlug(e.target.value));
    setSlugAvailable(null);
  }

  // Verifica disponibilidade do slug ao sair do campo
  async function checkSlug() {
    if (!slug) return;
    const { data } = await supabase
      .from("business")
      .select("id")
      .eq("slug", slug)
      .single();
    setSlugAvailable(!data);
  }

  // Upload da logo para o Supabase Storage
  async function uploadLogo() {
    if (!logoFile) return null;
    const ext = logoFile.name.split(".").pop();
    const path = `logos/${user.id}.${ext}`;
    const { error } = await supabase.storage
      .from("business-assets")
      .upload(path, logoFile, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage
      .from("business-assets")
      .getPublicUrl(path);
    return data.publicUrl;
  }

  // Preview da logo antes do upload
  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  // Navegação entre passos

  function handleStep1() {
    if (!name || !slug) {
      setError("Nome e URL são obrigatórios.");
      return;
    }
    if (slugAvailable === false) {
      setError("Este slug já está a ser usado. Escolhe outro.");
      return;
    }
    setError(null);
    setStep(2);
  }

  function handleStep2() {
    setError(null);
    setStep(3);
  }

  // Submete e vai para o dashboard
  async function handleFinish() {
    setLoading(true);
    setError(null);

    try {
      const logoUrl = await uploadLogo();

      // Insere o negócio na tabela business
      const { error: bizError } = await supabase.from("business").insert({
        id: user.id,
        name,
        slug,
        phone: phone || null,
        description: description || null,
        logo_url: logoUrl,
        is_active: true,
      });
      if (bizError) throw bizError;

      // Prepara os horários para inserir na tabela working_hours
      const hoursToInsert = [];
      workingHours.forEach((day) => {
        if (!day.is_active) return;
        day.intervals.forEach((interval) => {
          hoursToInsert.push({
            business_id: user.id,
            day_of_week: day.day_of_week,
            start_time: interval.start_time,
            end_time: interval.end_time,
            is_active: true,
          });
        });
      });

      if (hoursToInsert.length > 0) {
        const { error: hoursError } = await supabase
          .from("working_hours")
          .insert(hoursToInsert);
        if (hoursError) throw hoursError;
      }

      // Atualiza o BusinessContext localmente para não precisar de recarregar a página
      updateBusiness({
        id: user.id,
        name,
        slug,
        phone,
        description,
        logo_url: logoUrl,
        is_active: true,
      });

      // Redireciona para o dashboard
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar os dados. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Alterna o estado ativo de um dia
  function toggleDay(dayId) {
    setWorkingHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayId ? { ...h, is_active: !h.is_active } : h,
      ),
    );
  }

  // Atualiza um campo (start_time ou end_time) de um intervalo específico
  function updateInterval(dayId, intervalIndex, field, value) {
    setWorkingHours((prev) =>
      prev.map((h) => {
        if (h.day_of_week !== dayId) return h;
        const newIntervals = h.intervals.map((interval, i) =>
          i === intervalIndex ? { ...interval, [field]: value } : interval,
        );
        return { ...h, intervals: newIntervals };
      }),
    );
  }

  // Adiciona um novo intervalo a um dia
  function addInterval(dayId) {
    setWorkingHours((prev) =>
      prev.map((h) => {
        if (h.day_of_week !== dayId) return h;
        return {
          ...h,
          intervals: [
            ...h.intervals,
            { start_time: "09:00", end_time: "18:00" },
          ],
        };
      }),
    );
  }

  // Remove um intervalo de um dia — mínimo de 1 intervalo por dia
  function removeInterval(dayId, intervalIndex) {
    setWorkingHours((prev) =>
      prev.map((h) => {
        if (h.day_of_week !== dayId) return h;
        if (h.intervals.length === 1) return h; // não remove o último
        return {
          ...h,
          intervals: h.intervals.filter((_, i) => i !== intervalIndex),
        };
      }),
    );
  }

  return (
    <div className="onboarding-container">
      {/* Header */}
      <header className="onboarding-header">
        <img src={logo} alt="Agendly" className="onboarding-logo" />
        <span>Agendly</span>
      </header>

      {/* Barra de progresso */}
      <div className="onboarding-progress">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`onboarding-progress-step ${step >= n ? "active" : ""} ${step > n ? "done" : ""}`}
          >
            <div className="onboarding-progress-dot">
              {step > n ? <FiCheck /> : n}
            </div>
            <span>
              {n === 1 && "Dados"}
              {n === 2 && "Identidade"}
              {n === 3 && "Horários"}
            </span>
          </div>
        ))}
      </div>

      {/* Card principal */}
      <div className="onboarding-card">
        {error && <p className="onboarding-error">{error}</p>}

        {/* Passo 1 — Dados do negócio */}
        {step === 1 && (
          <>
            <h2>Conta-nos sobre o teu negócio</h2>
            <p className="onboarding-subtitle">
              Estes dados identificam o teu negócio na plataforma.
            </p>

            <div className="onboarding-field">
              <label htmlFor="name">Nome do negócio *</label>
              <div className="onboarding-input-wrapper">
                <FiBriefcase className="onboarding-input-icon" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Barbearia do Zé"
                  required
                />
              </div>
            </div>

            <div className="onboarding-field">
              <label htmlFor="slug">
                URL pública *
                <span className="onboarding-label-hint">agendly.app/p/</span>
              </label>
              <div className="onboarding-input-wrapper">
                <FiLink className="onboarding-input-icon" />
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={handleSlugChange}
                  onBlur={checkSlug}
                  placeholder="barbearia-do-ze"
                  required
                />
                {slugAvailable === true && (
                  <span className="onboarding-slug-ok">
                    <FiCheck /> Disponível
                  </span>
                )}
                {slugAvailable === false && (
                  <span className="onboarding-slug-error">Indisponível</span>
                )}
              </div>
              {slug && (
                <p className="onboarding-slug-preview">
                  agendly.app/p/<strong>{slug}</strong>
                </p>
              )}
            </div>

            <div className="onboarding-field">
              <label htmlFor="phone">Telefone</label>
              <div className="onboarding-input-wrapper">
                <FiPhone className="onboarding-input-icon" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+351 910 000 000"
                />
              </div>
            </div>

            <button className="onboarding-btn" onClick={handleStep1}>
              Continuar <FiArrowRight />
            </button>
          </>
        )}

        {/* Passo 2 — Identidade visual */}
        {step === 2 && (
          <>
            <h2>Personaliza o teu negócio</h2>
            <p className="onboarding-subtitle">
              Adiciona uma logo e uma descrição para a tua página pública.
            </p>

            <div className="onboarding-field">
              <label>Logo</label>
              <div className="onboarding-logo-upload">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="onboarding-logo-preview"
                  />
                ) : (
                  <div className="onboarding-logo-placeholder">
                    <FiImage />
                    <span>PNG, JPG até 2MB</span>
                  </div>
                )}
                <label htmlFor="logo-upload" className="onboarding-logo-btn">
                  {logoPreview ? "Alterar logo" : "Carregar logo"}
                </label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleLogoChange}
                  style={{ display: "none" }}
                />
              </div>
            </div>

            <div className="onboarding-field">
              <label htmlFor="description">Descrição</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: A melhor barbearia de Lisboa"
                rows={3}
                className="onboarding-textarea"
              />
            </div>

            <div className="onboarding-actions">
              <button
                className="onboarding-btn-back"
                onClick={() => setStep(1)}
              >
                <FiArrowLeft /> Anterior
              </button>
              <button className="onboarding-btn" onClick={handleStep2}>
                Continuar <FiArrowRight />
              </button>
            </div>
          </>
        )}

        {/* Passo 3 — Horários */}
        {step === 3 && (
          <>
            <h2>Quando trabalhas?</h2>
            <p className="onboarding-subtitle">
              Define os teus dias e horários de funcionamento. Podes adicionar
              múltiplos intervalos por dia.
            </p>

            <div className="onboarding-hours">
              {workingHours.map((h) => (
                <div
                  key={h.day_of_week}
                  className={`onboarding-day-block ${h.is_active ? "is-active" : ""}`}
                >
                  {/* Cabeçalho do dia — toggle + nome */}
                  <div className="onboarding-day-header">
                    <button
                      type="button"
                      className={`onboarding-toggle ${h.is_active ? "on" : "off"}`}
                      onClick={() => toggleDay(h.day_of_week)}
                      aria-label={`${h.is_active ? "Desativar" : "Ativar"} ${h.label}`}
                    >
                      <span className="onboarding-toggle-thumb" />
                    </button>
                    <span className="onboarding-day-label">{h.label}</span>

                    {/* Botão para adicionar intervalo — só visível se o dia estiver ativo */}
                    {h.is_active && (
                      <button
                        type="button"
                        className="onboarding-add-interval"
                        onClick={() => addInterval(h.day_of_week)}
                        title="Adicionar intervalo"
                      >
                        <FiPlus /> Adicionar
                      </button>
                    )}

                    {!h.is_active && (
                      <span className="onboarding-day-closed">Fechado</span>
                    )}
                  </div>

                  {/* Intervalos só visíveis se o dia estiver ativo */}
                  {h.is_active && (
                    <div className="onboarding-intervals">
                      {h.intervals.map((interval, i) => (
                        <div key={i} className="onboarding-interval-row">
                          <input
                            type="time"
                            value={interval.start_time}
                            onChange={(e) =>
                              updateInterval(
                                h.day_of_week,
                                i,
                                "start_time",
                                e.target.value,
                              )
                            }
                          />
                          <span className="onboarding-interval-sep">—</span>
                          <input
                            type="time"
                            value={interval.end_time}
                            onChange={(e) =>
                              updateInterval(
                                h.day_of_week,
                                i,
                                "end_time",
                                e.target.value,
                              )
                            }
                          />
                          {/* Botão de remover — só aparece se houver mais de 1 intervalo */}
                          {h.intervals.length > 1 && (
                            <button
                              type="button"
                              className="onboarding-remove-interval"
                              onClick={() => removeInterval(h.day_of_week, i)}
                              title="Remover intervalo"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="onboarding-actions">
              <button
                className="onboarding-btn-back"
                onClick={() => setStep(2)}
              >
                <FiArrowLeft /> Anterior
              </button>
              <button
                className="onboarding-btn"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? "A guardar..." : "Ir para o dashboard"}
                {!loading && <FiArrowRight />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
