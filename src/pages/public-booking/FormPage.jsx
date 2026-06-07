// src/pages/public-booking/FormPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function FormPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Aqui salvaremos os dados do cliente no BookingContext futuramente
    console.log('Dados do cliente coletados:', formData);
    
    // Avança para a página de resumo/confirmação final
    navigate('../summary');
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
          <Link to="../time" className="back-btn">← Voltar</Link>
          <button type="submit" className="submit-form-btn">Ver Resumo →</button>
        </div>
      </form>
    </div>
  );
}