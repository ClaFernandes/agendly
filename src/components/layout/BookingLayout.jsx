import React from 'react';
import { Outlet } from 'react-router-dom';
import '../../pages/public-booking/PublicBooking.css';
import StepProgress from '../booking-flow/StepProgress';

export default function BookingLayout() {
  return (
    <div className="booking-container">
      <header className="booking-header">
        <div className="booking-logo-container">
          {/* Logo provisória ou futuramente vinda do banco via Context */}
          <div className="booking-logo-placeholder">Agendly</div>
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