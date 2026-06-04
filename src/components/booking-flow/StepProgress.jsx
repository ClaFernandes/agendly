import React from 'react';
import { useLocation } from 'react-router-dom';

export default function StepProgress() {
  const location = useLocation(); // para saber em qual step está
  const currentPath = location.pathname;

  // etapas
  const steps = [
    { id: 1, name: 'Serviço', path: '' },
    { id: 2, name: 'Data', path: '/date' },
    { id: 3, name: 'Horário', path: '/time' },
    { id: 4, name: 'Dados', path: '/form' },
  ];

  // etapa ativa com URL
  const getActiveStepIndex = () => {
    return steps.findIndex(step => {
      if (step.path === '') {
        // se nao termina com date, time ou form
        return !currentPath.endsWith('/date') && 
               !currentPath.endsWith('/time') && 
               !currentPath.endsWith('/form');
      }
      return currentPath.endsWith(step.path);
    });
  };

  const activeIndex = getActiveStepIndex();

  return (
    <div>
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <React.Fragment key={step.id}>            
            {/* marcar step ativo */}
            <div>
              <div>
                {isCompleted ? '✓' : step.id}
              </div>
              <span >{step.name}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}