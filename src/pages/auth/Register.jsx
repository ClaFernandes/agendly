import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { FcGoogle } from "react-icons/fc";
import logo from "../../assets/logo.svg";

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

export default function Register() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, user } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Se o utilizador já se registou com sucesso e está logado, leva-o diretamente para o onboarding
  useEffect(() => {
    if (user) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, navigate]);

  const rulesStatus = passwordRules.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));

  const allRulesPassed = rulesStatus.every((r) => r.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  // Submit do formulário de registo
  async function handleRegister(e) {
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
      // Envia os parâmetros para o AuthContext mapear o profile do utilizador na tabela pública
      await register(email, password, firstName, lastName);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      if (
        err.message?.includes("already registered") ||
        err.message?.includes("User already exists")
      ) {
        setError("Este email já está registado. Tenta fazer login.");
      } else {
        setError("Erro ao criar conta. Tenta novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await loginWithGoogle();
    } catch {
      setError("Erro ao registar com Google. Tenta novamente.");
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-marketing">
        <div className="auth-brand">
          <img
            src={logo}
            alt="Agendly"
            className="auth-logo"
            style={{ height: "32px", width: "auto" }}
          />
          <span>Agendly</span>
        </div>

        <h2>Começa em menos de 2 minutos</h2>
        <p>
          Cria a tua conta, configura o negócio e partilha o link com os teus
          clientes.
        </p>
        <ul className="auth-features">
          <li>
            <AiOutlineCheck /> Página pública ativa imediatamente
          </li>
          <li>
            <AiOutlineCheck /> Cancelamento a qualquer momento
          </li>
        </ul>
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <img
            src={logo}
            alt="Agendly"
            className="auth-logo"
            style={{ height: "32px", width: "auto" }}
          />
          <span>Agendly</span>
        </div>

        <h2>Criar conta</h2>
        <p className="auth-subtitle">Começa a gerir o teu negócio hoje</p>

        {error && <p className="auth-error">{error}</p>}

        <button
          type="button"
          className="auth-google-btn"
          onClick={handleGoogle}
        >
          <FcGoogle className="auth-google-icon" />
          Continuar com Google
        </button>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <form onSubmit={handleRegister}>
          <div
            className="auth-field-row"
            style={{ display: "flex", gap: "12px" }}
          >
            <div className="auth-field" style={{ flex: 1 }}>
              <label htmlFor="firstName">Primeiro nome</label>
              <div className="auth-input-wrapper">
                <FiUser className="auth-input-icon" />
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="José"
                  required
                />
              </div>
            </div>
            <div className="auth-field" style={{ flex: 1 }}>
              <label htmlFor="lastName">Apelido</label>
              <div className="auth-input-wrapper">
                <FiUser className="auth-input-icon" />
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Silva"
                  required
                />
              </div>
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <div className="auth-input-wrapper">
              <FiMail className="auth-input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@negocio.com"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
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
              <ul
                className="auth-password-rules"
                style={{ listStyle: "none", padding: 0, marginTop: "8px" }}
              >
                {rulesStatus.map((rule) => (
                  <li
                    key={rule.id}
                    className={rule.passed ? "rule-passed" : "rule-failed"}
                  >
                    {rule.passed ? (
                      <FiCheck color="green" />
                    ) : (
                      <FiX color="red" />
                    )}{" "}
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirmar password</label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
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
              <p
                className={
                  passwordsMatch ? "auth-match-ok" : "auth-match-error"
                }
              >
                {passwordsMatch ? (
                  <>
                    {" "}
                    <FiCheck color="green" /> As passwords coincidem{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <FiX color="red" /> As passwords não coincidem{" "}
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
            {loading ? "A criar conta..." : "Criar conta"}
          </button>
        </form>

        <p className="auth-footer">
          Já tens conta? <Link to="/login">Entra aqui</Link>
        </p>
      </div>
    </div>
  );
}
