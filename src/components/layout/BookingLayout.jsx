import { Outlet } from 'react-router-dom';
import '../../pages/public-booking/PublicBooking.css';
import StepProgress from '../booking-flow/StepProgress';

export default function BookingLayout() {
  return (
    <div className="booking-container">
      <header className="booking-header">
        <div className="business-logo">
          {/* Logo provisória ou futuramente vinda do banco via Context */}
          <div className="business-logo-placeholder">Agendly</div>
        </div>
      </header>

      <main className="booking-content">
        <StepProgress/>
        <Outlet />
      </main>

      <footer className="booking-footer">
        <p>Desenvolvido por <strong>Agendly</strong></p>
      </footer>
    </div>
  );
}
