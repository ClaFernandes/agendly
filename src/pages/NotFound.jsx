// src/pages/notFound/NotFound.jsx

import { useNavigate, Link } from "react-router-dom";
import { FiHome, FiArrowLeft, FiSearch } from "react-icons/fi";
import logo from "../assets/logo.svg";
import "./NotFound.css";

const NotFound = () => {
  const navigate = useNavigate();

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
        <div className="notfound-content">
          <div className="notfound-badge">
            <span>4</span>
            <div className="notfound-icon-wrapper">
              <FiSearch />
            </div>
            <span>4</span>
          </div>

          <h2>Este negócio não foi encontrado</h2>
          <p className="notfound-subtitle">
            Confirma o link com o prestador de serviço.
          </p>

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
