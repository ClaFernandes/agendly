import { Outlet } from "react-router-dom"; //incluir depois: useParams
import "../../pages/public-booking/PublicBooking.css";
import StepProgress from "../booking-flow/StepProgress";
import { useBooking } from "../../context/BookingContext";

export default function BookingLayout() {
  const bookingContext = useBooking();

  // 🛡️ Segurança máxima: Se o contexto não existir, não quebra a página
  if (!bookingContext) {
    return <Outlet />;
  }

  const { business, loadingBusiness, loadingError } = bookingContext;

  if (loadingBusiness)
    return (
      <div className="loading-screen">
        Carregando dados do estabelecimento...
      </div>
    );
  if (!business)
    return (
      <div className="error-screen">
        {loadingError || "Estabelecimento não encontrado."}
      </div>
    );

  return (
    <div className="booking-container">
      <header className="booking-header">
        <div className="business-logo">
          {business.logo_url ? (
            <img src={business.logo_url} alt={business.name} />
          ) : (
            <div>Logo</div>
          )}
        </div>
        <h1>{business.name}</h1>
        <p>
          {business.description ||
            "Selecione os dados para realizar o seu agendamento"}
        </p>
      </header>

      <main className="booking-content">
        <StepProgress />
        <Outlet />
      </main>

      <footer className="booking-footer">
        <p>
          Desenvolvido por <strong>Agendly</strong>
        </p>
      </footer>
    </div>
  );
}
