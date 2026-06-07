// No futuro, buscar dados do negócio no Supabase

import { Outlet } from 'react-router-dom'; //incluir depois: useParams
import '../../pages/public-booking/PublicBooking.css';
import StepProgress from '../booking-flow/StepProgress';

export default function BookingLayout() {
  // const { slug } = useParams();
  return (
    <div className="booking-container">
      <header className="booking-header">
        <div className="business-logo">

          <div>Logo do negócio</div>
        </div>

        {/* Substituir por: <h1>{business.name}</h1> */}
        <h1>Nome do Negócio</h1>
        <p>Selecione os dados para realizar o seu agendamento</p>
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
