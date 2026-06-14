// src/components/layout/BookingLayout.jsx

import { Outlet } from "react-router-dom"; //incluir depois: useParams
import "../../pages/public-booking/PublicBooking.css";
import "../../pages/public-booking/DateCalendar.css";
import StepProgress from "../../pages/public-booking/StepProgress";
import { useBooking } from "../../context/BookingContext";
import logo from "../../assets/logo.svg";

export default function BookingLayout() {
  const bookingContext = useBooking();

  // Se o contexto não existir, não quebra a página
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

  let nameInitials = business.name;

  function getInitials(nameInitials) {
    if (!nameInitials) return "?";
    const stopWords = new Set(["do", "da", "de", "dos", "das", "e", "o", "a"]);
    const words = nameInitials
      .trim()
      .split(/\s+/)
      .filter((w) => !stopWords.has(w.toLowerCase()));
    if (words.length === 0) return nameInitials.slice(0, 2).toUpperCase();
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  nameInitials = (getInitials(nameInitials))

  return (
    <div className="booking-container">
      <header className="booking-header">
        <div className="business">
          <div className="business-logo">
            {business.logo_url !== null ? (
              <img src={business.logo_url} alt={business.name} />
            ) : (
              <div className="business-initials">{nameInitials}</div>
            )}
          </div>
          <h1>{business.name}</h1>
        </div>

        <div className="business-description">
          {business.description || ""}
        </div>
      </header>

      <main className="booking-content">
        <StepProgress />
        <Outlet />
      </main>      
    </div>
  );
}
