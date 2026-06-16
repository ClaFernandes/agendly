// src/pages/auth/AdminLogin.jsx

import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  FiEye,
  FiEyeOff,
  FiMail,
  FiLock,
  FiArrowLeft,
  FiCheck,
  FiUserPlus,
} from "react-icons/fi";

import logo from "../../assets/logo.svg";
import "./Auth.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, userRole, userStatus, recoverPassword } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.success;

  // Redireciona se detetar sessão de admin ativa e aprovada
  useEffect(() => {
    if (user && userRole === "admin" && userStatus === "active") {
      navigate("/admin", { replace: true });
    }
  }, [user, userRole, userStatus, navigate]);

  // Submete o login de admin
  async function handleAdminLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);

      // Verifica role e status do utilizador após login
      const { data: userData } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", userData.user.id)
        .single();

      // Bloqueia se não for admin
      if (profile?.role !== "admin") {
        await supabase.auth.signOut();
        setError("Acesso restrito a administradores.");
        return;
      }

      // Bloqueia se ainda não foi aprovado
      if (profile?.status === "pending") {
        await supabase.auth.signOut();
        setError(
          "A tua conta está a aguardar aprovação pelo administrador principal.",
        );
        return;
      }

      // Bloqueia se foi rejeitado
      if (profile?.status === "rejected") {
        await supabase.auth.signOut();
        setError(
          "O teu pedido de acesso foi rejeitado. Contacta o administrador.",
        );
        return;
      }
    } catch {
      setError("Credenciais inválidas ou acesso não autorizado.");
    } finally {
      setLoading(false);
    }
  }

  // Submete o pedido de recuperação de password
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

  // Volta ao modo login e limpa estado
  function backToLogin() {
    setMode("login");
    setError(null);
    setSuccess(null);
    setEmail("");
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
              <FiCheck /> Acesso controlado por aprovação
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

          {/* Login */}
          {mode === "login" && (
            <>
              <h2>Autenticação Segura</h2>
              <p className="auth-subtitle">
                Introduza as suas credenciais de administrador
              </p>

              {error && <p className="auth-error">{error}</p>}

              {/* Mensagem de sucesso vinda do registo ou recuperação */}
              {successMessage && (
                <div className="auth-success-box">
                  <p>{successMessage}</p>
                </div>
              )}

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

                {/* Link para recuperação de password */}
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

              {/* Link para pedir acesso */}
              <p className="auth-footer">
                Queres ser administrador?{" "}
                <Link to="/admin/register" className="auth-link">
                  <FiUserPlus /> Pedir acesso
                </Link>
              </p>

              <p className="auth-footer">
                <Link to="/" className="auth-link">
                  <FiArrowLeft /> Voltar à Página Inicial
                </Link>
              </p>
            </>
          )}

          {/* Modo Recuperação */}
          {mode === "recover" && (
            <>
              <div className="auth-lock-icon">
                <FiLock />
              </div>
              <h2>Recuperar acesso</h2>
              <p className="auth-subtitle">
                Introduz o email da tua conta de administrador
              </p>

              {/* Confirmação de envio */}
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
                      Receberás um link para criar uma nova palavra-passe. O
                      link expira em 1 hora.
                    </p>
                  </div>
                </>
              )}

              {/* Formulário de recuperação */}
              {!success && (
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
                        autoFocus
                      />
                    </div>
                  </div>

                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? "A enviar..." : "Enviar link de recuperação"}
                  </button>
                </form>
              )}

              <button type="button" className="auth-link" onClick={backToLogin}>
                <FiArrowLeft /> Voltar ao Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
