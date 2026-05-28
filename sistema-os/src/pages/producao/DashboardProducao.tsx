// src/pages/producao/DashboardProducao.tsx
import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DashboardProducao.css';

export const DashboardProducao: React.FC = () => {
  const dataProducao = [
    { setor: 'Corte', concluido: 45, andamento: 12, atrasado: 3 },
    { setor: 'Dobra', concluido: 38, andamento: 18, atrasado: 2 },
    { setor: 'Solda', concluido: 52, andamento: 8, atrasado: 1 },
    { setor: 'Acabamento', concluido: 41, andamento: 15, atrasado: 4 },
  ];

  return (
    <div className="dashboard-producao">
      <h1>📊 Dashboard de Produção</h1>

      {/* KPIs */}
      <div className="kpi-grid">
        <KPICard
          title="Eficiência Geral"
          value="94%"
          icon="⚡"
          color="#FF8C00"
        />
        <KPICard
          title="O.S. em Andamento"
          value="53"
          icon="⚙️"
          color="#007BFF"
        />
        <KPICard
          title="Tempo Médio"
          value="3.2h"
          icon="⏱️"
          color="#28A745"
        />
        <KPICard
          title="Taxa de Retrabalho"
          value="2.1%"
          icon="🔄"
          color="#FFC107"
        />
      </div>

      {/* GRÁFICOS */}
      <div className="charts-grid">
        <div className="chart-container">
          <h3>Produção por Setor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataProducao}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="setor" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="concluido" fill="#28A745" name="Concluído" />
              <Bar dataKey="andamento" fill="#007BFF" name="Em Andamento" />
              <Bar dataKey="atrasado" fill="#DC3545" name="Atrasado" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
}

function KPICard({ title, value, icon, color }: KPICardProps) {
  return (
    <div className="kpi-card" style={{ borderLeftColor: color }}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-content">
        <p className="kpi-title">{title}</p>
        <p className="kpi-value" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}
