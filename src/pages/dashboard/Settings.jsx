// src/pages/dashboard/Settings.jsx

import { useState, useEffect } from "react";
import {
  RiBriefcaseLine,
  RiLinkM,
  RiPhoneLine,
  RiImageLine,
  RiSaveLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
} from "react-icons/ri";
import { supabase } from "../../lib/supabase";
import { useBusiness } from "../../context/BusinessContext";
import "./Dashboard.css";

// Gera slug URL-friendly a partir de texto livre
function generateSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Extrai iniciais significativas ignorando artigos e preposições
function getInitials(name) {
  if (!name) return "?";
  const stopWords = new Set(["do", "da", "de", "dos", "das", "e", "o", "a"]);
  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => !stopWords.has(w.toLowerCase()));
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function Settings() {
  const { business, updateBusiness } = useBusiness();

  // Campos do formulário
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Estado da logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  // Verificação de slug
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Estado de UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Preenche o formulário com os dados atuais do negócio
  useEffect(() => {
    if (!business) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(business.name ?? "");
    setSlug(business.slug ?? "");
    setPhone(business.phone ?? "");
    setDescription(business.description ?? "");
    setCurrentLogoUrl(business.logo_url ?? null);
    setRemoveLogo(false);
  }, [business]);

  // Verifica disponibilidade do slug na DB
  async function checkSlug(value) {
    if (!value || value === business?.slug) {
      setSlugAvailable(null);
      return true;
    }
    setCheckingSlug(true);
    try {
      const { data } = await supabase
        .from("business")
        .select("id")
        .eq("slug", value)
        .maybeSingle();
      const available = !data;
      setSlugAvailable(available);
      return available;
    } finally {
      setCheckingSlug(false);
    }
  }

  // Atualiza o slug automaticamente quando o nome muda
  function handleNameChange(e) {
    const value = e.target.value;
    setName(value);
    if (slug === generateSlug(name)) {
      setSlug(generateSlug(value));
      setSlugAvailable(null);
    }
  }

  function handleSlugChange(e) {
    setSlug(generateSlug(e.target.value));
    setSlugAvailable(null);
  }

  // Valida e armazena o ficheiro de logo (máx. 2 MB)
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
    setRemoveLogo(false);
  }

  // Remove a logo — marca flag para apagar na DB ao guardar
  function handleRemoveLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    setCurrentLogoUrl(null);
    setRemoveLogo(true);
  }

  // Faz upload da logo para o Supabase Storage
  // Retorna URL pública, URL atual, ou null se removida
  async function uploadLogo() {
    if (removeLogo) return null;
    if (!logoFile) return currentLogoUrl;
    const ext = logoFile.name.split(".").pop().toLowerCase();
    const path = `logos/${business.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("business-assets")
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage
      .from("business-assets")
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave() {
    setError(null);
    setSuccess(false);

    if (!name.trim()) {
      setError("O nome do negócio é obrigatório.");
      return;
    }
    if (!slug.trim()) {
      setError("O URL público é obrigatório.");
      return;
    }
    if (phone && !/^\+?[\d\s\-()]{8,20}$/.test(phone)) {
      setError("Formato de telefone inválido.");
      return;
    }

    // Verifica slug só se mudou em relação ao atual
    if (slug !== business?.slug) {
      const available = await checkSlug(slug);
      if (!available) {
        setError("Este URL já está a ser usado. Escolhe outro.");
        return;
      }
    }

    setSaving(true);

    try {
      const logoUrl = await uploadLogo();

      const { error: updateError } = await supabase
        .from("business")
        .update({
          name: name.trim(),
          slug: slug.trim(),
          phone: phone.trim() || null,
          description: description.trim() || null,
          logo_url: logoUrl,
        })
        .eq("id", business.id);

      if (updateError) throw updateError;

      // Atualiza o contexto global com os novos dados
      updateBusiness({
        name: name.trim(),
        slug: slug.trim(),
        phone: phone.trim() || null,
        description: description.trim() || null,
        logo_url: logoUrl,
      });

      setCurrentLogoUrl(logoUrl);
      setLogoFile(null);
      setLogoPreview(null);
      setRemoveLogo(false);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Erro ao guardar as alterações. Tenta novamente.");
    } finally {
      setSaving(false);
    }
  }

  // URL pública usando domínio fixo de produção
  const PUBLIC_BASE = "https://agendly.app/p";
  const publicUrl = business?.slug ? `${PUBLIC_BASE}/${business.slug}` : null;

  return (
    <div className="db-page">
      {/* Cabeçalho */}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Negócio</h1>
          <p className="pg-subtitle">
            Edita os dados públicos e de identificação do teu negócio.
          </p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <RiSaveLine aria-hidden="true" />
          {saving ? "A guardar..." : "Guardar"}
        </button>
      </div>

      {/* Feedback de erro e sucesso */}
      {error && <p className="set-error">{error}</p>}
      {success && (
        <p className="set-success">Alterações guardadas com sucesso!</p>
      )}

      {/* Link público com botão de abrir */}
      {publicUrl && (
        <div className="set-public-link pg-section">
          <p className="set-public-label">O teu link de agendamento</p>
          <div className="set-public-row">
            <span className="set-public-url">{publicUrl}</span>

            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <RiExternalLinkLine aria-hidden="true" />
              Abrir
            </a>
          </div>
        </div>
      )}

      {/* Identidade visual — logo */}
      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Identidade visual</h2>
        </div>

        <div className="set-logo-field">
          {/* Preview da logo ou iniciais como fallback */}
          <div className="set-logo-preview">
            {logoPreview || currentLogoUrl ? (
              <img
                src={logoPreview ?? currentLogoUrl}
                alt="Logo"
                className="set-logo-img"
              />
            ) : (
              <div className="set-logo-initials">{getInitials(name)}</div>
            )}
          </div>

          <div className="set-logo-actions">
            {/* Label sobre input oculto — abre o seletor de ficheiro */}
            <label htmlFor="logo-upload" className="btn-secondary set-logo-btn">
              <RiImageLine aria-hidden="true" />
              {logoPreview || currentLogoUrl ? "Alterar logo" : "Carregar logo"}
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleLogoChange}
              style={{ display: "none" }}
            />
            {/* Botão remover — só aparece se houver logo */}
            {(logoPreview || currentLogoUrl) && (
              <button
                type="button"
                className="set-logo-remove"
                onClick={handleRemoveLogo}
              >
                <RiDeleteBinLine aria-hidden="true" />
                Remover logo
              </button>
            )}
            <p className="set-logo-hint">PNG, JPG ou WebP · máx. 2 MB</p>
          </div>
        </div>
      </div>

      {/* Dados do negócio */}
      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Dados do negócio</h2>
        </div>

        <div className="set-form">
          {/* Nome */}
          <div className="set-field">
            <label htmlFor="set-name" className="set-label">
              Nome do negócio <span className="set-required">*</span>
            </label>
            <div className="set-input-wrapper">
              <RiBriefcaseLine className="set-input-icon" aria-hidden="true" />
              <input
                id="set-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Barbearia do Zé"
                className="set-input"
              />
            </div>
          </div>

          {/* Slug / URL pública */}
          <div className="set-field">
            <label htmlFor="set-slug" className="set-label">
              URL pública <span className="set-required">*</span>
              <span className="set-label-hint">agendly.app/p/</span>
            </label>
            <div className="set-input-wrapper">
              <RiLinkM className="set-input-icon" aria-hidden="true" />
              <input
                id="set-slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                onBlur={() => checkSlug(slug)}
                placeholder="barbearia-do-ze"
                className="set-input"
              />
              {checkingSlug && (
                <span className="set-slug-checking">A verificar...</span>
              )}
              {!checkingSlug && slugAvailable === true && (
                <span className="set-slug-ok">Disponível</span>
              )}
              {!checkingSlug && slugAvailable === false && (
                <span className="set-slug-error">Indisponível</span>
              )}
            </div>
            {slug && (
              <p className="set-slug-preview">
                agendly.app/p/<strong>{slug}</strong>
              </p>
            )}
          </div>

          {/* Telefone */}
          <div className="set-field">
            <label htmlFor="set-phone" className="set-label">
              Telefone
            </label>
            <div className="set-input-wrapper">
              <RiPhoneLine className="set-input-icon" aria-hidden="true" />
              <input
                id="set-phone"
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^\d\s+\-()]/g, ""))
                }
                placeholder="+351 911 111 111"
                className="set-input"
              />
            </div>
            {phone && !/^\+?[\d\s\-()]{8,20}$/.test(phone) && (
              <p className="set-hint-error">Formato de telefone inválido.</p>
            )}
          </div>

          {/* Descrição */}
          <div className="set-field">
            <label htmlFor="set-description" className="set-label">
              Descrição
            </label>
            <textarea
              id="set-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do teu negócio..."
              rows={3}
              className="set-textarea"
            />
          </div>
        </div>
      </div>

      {/* Botão guardar no fundo da página */}
      <div className="sch-footer-actions">
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <RiSaveLine aria-hidden="true" />
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </div>
    </div>
  );
}
