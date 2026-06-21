// src/pages/dashboard/Profile.jsx

import { useState, useEffect } from "react";
import {
  RiBriefcaseLine,
  RiLinkM,
  RiPhoneLine,
  RiImageLine,
  RiSaveLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiAlertLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useBusiness } from "../../context/BusinessContext";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

// Utilitários 
function generateSlug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function getInitials(name) {
  if (!name) return "?";
  const stopWords = new Set(["do", "da", "de", "dos", "das", "e", "o", "a"]);
  const words = name.trim().split(/\s+/).filter(w => !stopWords.has(w.toLowerCase()));
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Modal de confirmação de apagar conta 

function DeleteAccountModal({ onConfirm, onCancel, deleting }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal modal--sm"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
      >
        <div className="modal-header">
          <h2 id="delete-account-title" className="modal-title">Apagar conta</h2>
          <button className="modal-close" onClick={onCancel} aria-label="Fechar">×</button>
        </div>

        <div className="delete-modal-body">
          <div className="delete-modal-icon delete-modal-icon--danger">
            <RiAlertLine aria-hidden="true" />
          </div>
          <p className="delete-modal-text">
            Esta acção é <strong>irreversível</strong>.
          </p>
          <p className="delete-modal-subtext">
            Ao confirmar, todos os dados do teu negócio serão apagados permanentemente —
            serviços, horários, agendamentos, clientes favoritos e a tua conta.
            <br/><br/><strong>Os clientes com agendamentos abertos serão notificados por email.</strong>
          </p>

          {/* Checkbox de confirmação extra */}
          <label className="delete-account-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
            />
            Confirmo que quero apagar a minha conta e todos os dados associados.
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={deleting}>
            Cancelar
          </button>
          <button
            className="btn-danger"
            onClick={onConfirm}
            disabled={!confirmed || deleting}
          >
            <RiDeleteBinLine aria-hidden="true" />
            {deleting ? "A apagar..." : "Apagar conta definitivamente"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Página principal 

export default function Profile() {
  const { business, updateBusiness } = useBusiness();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Campos do formulário
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  // Logo
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  // Slug
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // UI
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Apagar conta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Preenche o formulário com os dados actuais
  useEffect(() => {
    if (!business) return;
    setName(business.name ?? "");
    setSlug(business.slug ?? "");
    setPhone(business.phone ?? "");
    setDescription(business.description ?? "");
    setCurrentLogoUrl(business.logo_url ?? null);
    setRemoveLogo(false);
  }, [business]);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
  }, [user]);

  // Slug 
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

  // Logo 
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

  function handleRemoveLogo() {
    setLogoFile(null);
    setLogoPreview(null);
    setCurrentLogoUrl(null);
    setRemoveLogo(true);
  }

  async function uploadLogo() {
    if (removeLogo) return null;
    if (!logoFile) return currentLogoUrl;
    const ext = logoFile.name.split(".").pop().toLowerCase();
    const path = `logos/${business.id}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("business-assets")
      .upload(path, logoFile, { upsert: true, contentType: logoFile.type });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("business-assets").getPublicUrl(path);
    return data.publicUrl;
  }

  // Guardar alterações 
  async function handleSave() {
    setError(null);
    setSuccess(false);

    if (!name.trim()) { setError("O nome do negócio é obrigatório."); return; }
    if (!slug.trim()) { setError("O URL público é obrigatório."); return; }
    if (phone && !/^\+?[\d\s\-()]{8,20}$/.test(phone)) {
      setError("Formato de telefone inválido.");
      return;
    }

    if (slug !== business?.slug) {
      const available = await checkSlug(slug);
      if (!available) { setError("Este URL já está a ser usado. Escolhe outro."); return; }
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

  // Apagar conta 
  async function handleDeleteAccount() {
    if (!user?.id) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      // Remove a logo do Storage se existir
      if (business?.logo_url) {
        // Extrai o path relativo a partir da URL pública
        const url = new URL(business.logo_url);
        const pathParts = url.pathname.split("/business-assets/");
        if (pathParts[1]) {
          await supabase.storage
            .from("business-assets")
            .remove([decodeURIComponent(pathParts[1])]);
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);
        
      if (profileError) throw profileError;

      // Apaga o utilizador do Auth via RPC 
      const { error: rpcError } = await supabase.rpc("delete_user_by_id", {
        user_id: user.id,
      });
      if (rpcError) throw rpcError;

      // Faz logout local e redireciona
      await logout();
      navigate("/login", { replace: true });

    } catch (err) {
      console.error("Erro ao apagar conta:", err);
      setDeleteError("Ocorreu um erro ao apagar a conta. Tenta novamente ou contacta o suporte.");
      setDeleting(false);
    }
  }

  const PUBLIC_BASE = "https://agendly.app/p";
  const publicUrl = business?.slug ? `${PUBLIC_BASE}/${business.slug}` : null;

  return (
    <div className="db-page">
      {/* Cabeçalho */}
      <div className="pg-header">
        <div>
          <h1 className="pg-title">Perfil</h1>
          <p className="pg-subtitle">Edita os dados públicos e de identificação do teu negócio.</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <RiSaveLine aria-hidden="true" />
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </div>

      {/* Feedback */}
      {error && <p className="set-error">{error}</p>}
      {success && <p className="set-success">Alterações guardadas com sucesso!</p>}
      {deleteError && <p className="set-error">{deleteError}</p>}

      {/* Link público */}
      {publicUrl && (
        <div className="set-public-link pg-section">
          <p className="set-public-label">O teu link de agendamento</p>
          <div className="set-public-row">
            <span className="set-public-url">{publicUrl}</span>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
              <RiExternalLinkLine aria-hidden="true" />
              Abrir
            </a>
          </div>
        </div>
      )}

      {/* Identidade visual */}
      <div className="pg-section">
        <div className="pg-section-header">
          <h2 className="pg-section-title">Identidade visual</h2>
        </div>
        <div className="set-logo-field">
          <div className="set-logo-preview">
            {logoPreview || currentLogoUrl ? (
              <img src={logoPreview ?? currentLogoUrl} alt="Logo" className="set-logo-img" />
            ) : (
              <div className="set-logo-initials">{getInitials(name)}</div>
            )}
          </div>
          <div className="set-logo-actions">
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
            {(logoPreview || currentLogoUrl) && (
              <button type="button" className="set-logo-remove" onClick={handleRemoveLogo}>
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
          <h4 className="pg-subtitle">{email}</h4>
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

          {/* Slug */}
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
              {checkingSlug && <span className="set-slug-checking">A verificar...</span>}
              {!checkingSlug && slugAvailable === true && <span className="set-slug-ok">Disponível</span>}
              {!checkingSlug && slugAvailable === false && <span className="set-slug-error">Indisponível</span>}
            </div>
            {slug && (
              <p className="set-slug-preview">agendly.app/p/<strong>{slug}</strong></p>
            )}
          </div>

          {/* Telefone */}
          <div className="set-field">
            <label htmlFor="set-phone" className="set-label">Telefone</label>
            <div className="set-input-wrapper">
              <RiPhoneLine className="set-input-icon" aria-hidden="true" />
              <input
                id="set-phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^\d\s+\-()]/g, ""))}
                placeholder="+351 XXX XXX XXX"
                className="set-input"
              />
            </div>
            {phone && !/^\+?[\d\s\-()]{8,20}$/.test(phone) && (
              <p className="set-hint-error">Formato de telefone inválido.</p>
            )}
          </div>

          {/* Descrição */}
          <div className="set-field">
            <label htmlFor="set-description" className="set-label">Descrição</label>
            <textarea
              id="set-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Breve descrição do teu negócio..."
              rows={3}
              className="set-textarea"
            />
          </div>
        </div>
      </div>

      {/* Botão guardar no rodapé */}
      <div className="sch-footer-actions" style={{ marginBottom: "32px" }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <RiSaveLine aria-hidden="true" />
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </div>

      {/* Zona de perigo */}
      <div className="pg-section danger-zone">
        <div className="danger-zone-body">
          <div>
            <p className="danger-zone-label">Apagar conta</p>
            <p className="danger-zone-desc">
              Remove permanentemente a tua conta e todos os dados associados. Esta acção não pode ser desfeita.
            </p>
          </div>
          <button
            className="btn-danger"
            onClick={() => setShowDeleteModal(true)}
          >
            <RiDeleteBinLine aria-hidden="true" />
            Apagar conta
          </button>
        </div>
      </div>

      {/* Modal de confirmação */}
      {showDeleteModal && (
        <DeleteAccountModal
          onConfirm={handleDeleteAccount}
          onCancel={() => { setShowDeleteModal(false); setDeleteError(null); }}
          deleting={deleting}
        />
      )}
    </div>
  );
}
