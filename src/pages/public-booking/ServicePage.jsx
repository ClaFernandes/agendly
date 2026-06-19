// src/pages/public-booking/ServicePage.jsx

import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";

export default function ServicePage() {
  const navigate = useNavigate();
  const { services, setSelectedService } = useBooking();

  const handleSelectService = (service) => {
    setSelectedService(service);
    navigate("date");
  };

  return (
    <div className="service-page-container">
      <div className="page-header">
        <h2>O que queres agendar?</h2>
        <p>Escolha uma opção para prosseguir com o agendamento.</p>
      </div>

      <div className="services-list">
        {services.map((service) => (
          <div
            key={service.id}
            className="service-row"
            onClick={() => handleSelectService(service)}
          >
            <div className="service-info">
              <h4>{service.name}</h4>
              <p>{service.description}</p>
              <span className="service-duration">
                ⏱ {service.duration_min} min
              </span>
            </div>
            <div className="service-price-action">
              <span className="service-price">
                {service.price.toLocaleString("pt-PT", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
