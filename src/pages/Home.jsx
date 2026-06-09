import { Link } from "react-router-dom";
import { FiCalendar, FiUsers, FiBarChart2, FiCheck } from "react-icons/fi";
import logo from "../assets/logo.svg";
import "./Home.css";

// Funcionalidades principais
const features = [
  {
    icon: <FiCalendar />,
    title: "Agendamentos",
    description:
      "Página pública com link único. Clientes agendam sem criar conta.",
  },
  {
    icon: <FiUsers />,
    title: "CRM de clientes",
    description: "Histórico, valor gasto e visitas por cliente. Com favoritos.",
  },
  {
    icon: <FiBarChart2 />,
    title: "Financeiro",
    description: "Receita semanal e mensal. Exporta relatórios em CSV.",
  },
];

// Passos "Como funciona"
const steps = [
  {
    number: "1",
    title: "Cria a tua conta",
    description: "Regista-te e configura o teu negócio em menos de 2 minutos.",
  },
  {
    number: "2",
    title: "Partilha o teu link",
    description:
      "Cada negócio tem um URL único — ex: agendly.app/p/barbearia-do-ze",
  },
  {
    number: "3",
    title: "Recebe agendamentos",
    description:
      "Os clientes agendam diretamente. Vês tudo no painel em tempo real.",
  },
];

export default function Home() {
  return (
    <div className="home">
      {/* Navbar */}
      <header className="home-nav">
        <div className="home-nav-brand">
          <img src={logo} alt="Agendly" className="home-nav-logo" />
          <span>Agendly</span>
        </div>
        <div className="home-nav-actions">
          <Link to="/login" className="home-btn-outline">
            Entrar
          </Link>
          <Link to="/register" className="home-btn-primary">
            Criar conta
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="home-hero">
          <span className="home-badge">Plataforma de agendamentos online</span>
          <h1>Gere o teu negócio com clareza</h1>
          <p className="home-hero-sub">
            CRM, agenda e financeiro num único painel. Partilha o teu link e
            recebe agendamentos automaticamente.
          </p>
          <div className="home-hero-actions">
            <Link to="/register" className="home-btn-primary home-btn-lg">
              Começar gratuitamente
            </Link>
            <Link to="/login" className="home-btn-outline home-btn-lg">
              Já tenho conta
            </Link>
          </div>

          <div className="home-hero-checks">
            <span>
              <FiCheck /> Registo 100% gratuito
            </span>
            <span>
              <FiCheck /> Página pública imediata
            </span>
            <span>
              <FiCheck /> Cancelamento a qualquer momento
            </span>
          </div>
        </section>

        {/* Features */}
        <section className="home-section">
          <div className="home-container">
            <h2 className="home-section-title">
              Tudo o que precisas num só lugar
            </h2>
            <div className="home-features-grid">
              {features.map((feature) => (
                <div key={feature.title} className="home-feature-card">
                  <div className="home-feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section className="home-section home-section-alt">
          <div className="home-container">
            <h2 className="home-section-title">Como funciona</h2>
            <div className="home-steps">
              {steps.map((step) => (
                <div key={step.number} className="home-step">
                  <div className="home-step-number">{step.number}</div>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="home-cta">
          <div className="home-container home-cta-inner">
            <h2>Pronto para começar?</h2>
            <p>Sem custos. Sem compromisso.</p>
            <Link to="/register" className="home-btn-primary home-btn-lg">
              Criar conta gratuitamente
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2026 Agendly</p>
        <Link to="/admin/login" className="home-footer-admin">
          Acesso administrador
        </Link>
      </footer>
    </div>
  );
}
