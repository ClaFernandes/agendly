// src/pages/public-booking/ServicePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Simulação dos dados que virão do Supabase futuramente
const MOCK_SERVICES = [
  {
    id: '1',
    name: 'Corte de Cabelo Masculino',
    description: 'Corte moderno na tesoura ou máquina, inclui lavagem e finalização com pomada.',
    duration_min: 30,
    price: 50.00,
    is_featured: true
  },
  {
    id: '2',
    name: 'Barba Completa',
    description: 'Alinhamento de barba com toalha quente e barbearia tradicional.',
    duration_min: 30,
    price: 35.00,
    is_featured: true
  },
  {
    id: '3',
    name: 'Combo: Cabelo + Barba',
    description: 'O pacote completo para dar aquele trato no visual com desconto.',
    duration_min: 60,
    price: 75.00,
    is_featured: false
  }
];

export default function ServicePage() {
  const navigate = useNavigate();

  const handleSelectService = (serviceId) => {
    // 1. Aqui salvaremos o ID no BookingContext futuramente
    console.log('Serviço selecionado:', serviceId);
    
    // 2. Avança para a próxima etapa do fluxo
    navigate('date');
  };

  // Separa os serviços destacados dos normais
  const featuredServices = MOCK_SERVICES.filter(s => s.is_featured);
  const regularServices = MOCK_SERVICES.filter(s => !s.is_featured);

  return (
    <div className="service-page-container">
      <div className="page-header">
        <h2>Selecione um serviço</h2>
        <p>Escolha a opção desejada para prosseguir com o agendamento.</p>
      </div>

      {/* Seção de Destaques (se houver) */}
      {featuredServices.length > 0 && (
        <div className="services-section">
          <h3 className="section-title">⭐ Mais Procurados</h3>
          <div className="services-grid">
            {featuredServices.map(service => (
              <div 
                key={service.id} 
                className="service-card featured"
                onClick={() => handleSelectService(service.id)}
              >
                <div className="service-info">
                  <h4>{service.name}</h4>
                  {service.description && <p>{service.description}</p>}
                  <span className="service-duration">⏱ {service.duration_min} min</span>
                </div>
                <div className="service-price-action">
                  <span className="service-price">
                    {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <button className="select-service-btn">Escolher</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção de Outros Serviços */}
      {regularServices.length > 0 && (
        <div className="services-section">
          <h3 className="section-title">Todos os Serviços</h3>
          <div className="services-list">
            {regularServices.map(service => (
              <div 
                key={service.id} 
                className="service-row"
                onClick={() => handleSelectService(service.id)}
              >
                <div className="service-info">
                  <h4>{service.name}</h4>
                  {service.description && <p>{service.description}</p>}
                  <span className="service-duration">⏱ {service.duration_min} min</span>
                </div>
                <div className="service-price-action">
                  <span className="service-price">
                    {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                  <button className="select-service-btn text-only">➔</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}