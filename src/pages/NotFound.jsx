// src/pages/NotFound.jsx

import { useNavigate, Link, useLocation } from "react-router-dom";
import { FiHome, FiArrowLeft, FiSearch } from "react-icons/fi";
import logo from "../assets/logo.svg";
import "./NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isPublicBooking = location.pathname.startsWith("/p/");

  return (
    <div className="notfound-container">
      <div className="notfound-card">
        {/* Cabeçalho */}
        <div className="notfound-header">
          <div className="notfound-brand">
            <img src={logo} alt="Agendly Logo" className="notfound-logo" />
            <span>Agendly</span>
          </div>
        </div>

        {/* Conteúdo Principal */}
        {/* Conteúdo Principal */}
        <div className="notfound-content">
          <div className="notfound-badge">
            <span>4</span>
            <div className="notfound-icon-wrapper">
              <FiSearch />
            </div>
            <span>4</span>
          </div>

          {isPublicBooking ? (
            <>
              <h2>Negócio não encontrado</h2>
              <p className="notfound-subtitle">
                O link que seguiste não corresponde a nenhum negócio ativo.
                Confirma o endereço com o prestador de serviço.
              </p>
            </>
          ) : (
            <>
              <h2>Página não encontrada</h2>
              <p className="notfound-subtitle">
                A página que procuras não existe ou foi movida.
              </p>
            </>
          )}

          {/* Ações */}
          <div className="notfound-actions">
            <button
              className="notfound-btn-primary"
              onClick={() => navigate("/")}
            >
              <FiHome /> Ir para a página inicial
            </button>

            <button className="notfound-link-back" onClick={() => navigate(-1)}>
              <FiArrowLeft /> Voltar à página anterior
            </button>
          </div>

          {/* Rodapé do Card */}
          <hr className="notfound-divider" />

          <footer className="notfound-footer">
            É prestador de serviços?{" "}
            <Link to="/register">Cria a tua conta grátis</Link>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
