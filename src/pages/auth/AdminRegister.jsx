// src/pages/auth/AdminRegister.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowLeft,
  FiCheck,
  FiX,
} from "react-icons/fi";

import logo from "../../assets/logo.svg";
import "./Auth.css";

// Regras de validação da password
const passwordRules = [
  { id: "length", label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { id: "upper", label: "Uma letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Uma letra minúscula", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "Um número", test: (p) => /[0-9]/.test(p) },
  {
    id: "special",
    label: "Um carácter especial",
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
];

export default function AdminRegister() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calcula o estado de cada regra da password em tempo real
  const rulesStatus = passwordRules.map((r) => ({
    ...r,
    passed: r.test(password),
  }));
  const allRulesPassed = rulesStatus.every((r) => r.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!allRulesPassed) {
      setError("A password não cumpre todos os requisitos.");
      return;
    }
    if (!passwordsMatch) {
      setError("As passwords não coincidem.");
      return;
    }

    setLoading(true);

    try {
      // Cria o utilizador no Supabase Auth
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (signUpError) throw signUpError;

      const newUserId = signUpData.user?.id;
      if (!newUserId) throw new Error("Erro ao criar utilizador.");

      // Upsert do perfil com role "admin" e status "pending"
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: newUserId, role: "admin", status: "pending" },
          { onConflict: "id" },
        );

      if (profileError) throw profileError;

      // Faz logout imediato — não deixa entrar antes de aprovação
      await supabase.auth.signOut();

      navigate("/admin/login", {
        replace: true,
        state: {
          success:
            "Pedido enviado! Aguarda a aprovação do administrador principal antes de fazer login.",
        },
      });
    } catch (err) {
      // Trata erro de email já registado
      if (err.message?.includes("already registered")) {
        setError("Este email já está registado.");
      } else {
        setError(err.message || "Erro ao criar conta. Tenta novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container admin-mode">
      {/* Coluna esquerda */}
      <div className="auth-marketing">
        <Link to="/" className="auth-brand">
          <img src={logo} alt="Agendly" className="auth-logo" />
          <span>Agendly</span>
        </Link>

        <div className="auth-marketing-body">
          <h2>Pedir acesso de administrador</h2>
          <p>
            Cria a tua conta e aguarda a aprovação do administrador principal.
            Receberás acesso após validação.
          </p>
          <ul className="auth-features">
            <li>
              <FiCheck /> Acesso controlado por aprovação
            </li>
            <li>
              <FiCheck /> Gestão de negócios e utilizadores
            </li>
            <li>
              <FiCheck /> Painel de administração completo
            </li>
          </ul>
        </div>
      </div>

      {/* Coluna direita — formulário */}
      <div className="auth-form-side">
        <div className="auth-card">
          <Link to="/" className="auth-brand">
            <img src={logo} alt="Agendly" className="auth-logo" />
            <span>Agendly</span>
          </Link>

          <h2>Criar conta de administrador</h2>
          <p className="auth-subtitle">
            O teu pedido será avaliado pelo administrador principal.
          </p>

          {/* Feedback de erro */}
          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="auth-field">
              <label htmlFor="reg-email">Email</label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="novo@mail.com"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="reg-password">Palavra-passe</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((p) => !p)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Indicador de regras da password */}
              {password.length > 0 && (
                <ul className="auth-password-rules">
                  {rulesStatus.map((rule) => (
                    <li
                      key={rule.id}
                      className={rule.passed ? "rule-passed" : "rule-failed"}
                    >
                      {rule.passed ? <FiCheck /> : <FiX />}
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirmar password */}
            <div className="auth-field">
              <label htmlFor="reg-confirm">Confirmar palavra-passe</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="reg-confirm"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirm((p) => !p)}
                >
                  {showConfirm ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {/* Indicador de correspondência */}
              {confirmPassword.length > 0 && (
                <p
                  className={
                    passwordsMatch ? "auth-match-ok" : "auth-match-error"
                  }
                >
                  {passwordsMatch ? (
                    <>
                      <FiCheck /> As palavras-passe coincidem
                    </>
                  ) : (
                    <>
                      <FiX /> As palavras-passe não coincidem
                    </>
                  )}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={loading || !allRulesPassed || !passwordsMatch}
            >
              {loading ? "A criar pedido..." : "Pedir acesso"}
            </button>
          </form>

          <p className="auth-footer">
            Já tens conta?{" "}
            <Link to="/admin/login" className="auth-link">
              <FiArrowLeft /> Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
