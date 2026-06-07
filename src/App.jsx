// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import BookingLayout from './components/layout/BookingLayout';
import ServicePage from './pages/public-booking/ServicePage';
import DatePage from './pages/public-booking/DatePage';
import TimePage from './pages/public-booking/TimePage';
import FormPage from './pages/public-booking/FormPage';
import SummaryPage from './pages/public-booking/SummaryPage';
// import BookingConfirm from './pages/public-booking/BookingConfirm';

// Componentes Provisórios para teste de navegação
const ServicePageMock = () => (
  <div>
    <h2>1. Selecione o Serviço</h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
      <button className="demo-btn">Corte de Cabelo - R$ 50,00</button>
      <button className="demo-btn">Barba Completa - R$ 35,00</button>
    </div>
    <div style={{ marginTop: '30px' }}>
      <Link to="date" className="next-btn">Avançar para Data →</Link>
    </div>
  </div>
);

const DatePageMock = () => (
  <div>
    <h2>2. Escolha a Data</h2>
    <input type="date" style={{ width: '100%', padding: '10px', margin: '20px 0' }} />
    <div style={{ display: 'flex', gap: '10px' }}>
      <Link to="../" className="back-btn">← Voltar</Link>
      <Link to="../time" className="next-btn">Avançar para Horário →</Link>
    </div>
  </div>
);

const TimePageMock = () => (
  <div>
    <h2>3. Escolha o Horário</h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', margin: '20px 0' }}>
      <button className="demo-btn">09:00</button>
      <button className="demo-btn">10:00</button>
      <button className="demo-btn">14:00</button>
      <button className="demo-btn">15:00</button>
    </div>
    <div style={{ display: 'flex', gap: '10px' }}>
      <Link to="../date" className="back-btn">← Voltar</Link>
      <button className="next-btn" onClick={() => alert('Agendamento Confirmado!')}>Finalizar</button>
    </div>
  </div>
);

const BookingConfirmMock = () => (
  <div style={{ textAlign: 'center', padding: '20px' }}>
    <h2 style={{ color: '#10b981' }}>🎉 Agendamento Confirmado!</h2>
    <p style={{ color: '#666', marginTop: '10px' }}>O profissional já recebeu sua solicitação.</p>
  </div>
);

// Captura o slug da URL apenas para mostrar na tela que está funcionando
const SlugWrapper = () => {
  const { slug } = useParams();
  return (
    <div style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#666' }}>
      Você está na página de: <strong>{slug}</strong>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota dinâmica baseada no slug do cliente (ex: localhost:5173/barbearia-do-joao) */}
        <Route path="/:slug" element={<BookingLayout />}>
          <Route index element={<><SlugWrapper /><ServicePage /></>} />
          <Route path="date" element={<><SlugWrapper /><DatePage /></>} />
          <Route path="time" element={<><SlugWrapper /><TimePage /></>} />
          <Route path="form" element={<><SlugWrapper /><FormPage /></>} />
          <Route path="summary" element={<><SlugWrapper /><SummaryPage /></>} />
          <Route path="confirm" element={<><SlugWrapper /><BookingConfirmMock /></>} />
        </Route>

        {/* Rota inicial amigável caso acesse sem slug */}
        <Route path="*" element={
          <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h1>Bem-vindo ao Agendly</h1>
            <p>Para testar o fluxo do cliente, acesse uma URL com slug. Exemplo:</p>
            <Link to="/barbearia-teste" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
              localhost:5173/barbearia-teste
            </Link>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}