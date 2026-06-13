// src/pages/public-booking/FormPage.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useBooking } from "../../context/BookingContext"; // 👈 Importar o contexto

export default function FormPage() {
  const navigate = useNavigate();
  const { clientData, setClientData } = useBooking(); // 👈 Puxar estado global

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
    // 🎯 AQUI É A CHAVE: Gravar os dados no Contexto Global para o Summary usar
    setClientData(formData);
    navigate("../summary");
  };

  return (
    <div className="form-page-container">
      <div className="page-header">
        <h2>Seus Dados</h2>
        <p>Informe seus dados de contato para confirmar o agendamento.</p>
      </div>

      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-group">
          <label htmlFor="client_name">Nome Completo *</label>
          <input
            type="text"
            id="client_name"
            name="client_name"
            required
            placeholder="Digite seu nome"
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
          <label htmlFor="client_phone">Telefone / WhatsApp *</label>
          <input
            type="tel"
            id="client_phone"
            name="client_phone"
            required
            placeholder="(00) 99999-9999"
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
            placeholder="Algum aviso ou detalhe para o profissional?"
            value={formData.notes}
            onChange={handleChange}
          />
        </div>

        <div className="form-actions-row">
          <Link to="../time" className="back-btn">
            ← Voltar
          </Link>
          <button type="submit" className="submit-form-btn">
            Ver Resumo →
          </button>
        </div>
      </form>
    </div>
  );
}
