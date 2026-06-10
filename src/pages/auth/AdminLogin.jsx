import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  FiEye,
  FiEyeOff,
  FiMail,
  FiLock,
  FiArrowLeft,
  FiCheck,
} from "react-icons/fi";
import logo from "../../assets/logo.svg";
import "./Auth.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, recoverPassword, user, userRole } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  // Redireciona se detetar sessão de admin ativa
  useEffect(() => {
    if (user && userRole === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, userRole, navigate]);

  async function handleAdminLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // Verifica se o utilizador é admin
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (profile?.role !== "admin") {
        // Faz logout imediato — não deixa provider ficar autenticado aqui
        await supabase.auth.signOut();
        setError("Acesso restrito a administradores.");
      }
      // Se for admin, o useEffect acima trata do redirect
    } catch {
      setError(
        "Credenciais administrativas inválidas ou acesso não autorizado.",
      );
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

  return (
    <div className="auth-container admin-mode">
      {/* Coluna esquerda — marketing */}
      <div className="auth-marketing">
        <Link to="/" className="auth-brand">
          <img src={logo} alt="Agendly" className="auth-logo" />
          <span>Agendly</span>
        </Link>

        <div className="auth-marketing-body">
          <h2>Painel de Administração</h2>
          <p>
            Acesso restrito para gestão global do sistema, auditoria de negócios
            e controlo de utilizadores.
          </p>
          <ul className="auth-features">
            <li>
              <FiCheck /> Monitorização de plataformas ativas
            </li>
            <li>
              <FiCheck /> Gestão e suporte de prestadores
            </li>
            <li>
              <FiCheck /> Acesso controlado por convite
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

          {/* Formulário de login */}
          {mode === "login" && (
            <>
              <h2>Autenticação Segura</h2>
              <p className="auth-subtitle">
                Introduza as suas credenciais de administrador
              </p>

              {error && <p className="auth-error">{error}</p>}

              <form onSubmit={handleAdminLogin}>
                <div className="auth-field">
                  <label htmlFor="admin-email">Email</label>
                  <div className="auth-input-wrapper">
                    <FiMail className="auth-input-icon" />
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@mail.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label htmlFor="admin-password">Palavra-passe</label>
                  <div className="auth-input-wrapper">
                    <FiLock className="auth-input-icon" />
                    <input
                      id="admin-password"
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
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={loading}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Link para recuperar password */}
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => {
                    setMode("recover");
                    setError(null);
                  }}
                >
                  Esqueceste a palavra-passe?
                </button>

                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "A entrar..." : "Entrar"}
                </button>
              </form>

              <p className="auth-footer">
                <Link to="/" className="auth-link">
                  <FiArrowLeft /> Voltar à Página Inicial
                </Link>
              </p>
            </>
          )}

          {/* Formulário de recuperação */}
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
                      palavra-passe. O link expira em 1 hora.
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
                      placeholder="admin@mail.com"
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
