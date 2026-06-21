// src/pages/public-booking/FormPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooking } from "../../context/BookingContext";
import { FiArrowLeft, FiArrowRight } from "react-icons/fi";

export default function FormPage() {
  const navigate = useNavigate();
  const { clientData, setClientData } = useBooking();

  // Inicia o state local com os dados globais (útil se o cliente andar para trás e para a frente)
  const [formData, setFormData] = useState({
    client_name: clientData.client_name || "",
    client_email: clientData.client_email || "",
    client_phone: clientData.client_phone || "",
    notes: clientData.notes || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setClientData(formData);
    navigate("../summary");
  };

  return (
    <div className="form-page-container">
      <div className="page-header">
        <h2>Quem sou?</h2>
        <p>Informe teus dados de contacto.</p>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label htmlFor="client_name">Nome e Apelido *</label>
          <input
            type="text"
            id="client_name"
            name="client_name"
            required
            placeholder="Digite o teu nome"
            value={formData.client_name}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="client_email">E-mail *</label>
          <input
            type="email"
            id="client_email"
            name="client_email"
            required
            placeholder="exemplo@email.com"
            value={formData.client_email}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="client_phone">Telemóvel / WhatsApp *</label>
          <input
            type="tel"
            id="client_phone"
            name="client_phone"
            required
            placeholder="+351 XXX XXX XXX"
            value={formData.client_phone}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes">Observações (Opcional)</label>
          <textarea
            id="notes"
            name="notes"
            rows="3"
            placeholder="Caso queiras deixar algum aviso para o profissional?"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions-row">
          <button
            type="button"
            className="onboarding-btn-back"
            onClick={() => navigate("../time")}
          >
            <FiArrowLeft /> Voltar
          </button>

          <button type="submit" className="submit-form-btn">
            Ver Resumo <FiArrowRight />
          </button>
        </div>
      </form>
    </div>
  );
}
