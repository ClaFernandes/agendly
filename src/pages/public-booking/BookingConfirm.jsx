// src/pages/public-booking/BookingConfirm.jsx

import { useBooking } from "../../context/BookingContext";
import { useNavigate } from "react-router-dom";

export default function BookingConfirm() {
  const { clientData, resetBooking } = useBooking();
  const navigate = useNavigate();

  const handleNewBooking = () => {
    resetBooking();
    navigate("../");
  };

  return (
    <>
      <div className="page-header page-concluded">
        <h2>Agendamento feito com sucesso!</h2>
        <div>
          <p>
            Um resumo foi enviado para:{" "}
            <strong>{clientData?.client_email}</strong>
          </p>
        </div>

        <button
          type="button"
          className="confirm-booking-btn"
          onClick={handleNewBooking}
        >
          Fazer um novo agendamento
        </button>
      </div>
    </>
  );
}
