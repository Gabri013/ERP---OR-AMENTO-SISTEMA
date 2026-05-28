// src/pages/producao/FluxoDashboard.tsx
import React, { useState } from 'react';
import './FluxoDashboard.css';

export const FluxoDashboard: React.FC = () => {
  const [osSetores] = useState([
    // Simulado
  ]);

  const statuses = [
    { label: 'Pendente', color: '#6B7280', icon: '📋' },
    { label: 'Em Progresso', color: '#007BFF', icon: '⚙️' },
    { label: 'Retrabalho', color: '#FFC107', icon: '🔄' },
    { label: 'Concluída', color: '#28A745', icon: '✅' },
  ];

  return (
    <div className="fluxo-dashboard">
      {/* HEADER */}
      <div className="fluxo-header">
        <h1>🏭 Fluxo de Produção em Tempo Real</h1>
        <div className="fluxo-actions">
          <button className="btn btn-laranja">+ Iniciar Produção</button>
          <button className="btn btn-outline">📊 Relatório</button>
        </div>
      </div>

      {/* STATUS CARDS */}
      <div className="status-cards">
        {statuses.map((status) => (
          <div key={status.label} className="status-card" style={{ borderColor: status.color }}>
            <div className="status-icon">{status.icon}</div>
            <div className="status-info">
              <p className="status-label">{status.label}</p>
              <p className="status-count">12</p>
            </div>
          </div>
        ))}
      </div>

      {/* KANBAN */}
      <div className="kanban-container">
        {statuses.map((status) => (
          <div key={status.label} className="kanban-column" style={{ borderTopColor: status.color }}>
            <div className="kanban-header">
              <h3 style={{ color: status.color }}>{status.label}</h3>
              <span className="kanban-count">12</span>
            </div>

            <div className="kanban-cards">
              {/* Card de O.S. */}
              <div className="os-card">
                <div className="os-header">
                  <span className="os-numero">OS-001</span>
                  <span className="os-priority">🔴 Alta</span>
                </div>
                <div className="os-content">
                  <p className="os-cliente">Cliente A</p>
                  <p className="os-produto">Produto XYZ</p>
                  <p className="os-setor">Setor: Corte</p>
                </div>
                <div className="os-footer">
                  <span className="os-time">45 min</span>
                  <button className="os-action">→</button>
                </div>
              </div>

              {/* Mais cards... */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
