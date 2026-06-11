import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { FiEye, FiEyeOff, FiMail, FiLock, FiArrowLeft } from "react-icons/fi";
import { AiOutlineCheck } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import logo from "../../assets/logo.svg";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { login, recoverPassword, loginWithGoogle, user, userRole } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redireciona após login — não atua se vier de fluxo de recovery
  useEffect(() => {
    if (!user || !userRole) return;

    // 🔴 Não redirecionar se o utilizador está em fluxo de recuperação de password
    if (window.location.pathname.includes("update-password")) return;

    if (userRole === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    async function checkBusiness() {
      const { data } = await supabase
        .from("business")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    }

    checkBusiness();
  }, [user, userRole, navigate]);

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch {
      setError("Email ou password incorretos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRecover(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await recoverPassword(email);
      setSuccess(email);
    } catch {
      setError(
        "Não foi possível enviar o email. Verifica o endereço introduzido.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    try {
      await loginWithGoogle();
    } catch {
      setError("Erro ao entrar com Google. Tenta novamente.");
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-marketing">
        <Link to="/" className="auth-brand">
          <img src={logo} alt="Agendly" className="auth-logo" />
          <span>Agendly</span>
        </Link>

        <div className="auth-marketing-body">
          <h2>Gere o teu negócio com clareza</h2>
          <p>CRM, agenda e financeiro num único painel.</p>
          <ul className="auth-features">
            <li>
              <AiOutlineCheck /> Página pública de agendamento
            </li>
            <li>
              <AiOutlineCheck /> Histórico, valor gasto e visitas por cliente
            </li>
            <li>
              <AiOutlineCheck /> Relatório financeiro e CSV
            </li>
          </ul>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <Link to="/" className="auth-brand">
            <img src={logo} alt="Agendly" className="auth-logo" />
            <span>Agendly</span>
          </Link>

          {mode === "login" && (
            <>
              <h2>Bem-vindo de volta</h2>
              <p className="auth-subtitle">Acede ao teu painel de gestão</p>

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

              <form onSubmit={handleLogin}>
                <div className="auth-field">
                  <label htmlFor="email">Email</label>
                  <div className="auth-input-wrapper">
                    <FiMail className="auth-input-icon" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@email.com"
                      required
                    />
                  </div>
                </div>

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
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setMode("recover");
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  Esqueceste a palavra-passe?
                </button>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "A entrar..." : "Entrar"}
                </button>
              </form>

              <p className="auth-footer">
                Não tens conta?{" "}
                <Link to="/register">Regista-te gratuitamente</Link>
              </p>
            </>
          )}

          {mode === "recover" && (
            <>
              <div className="auth-lock-icon">
                <FiLock />
              </div>
              <h2>Recuperar acesso</h2>
              <p className="auth-subtitle">
                Introduz o email da tua conta e enviamos-te um link
              </p>

              {success ? (
                <div className="auth-success-box">
                  <FiMail className="auth-success-icon" />
                  <p>Email enviado!</p>
                  <p>Verifica a tua caixa de entrada em</p>
                  <p className="auth-success-email">{success}</p>
                </div>
              ) : (
                <>
                  {error && <p className="auth-error">{error}</p>}
                  <div className="auth-info">
                    <FiMail />
                    <p>
                      Receberás um email com um link para criar uma nova
                      password. O link expira em 1 hora.
                    </p>
                  </div>
                </>
              )}

              <form onSubmit={handleRecover}>
                <div className="auth-field">
                  <label htmlFor="recover-email">Email da conta</label>
                  <div className="auth-input-wrapper">
                    <FiMail className="auth-input-icon" />
                    <input
                      id="recover-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mail@mail.com"
                      required
                      disabled={!!success}
                    />
                  </div>
                </div>

                {!success && (
                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? "A enviar..." : "Enviar link de recuperação"}
                  </button>
                )}
              </form>

              <button
                type="button"
                className="auth-link"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setSuccess(null);
                  setEmail("");
                }}
              >
                <FiArrowLeft /> Voltar ao Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
