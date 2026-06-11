// Onboarding.jsx

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

// Lista de dias da semana com id numérico (0 = Domingo, 6 = Sábado)
const DAYS = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Segunda" },
  { id: 2, label: "Terça" },
  { id: 3, label: "Quarta" },
  { id: 4, label: "Quinta" },
  { id: 5, label: "Sexta" },
  { id: 6, label: "Sábado" },
];

// Estado inicial dos horários
const initialHours = DAYS.map((day) => ({
  day_of_week: day.id,
  label: day.label,
  is_active: day.id >= 1 && day.id <= 5,
  intervals: [{ start_time: "09:00", end_time: "18:00" }],
}));

// Etiquetas da barra de progresso
const STEP_LABELS = ["Dados", "Identidade", "Horários", "Confirmação"];

// Domínio público da app — usado para gerar o link de agendamento
const PUBLIC_BASE = "https://agendly.app/p";

// * Gera um slug URL-friendly a partir de um texto livre.
function generateSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFD") // separa letras de diacríticos
    .replace(/[\u0300-\u036f]/g, "") // remove diacríticos (ã → a, é → e)
    .replace(/[^a-z0-9\s-]/g, "") // remove caracteres inválidos
    .trim()
    .replace(/\s+/g, "-"); // substitui espaços por hífens
}

// Extrai as duas iniciais significativas do nome do negócio, ignorando palavras de ligação (artigos, preposições).
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

// Converte "HH:MM" em minutos totais
function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Verifica se um array de intervalos tem sobreposições
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

// Mostra a logo se existir; caso contrário, as iniciais coloridas
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
  const { user } = useAuth(); // utilizador autenticado (precisa do user.id)
  const { updateBusiness } = useBusiness(); // atualiza o contexto global do negócio

  // Estado de navegação
  const [step, setStep] = useState(1); // passo atual (1–4)
  const [loading, setLoading] = useState(false); // a guardar no Supabase
  const [error, setError] = useState(null); // mensagem de erro visível ao utilizador
  const [copied, setCopied] = useState(false); // feedback do botão "Copiar link"

  // Passo 1: Dados do negócio
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [slugAvailable, setSlugAvailable] = useState(null); // null=desconhecido, true/false
  const [checkingSlug, setCheckingSlug] = useState(false); // a consultar disponibilidade

  // Passo 2: Identidade visual
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState(null); // ficheiro File do input
  const [logoPreview, setLogoPreview] = useState(null); // URL temporária para preview
  const [savedLogoUrl, setSavedLogoUrl] = useState(null); // URL pública após upload

  // Passo 3: Horários
  const [workingHours, setWorkingHours] = useState(initialHours);

  // URL pública do negócio, construída a partir do slug introduzido
  const publicUrl = `${PUBLIC_BASE}/${slug}`;

  // Atualiza nome e gera slug automaticamente enquanto o utilizador escreve
  function handleNameChange(e) {
    const value = e.target.value;
    setName(value);
    setSlug(generateSlug(value));
    setSlugAvailable(null); // invalida verificação anterior
  }

  // Permite editar o slug manualmente (ex: encurtar ou personalizar)
  function handleSlugChange(e) {
    setSlug(generateSlug(e.target.value));
    setSlugAvailable(null);
  }

  // Consulta o Supabase para verificar se o slug já está em uso.
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

  // Valida o passo 1 e avança para o passo 2.
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

  // Valida e armazena o ficheiro de logo selecionado, rejeitando tamanho acima de 2 MB
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
    setLogoPreview(URL.createObjectURL(file));
  }

  // Avança do passo 2 para o passo 3
  function handleStep2() {
    setError(null);
    setStep(3);
  }

  // Upload da logo para o Supabase Storage
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

  // Valida os horários, faz upload da logo, insere o negócio e os horários no Supabase, e avança para a confirmação.
  async function handleFinish() {
    // Garante que início < fim em cada intervalo
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

    // Garante que não há sobreposição entre intervalos do mesmo dia
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
      // Faz upload da logo (pode ser null se o utilizador não carregou nenhuma)
      const logoUrl = await uploadLogo();

      // Insere o negócio na tabela "business". O id é o mesmo do utilizador autenticado
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

      // Cada intervalo de cada dia ativo gera uma linha em "working_hours"
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

      // Atualiza o contexto global para que o resto da app
      updateBusiness({
        id: user.id,
        name,
        slug,
        phone,
        description,
        logo_url: logoUrl,
        is_active: true,
      });

      // Guarda a URL da logo antes de mudar de passo
      setSavedLogoUrl(logoUrl);
      setStep(4);
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar os dados. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  // Copiar link público
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

  // Liga/desliga um dia da semana
  function toggleDay(dayId) {
    setWorkingHours((prev) =>
      prev.map((h) =>
        h.day_of_week === dayId ? { ...h, is_active: !h.is_active } : h,
      ),
    );
  }

  // Atualiza o valor de start_time ou end_time de um intervalo específico
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

  // Adiciona um novo intervalo ao dia
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

  // Remove um intervalo pelo índice — nunca remove se for o único
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
      {/* Cabeçalho com logo da aplicação */}
      <header className="onboarding-header">
        <img src={logo} alt="Agendly" className="onboarding-logo" />
        <span>Agendly</span>
      </header>

      {/* Barra de progresso — 4 passos */}
      <div className="onboarding-progress">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`onboarding-progress-step
              ${step >= n ? "active" : ""}
              ${step > n ? "done" : ""}`}
          >
            <div className="onboarding-progress-dot">
              {/* Mostra check nos passos completos e no passo 4 quando ativo */}
              {step > n || (step === 4 && n === 4) ? <FiCheck /> : n}
            </div>
            <span>{STEP_LABELS[n - 1]}</span>
          </div>
        ))}
      </div>

      <div className="onboarding-card">
        {/* Mensagem de erro global (aparece no topo do card) */}
        {error && <p className="onboarding-error">{error}</p>}

        {/* Passo 1 — Dados do negócio */}
        {step === 1 && (
          <>
            <h2>Conta-nos sobre o teu negócio</h2>
            <p className="onboarding-subtitle">
              Estes dados identificam o teu negócio na plataforma.
            </p>

            {/* Nome do negócio — gera slug automaticamente */}
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

            {/* Slug / URL pública */}
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
                {/* Indicador de estado da verificação do slug */}
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
              {/* Pré-visualização da URL completa */}
              {slug && (
                <p className="onboarding-slug-preview">
                  agendly.app/p/<strong>{slug}</strong>
                </p>
              )}
            </div>

            {/* Telefone — opcional, mas com formato validado */}
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
                  placeholder="+351 000 000 000"
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

        {/* Passo 2 — Identidade visual */}
        {step === 2 && (
          <>
            <h2>Personaliza o teu negócio</h2>
            <p className="onboarding-subtitle">
              A logo é opcional — se não carregares nenhuma, usamos as iniciais
              do nome.
            </p>

            {/* Upload de logo */}
            <div className="onboarding-field">
              <label>Logo</label>
              <div className="onboarding-logo-upload">
                {logoPreview ? (
                  // Mostra preview da imagem selecionada
                  <img
                    src={logoPreview}
                    alt="Preview"
                    className="onboarding-logo-preview"
                  />
                ) : (
                  // Mostra as iniciais do nome já introduzido
                  <div className="onboarding-logo-placeholder onboarding-initials-avatar">
                    {name ? getInitials(name) : <FiImage />}
                  </div>
                )}

                <div className="onboarding-logo-actions">
                  <label htmlFor="logo-upload" className="onboarding-logo-btn">
                    {logoPreview ? "Alterar logo" : "Carregar logo"}
                  </label>
                  {/* Botão de remover — só aparece se já há uma logo */}
                  {logoPreview && (
                    <button
                      type="button"
                      className="onboarding-logo-remove"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                      }}
                    >
                      <FiTrash2 /> Remover
                    </button>
                  )}
                </div>

                {/* Input de ficheiro oculto — acionado pelo label acima */}
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

            {/* Descrição do negócio */}
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

        {/* Passo 3 — Horários de funcionamento */}
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
                  {/* Cabeçalho do dia: toggle + nome + botão adicionar */}
                  <div className="onboarding-day-header">
                    <button
                      type="button"
                      className={`onboarding-toggle ${h.is_active ? "on" : "off"}`}
                      onClick={() => !loading && toggleDay(h.day_of_week)}
                      disabled={loading} // bloqueia interações durante o submit
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

                  {/* Intervalos de horário — só visíveis se o dia estiver ativo */}
                  {h.is_active && (
                    <div className="onboarding-intervals">
                      {h.intervals.map((interval, i) => (
                        <div key={i} className="onboarding-interval-row">
                          {/* Hora de início */}
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
                          {/* Hora de fim */}
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
                          {/* Botão de remover — só aparece se houver mais de 1 intervalo */}
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

        {/* Passo 4 — Confirmação */}
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

            {/* Resumo do negócio criado */}
            <div className="onboarding-summary">
              <div className="onboarding-summary-business">
                {/* Avatar: logo ou iniciais conforme o utilizador carregou ou não */}
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

            {/* Link público com botão de copiar */}
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

            {/* Navega para o dashboard — replace:true evita voltar ao onboarding */}
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
