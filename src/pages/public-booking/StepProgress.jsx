// src/components/booking-flow/StepProgress.jsx

import React from "react";
import { useLocation } from "react-router-dom";
import { FiCheck } from "react-icons/fi";

export default function StepProgress() {
  const location = useLocation();
  const currentPath = location.pathname;

  // Definição das etapas baseada nas sub-rotas
  const steps = [
    { id: 1, name: "Serviço", path: "" }, // Rota index (/:slug)
    { id: 2, name: "Data", path: "/date" },
    { id: 3, name: "Horário", path: "/time" },
    { id: 4, name: "Informações", path: "/form" },
    { id: 5, name: "Resumo", path: "/summary" },
    { id: 6, name: "Concluído", path: "/confirm" },
  ];

  // Função para descobrir qual etapa está ativa olhando o final da URL
  const getActiveStepIndex = () => {
    return steps.findIndex((step) => {
      if (step.path === "") {
        // Se a URL não termina com date, time ou form, está na página inicial do slug
        return (
          !currentPath.endsWith("/date") &&
          !currentPath.endsWith("/time") &&
          !currentPath.endsWith("/form") &&
          !currentPath.endsWith("/summary") &&
          !currentPath.endsWith("/confirm")
        );
      }
      return currentPath.endsWith(step.path);
    });
  };

  const activeIndex = getActiveStepIndex();

  return (
    <div className="step-progress-container">
      {steps.map((step, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <React.Fragment key={step.id}>
            {/* Linha conectora entre as etapas */}
            {index > 0 && (
              <div
                className={`step-line ${index <= activeIndex ? "active" : ""}`}
              />
            )}

            {/* O Círculo da Etapa */}
            <div
              className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
            >
              <div className="step-circle">{isCompleted ? <FiCheck/> : step.id}</div>
              <span className="step-name">{step.name}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
