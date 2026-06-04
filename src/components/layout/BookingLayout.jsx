import { Outlet } from "react-router-dom";
// import StepProgress from "../booking-flow/StepProgress";

function BookingLayout() {
  return (
    <div className="booking-layout">
      {/* Identificação do negócio - dinâmico no futuro */}
      <header className="booking-header">
        <div className="business-logo">
          <div>Logo do negócio</div>
        </div>
        <h1>Nome do Negócio</h1>
        <p>Selecione os dados para realizar o seu agendamento</p>
      </header>

      <div className="booking-progress-container">
        {/* <StepProgress /> */}
        <p>Fluxo de Agendamento</p>
      </div>

      <main className="booking-step-content">
        <Outlet />
      </main>
    </div>
  );
}

export default BookingLayout;
