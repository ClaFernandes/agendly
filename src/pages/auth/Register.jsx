// src/pages/auth/Register.jsx

import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FiEye,
  FiEyeOff,
  FiMail,
  FiLock,
  FiUser,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { AiOutlineCheck } from "react-icons/ai";
import logo from "../../assets/logo.svg";
import "./Auth.css";

const passwordRules = [
  { id: "length", label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { id: "upper", label: "Uma letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "Uma letra minúscula", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "Um número", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Um carácter especial", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export default function Register() {
  const navigate = useNavigate();
  const { register, user, userRole, loading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Após registo, vai sempre para onboarding
  useEffect(() => {
    if (loading) return;
    if (!user || userRole !== "provider") return;
    navigate("/onboarding", { replace: true });
  }, [user, userRole, loading, navigate]);

  const rulesStatus = passwordRules.map((rule) => ({ ...rule, passed: rule.test(password) }));
  const allRulesPassed = rulesStatus.every((r) => r.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  async function handleRegister(e) {
    e.preventDefault();
    setError(null);

    if (!allRulesPassed) { setError("A password não cumpre todos os requisitos."); return; }
    if (!passwordsMatch) { setError("As passwords não coincidem."); return; }

    setFormLoading(true);
    try {
      await register(email, password, fullName);
    } catch (err) {
      if (err.message?.includes("already registered") || err.message?.includes("User already exists")) {
        setError("Este email já está registado. Tenta fazer login.");
      } else {
        setError("Erro ao criar conta. Tenta novamente.");
      }
      setFormLoading(false);
    }
  }

  return (
    <div className="auth-container">
      {/* Coluna esquerda — marketing */}
      <div className="auth-marketing">
        <Link to="/" className="auth-brand">
          <img src={logo} alt="Agendly" className="auth-logo" />
          <span>Agendly</span>
        </Link>
        <div className="auth-marketing-body">
          <h2>Começa em menos de 2 minutos</h2>
          <p>Cria a tua conta, configura o negócio e partilha o link com os teus clientes.</p>
          <ul className="auth-features">
            <li><AiOutlineCheck /> Registo 100% gratuito</li>
            <li><AiOutlineCheck /> Página pública ativa imediatamente</li>
            <li><AiOutlineCheck /> Cancelamento a qualquer momento</li>
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

          <h2>Criar conta</h2>
          <p className="auth-subtitle">Começa a gerir o teu negócio hoje</p>

          {error && <p className="auth-error">{error}</p>}

          <form onSubmit={handleRegister}>
            {/* Nome */}
            <div className="auth-field">
              <label htmlFor="fullName">Nome completo</label>
              <div className="auth-input-wrapper">
                <FiUser className="auth-input-icon" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Manuel Silva"
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mail@mail.com"
                  required
                  disabled={formLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="password">Palavra-passe</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={formLoading}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {password.length > 0 && (
                <ul className="auth-password-rules">
                  {rulesStatus.map((rule) => (
                    <li key={rule.id} className={rule.passed ? "rule-passed" : "rule-failed"}>
                      {rule.passed ? <FiCheck /> : <FiX />}
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirmar password */}
            <div className="auth-field">
              <label htmlFor="confirmPassword">Confirmar palavra-passe</label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={formLoading}
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <p className={passwordsMatch ? "auth-match-ok" : "auth-match-error"}>
                  {passwordsMatch
                    ? <><FiCheck /> As palavras-passe coincidem</>
                    : <><FiX /> As palavras-passe não coincidem</>}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="auth-btn"
              disabled={formLoading || !allRulesPassed || !passwordsMatch}
            >
              {formLoading ? "A criar conta..." : "Criar conta"}
            </button>
          </form>

          <p className="auth-footer">
            Já tens conta? <Link to="/login">Entra aqui</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
