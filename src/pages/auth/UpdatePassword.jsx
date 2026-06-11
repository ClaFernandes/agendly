import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { FiLock, FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";
import logo from "../../assets/logo.svg";
import "./Auth.css";

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

export default function UpdatePassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Lê o hash e extrai os parâmetros manualmente
    const hash = window.location.hash.substring(1); // remove o '#'
    const params = new URLSearchParams(hash);

    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (type === "recovery" && accessToken) {
      // Define a sessão manualmente com os tokens do URL
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data: { session }, error }) => {
          if (session && !error) {
            setSessionReady(true);
          } else {
            setError(
              "Link inválido ou expirado. Pede um novo link de recuperação.",
            );
          }
        });
    } else {
      // Fallback: talvez já haja sessão ativa (ex: refresh de página)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setSessionReady(true);
        } else {
          setError(
            "Link inválido ou expirado. Pede um novo link de recuperação.",
          );
        }
      });
    }
  }, []);

  const rulesStatus = passwordRules.map((rule) => ({
    ...rule,
    passed: rule.test(password),
  }));

  const allRulesPassed = rulesStatus.every((r) => r.passed);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  async function handleUpdate(e) {
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      // Faz logout após atualizar — sessão de recovery não deve continuar ativa
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch {
      setError("Erro ao atualizar a palavra-passe. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-form-side" style={{ width: "100%" }}>
        <div className="auth-card">
          <Link to="/" className="auth-brand">
            <img src={logo} alt="Agendly" className="auth-logo" />
            <span>Agendly</span>
          </Link>

          <div className="auth-lock-icon">
            <FiLock />
          </div>
          <h2>Nova palavra-passe</h2>
          <p className="auth-subtitle">
            Escolhe uma nova palavra-passe para a tua conta
          </p>

          {!sessionReady ? (
            <p className={error ? "auth-error" : "auth-subtitle"}>
              {error ?? "A verificar o link..."}
            </p>
          ) : (
            <>
              {error && <p className="auth-error">{error}</p>}

              <form onSubmit={handleUpdate}>
                <div className="auth-field">
                  <label htmlFor="new-password">Nova palavra-passe</label>
                  <div className="auth-input-wrapper">
                    <FiLock className="auth-input-icon" />
                    <input
                      id="new-password"
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
                    <ul className="auth-password-rules">
                      {rulesStatus.map((rule) => (
                        <li
                          key={rule.id}
                          className={
                            rule.passed ? "rule-passed" : "rule-failed"
                          }
                        >
                          {rule.passed ? <FiCheck /> : <FiX />}
                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="auth-field">
                  <label htmlFor="confirm-new-password">
                    Confirmar palavra-passe
                  </label>
                  <div className="auth-input-wrapper">
                    <FiLock className="auth-input-icon" />
                    <input
                      id="confirm-new-password"
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
                  {loading ? "A guardar..." : "Guardar nova palavra-passe"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
