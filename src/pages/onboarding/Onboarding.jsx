// src/pages/onboarding/Onboarding.jsx

// src/pages/onboarding/Onboarding.jsx

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
  FiCopy,
  FiLayout,
} from "react-icons/fi";
import logo from "../../assets/logo.svg";
import "./Onboarding.css";

const DAYS = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" },
];

const initialHours = DAYS.map((day) => ({
  day_of_week: day.id,
  label: day.label,
  is_active: day.id >= 1 && day.id <= 5,
  intervals: [{ start_time: "09:00", end_time: "18:00" }],
}));

const STEP_LABELS = ["Dados", "Identidade", "Horários", "Confirmação"];

const PUBLIC_BASE = "https://agendly.app/p";

function generateSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getInitials(businessName) {
  if (!businessName) return "?";
  const stopWords = new Set(["do", "da", "de", "dos", "das", "e", "o", "a"]);
  const words = businessName
    .trim()
    .split(/\s+/)
    .filter((w) => !stopWords.has(w.toLowerCase()));
  if (words.length === 0) return businessName.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasOverlappingIntervals(intervals) {
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

function BusinessAvatar({ url, businessName, className }) {
  if (url) {
    return <img src={url} alt={businessName} className={className} />;
  }
  return (
    <div className={`${className} onboarding-initials-avatar`}>
      {getInitials(businessName)}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateBusiness } = useBusiness();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState(null);

  const [workingHours, setWorkingHours] = useState(initialHours);

  const publicUrl = `${PUBLIC_BASE}/${slug}`;

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

  async function checkSlug(slugToCheck) {
    const target = slugToCheck ?? slug;
    if (!target) return true;
    setCheckingSlug(true);
    const { data } = await supabase
      .from("business")
      .select("id")
      .eq("slug", target)
      .maybeSingle();
    const available = !data;
    setSlugAvailable(available);
    setCheckingSlug(false);
    return available;
  }

  async function handleStep1() {
    if (!name || !slug) {
      setError("Nome e URL são obrigatórios.");
      return;
    }
    if (phone && !/^\+?[\d\s\-()]{8,20}$/.test(phone)) {
      setError("Telefone inválido.");
      return;
    }
    const available = await checkSlug(slug);
    if (!available) {
      setError("Este slug já está a ser usado. Escolhe outro.");
      return;
    }
    setError(null);
    setStep(2);
  }

  // CORREÇÃO 1 — revogar o URL anterior antes de criar um novo, evitando memory leak
  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("A logo não pode exceder 2 MB.");
      e.target.value = "";
      return;
    }
    setError(null);
    setLogoFile(file);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
  }

  function handleStep2() {
    setError(null);
    setStep(3);
  }

  async function uploadLogo() {
    if (!logoFile) return null;
    const ext = logoFile.name.split(".").pop().toLowerCase();
    const path = `logos/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("business-assets")
      .upload(path, logoFile, {
        upsert: true,
        contentType: logoFile.type,
      });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage
      .from("business-assets")
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleFinish() {
    for (const day of workingHours) {
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

    for (const day of workingHours) {
      if (!day.is_active || day.intervals.length < 2) continue;
      if (hasOverlappingIntervals(day.intervals)) {
        setError(
          `Os intervalos de ${day.label} estão sobrepostos. Corrige antes de continuar.`,
        );
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const logoUrl = await uploadLogo();

      // CORREÇÃO 2 — re-verificar o slug antes de inserir, para apanhar conflitos
      // que possam ter surgido enquanto o utilizador percorria os passos anteriores
      const stillAvailable = await checkSlug(slug);
      if (!stillAvailable) {
        setError(
          "O slug já não está disponível. Volta ao primeiro passo e escolhe outro.",
        );
        setLoading(false);
        return;
      }

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

      updateBusiness({
        id: user.id,
        name,
        slug,
        phone,
        description,
        logo_url: logoUrl,
        is_active: true,
      });

      setSavedLogoUrl(logoUrl);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar os dados. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = publicUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleDay(dayId) {
    setWorkingHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayId ? { ...h, is_active: !h.is_active } : h,
      ),
    );
  }

  function updateInterval(dayId, idx, field, value) {
    setWorkingHours((prev) =>
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

  function addInterval(dayId) {
    setWorkingHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayId
          ? {
            ...h,
            intervals: [
              ...h.intervals,
              { start_time: "09:00", end_time: "18:00" },
            ],
          }
          : h,
      ),
    );
  }

  function removeInterval(dayId, idx) {
    setWorkingHours((prev) =>
      prev.map((h) => {
        if (h.day_of_week !== dayId || h.intervals.length === 1) return h;
        return { ...h, intervals: h.intervals.filter((_, i) => i !== idx) };
      }),
    );
  }

  return (
    <div className="onboarding-container">
      <header className="onboarding-header">
        <img src={logo} alt="Agendly" className="onboarding-logo" />
        <span>Agendly</span>
      </header>

      <div className="onboarding-progress">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`onboarding-progress-step
              ${step >= n ? "active" : ""}
              ${step > n ? "done" : ""}`}
          >
            <div className="onboarding-progress-dot">
              {step > n || (step === 4 && n === 4) ? <FiCheck /> : n}
            </div>
            <span>{STEP_LABELS[n - 1]}</span>
          </div>
        ))}
      </div>

      <div className="onboarding-card">
        {error && <p className="onboarding-error">{error}</p>}

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
                  onBlur={() => slug && checkSlug(slug)}
                  placeholder="barbearia-do-ze"
                  required
                />
                {checkingSlug && (
                  <span className="onboarding-slug-checking">
                    A verificar...
                  </span>
                )}
                {!checkingSlug && slugAvailable === true && (
                  <span className="onboarding-slug-ok">
                    <FiCheck /> Disponível
                  </span>
                )}
                {!checkingSlug && slugAvailable === false && (
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
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/[^\d\s+]/g, ""))
                  }
                  placeholder="+351 123456789"
                />
              </div>
              {phone && !/^\+?[\d\s\-()]{8,20}$/.test(phone) && (
                <p className="onboarding-field-hint">
                  Formato de telefone inválido.
                </p>
              )}
            </div>

            <button
              className="onboarding-btn"
              onClick={handleStep1}
              disabled={checkingSlug}
            >
              {checkingSlug ? (
                "A verificar..."
              ) : (
                <>
                  Continuar <FiArrowRight />
                </>
              )}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Personaliza o teu negócio</h2>
            <p className="onboarding-subtitle">
              A logo é opcional — se não carregares nenhuma, usamos as iniciais
              do nome.
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
                  <div className="onboarding-logo-placeholder onboarding-initials-avatar">
                    {name ? getInitials(name) : <FiImage />}
                  </div>
                )}

                <div className="onboarding-logo-actions">
                  <label htmlFor="logo-upload" className="onboarding-logo-btn">
                    {logoPreview ? "Alterar logo" : "Carregar logo"}
                  </label>
                  {logoPreview && (
                    <button
                      type="button"
                      className="onboarding-logo-remove"
                      onClick={() => {
                        // CORREÇÃO 1 (cont.) — revogar ao remover também
                        URL.revokeObjectURL(logoPreview);
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                    >
                      <FiTrash2 /> Remover
                    </button>
                  )}
                </div>

                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleLogoChange}
                  style={{ display: "none" }}
                />
              </div>
              <p className="onboarding-field-hint">
                PNG, JPG ou WebP · máx. 2 MB
              </p>
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

        {step === 3 && (
          <>
            <h2>Quando trabalhas?</h2>
            <p className="onboarding-subtitle">
              Define os teus dias e horários. Podes adicionar múltiplos
              intervalos por dia.
            </p>

            <div className="onboarding-hours">
              {workingHours.map((h) => (
                <div
                  key={h.day_of_week}
                  className={`onboarding-day-block ${h.is_active ? "is-active" : ""}`}
                >
                  <div className="onboarding-day-header">
                    <button
                      type="button"
                      className={`onboarding-toggle ${h.is_active ? "on" : "off"}`}
                      onClick={() => !loading && toggleDay(h.day_of_week)}
                      disabled={loading}
                      aria-label={`${h.is_active ? "Desativar" : "Ativar"} ${h.label}`}
                    >
                      <span className="onboarding-toggle-thumb" />
                    </button>
                    <span className="onboarding-day-label">{h.label}</span>

                    {h.is_active && (
                      <button
                        type="button"
                        className="onboarding-add-interval"
                        onClick={() => !loading && addInterval(h.day_of_week)}
                        disabled={loading}
                        title="Adicionar intervalo"
                      >
                        <FiPlus /> Adicionar
                      </button>
                    )}
                    {!h.is_active && (
                      <span className="onboarding-day-closed">Fechado</span>
                    )}
                  </div>

                  {h.is_active && (
                    <div className="onboarding-intervals">
                      {h.intervals.map((interval, i) => (
                        <div key={i} className="onboarding-interval-row">
                          <input
                            type="time"
                            value={interval.start_time}
                            disabled={loading}
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
                            disabled={loading}
                            onChange={(e) =>
                              updateInterval(
                                h.day_of_week,
                                i,
                                "end_time",
                                e.target.value,
                              )
                            }
                          />
                          {h.intervals.length > 1 && (
                            <button
                              type="button"
                              className="onboarding-remove-interval"
                              onClick={() =>
                                !loading && removeInterval(h.day_of_week, i)
                              }
                              disabled={loading}
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
                disabled={loading}
              >
                <FiArrowLeft /> Anterior
              </button>
              <button
                className="onboarding-btn"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? (
                  "A guardar..."
                ) : (
                  <>
                    Guardar e continuar <FiArrowRight />
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="onboarding-success-icon">
              <FiCheck />
            </div>
            <h2>O teu negócio está pronto!</h2>
            <p className="onboarding-subtitle">
              Partilha o teu link com os clientes e começa a receber
              agendamentos.
            </p>

            <div className="onboarding-summary">
              <div className="onboarding-summary-business">
                <BusinessAvatar
                  url={savedLogoUrl}
                  businessName={name}
                  className="onboarding-summary-logo"
                />
                <div>
                  <p className="onboarding-summary-name">{name}</p>
                  {description && (
                    <p className="onboarding-summary-description">
                      {description}
                    </p>
                  )}
                </div>
              </div>

              <div className="onboarding-summary-details">
                {phone && (
                  <div className="onboarding-summary-row">
                    <FiPhone />
                    <span>{phone}</span>
                  </div>
                )}
                <div className="onboarding-summary-row">
                  <FiCheck />
                  <span>
                    {workingHours.filter((h) => h.is_active).length} dias
                    configurados
                  </span>
                </div>
              </div>
            </div>

            <div className="onboarding-link-box">
              <p className="onboarding-link-label">O teu link de agendamento</p>
              <div className="onboarding-link-row">
                <span className="onboarding-link-url">{publicUrl}</span>
                <button
                  type="button"
                  className={`onboarding-copy-btn ${copied ? "copied" : ""}`}
                  onClick={handleCopyLink}
                >
                  {copied ? <FiCheck /> : <FiCopy />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <button
              className="onboarding-btn"
              onClick={() => navigate("/dashboard", { replace: true })}
            >
              <FiLayout /> Ir para o dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}