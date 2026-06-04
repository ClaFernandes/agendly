import React from 'react';
import { useNavigate } from 'react-router-dom';

// dados para simular
const TempServices = [
  {
    id: '1',
    name: 'Corte de Cabelo',
    description: 'Corte moderno',
    duration_min: 30,
    price: 50.00,
    is_featured: true
  },
  {
    id: '2',
    name: 'Barba',
    description: 'Alinhamento tradicional.',
    duration_min: 30,
    price: 35.00,
    is_featured: true
  },
  {
    id: '3',
    name: 'Cabelo + Barba',
    description: 'Pacote completo.',
    duration_min: 60,
    price: 75.00,
    is_featured: false
  }
];

export default function ServicePage() {
  const navigate = useNavigate();

  const handleSelectService = (serviceId) => {
    console.log('Serviço selecionado:', serviceId);
    
    // próxima etapa
    navigate('date');
  };

  // serviços destacados
  const featuredServices = TempServices.filter(s => s.is_featured);
  const regularServices = TempServices.filter(s => !s.is_featured);

  return (
    <div>
      <div>
        <h2>Selecione um serviço</h2>
        <p>Escolha a opção.</p>
      </div>

      {/* Destaques */}
      {featuredServices.length > 0 && (
        <div>
          <h3>Mais Procurados</h3>
          <div>
            {featuredServices.map(service => (
              <div 
                key={service.id} 
                onClick={() => handleSelectService(service.id)}
              >
                <br />
                <div>
                  <h4>{service.name}</h4>
                  {service.description && <p>{service.description}</p>}
                  <span>duracao - {service.duration_min} min</span>
                </div>
                <div>
                  <span>
                    preco - {service.price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                  </span>
                  <br />
                  <button>Escolher</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outros Serviços */}
      {regularServices.length > 0 && (
        <div>
            <br />
          <h3>Todos os Serviços</h3>
          <br />
          <div>
            {regularServices.map(service => (
              <div 
                key={service.id} 
                onClick={() => handleSelectService(service.id)}
              >
                <div>
                  <h4>{service.name}</h4>
                  {service.description && <p>{service.description}</p>}
                  <span> {service.duration_min} min</span>
                </div>
                <div>
                  <span>
                    preco - {service.price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })}
                  </span>
                  <br />
                  <br />
                  <button>➔</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}