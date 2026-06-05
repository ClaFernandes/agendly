// No futuro, buscar dados do negócio no Supabase

import { Outlet } from "react-router-dom"; //incluir depois: useParams

// import StepProgress from "../booking-flow/StepProgress";

export default function BookingLayout() {
  // const { slug } = useParams();

  return (
    <div className="booking-layout">
      {/* Identificação do negócio - dinâmico no futuro */}
      <header className="booking-header">
        <div className="business-logo">
          {/* Substituir pela imagem real: <img src={business.logo_url} /> */}
          <div>Logo do negócio</div>
        </div>

        {/* Substituir por: <h1>{business.name}</h1> */}
        <h1>Nome do Negócio</h1>
        <p>Selecione os dados para realizar o seu agendamento</p>
      </header>

      <div className="booking-progress-container">
        {/* <StepProgress /> */}
        <p>Fluxo de Agendamento</p>
      </div>

      {/* Outlet renderiza fluxo: ServicePage → DatePage → TimePage → FormPage → SummaryPage */}
      <main className="booking-step-content">
        <Outlet />
      </main>
    </div>
  );
}
