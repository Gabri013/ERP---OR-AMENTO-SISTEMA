// src/components/layouts/IndustrialLayout.tsx
import React, { useState } from 'react';
import { useLocation } from 'wouter';
import './IndustrialLayout.css';

interface IndustrialLayoutProps {
  children: React.ReactNode;
}

export const IndustrialLayout: React.FC<IndustrialLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();

  return (
    <div className="industrial-layout">
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* LOGO */}
        <div className="sidebar-header">
          <div className="logo-container">
            <span className="logo-icon">🏭</span>
            <div className="logo-text">
              <h1>COZINCA</h1>
              <p>Industrial</p>
            </div>
          </div>
        </div>

        {/* MENU */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3 className="nav-title">Principal</h3>
            <NavLink
              icon="📊"
              label="Dashboard"
              href="/dashboard"
              active={location === '/dashboard'}
            />
            <NavLink
              icon="📦"
              label="Produtos"
              href="/produtos"
              active={location === '/produtos'}
            />
            <NavLink
              icon="📋"
              label="Orçamentos"
              href="/orcamentos"
              active={location === '/orcamentos'}
            />
            <NavLink
              icon="🚚"
              label="Vendas"
              href="/vendas"
              active={location === '/vendas'}
            />
          </div>

          {/* PRODUÇÃO - Seção em Destaque */}
          <div className="nav-section production-section">
            <h3 className="nav-title">🏭 PRODUÇÃO</h3>
            <NavLink
              icon="⚙️"
              label="Ordens de Serviço"
              href="/producao/os"
              active={location?.includes('/producao/os')}
              highlight
            />
            <NavLink
              icon="📍"
              label="Setores"
              href="/producao/setores"
              active={location?.includes('/setores')}
              highlight
            />
            <NavLink
              icon="📅"
              label="Planos de Produção"
              href="/producao/planos"
              active={location?.includes('/planos')}
              highlight
            />
            <NavLink
              icon="🏷️"
              label="Etiquetas"
              href="/producao/etiquetas"
              active={location?.includes('/etiquetas')}
              highlight
            />
            <NavLink
              icon="📊"
              label="Dashboard Produção"
              href="/producao/dashboard"
              active={location?.includes('/producao/dashboard')}
              highlight
            />
          </div>

          <div className="nav-section">
            <h3 className="nav-title">Financeiro</h3>
            <NavLink
              icon="💰"
              label="Contas a Receber"
              href="/financeiro/receber"
              active={location?.includes('/receber')}
            />
            <NavLink
              icon="💸"
              label="Contas a Pagar"
              href="/financeiro/pagar"
              active={location?.includes('/pagar')}
            />
            <NavLink
              icon="📈"
              label="Relatórios"
              href="/financeiro/relatorios"
              active={location?.includes('/relatorios')}
            />
          </div>

          <div className="nav-section">
            <h3 className="nav-title">Sistema</h3>
            <NavLink
              icon="⚙️"
              label="Configurações"
              href="/configuracoes"
              active={location === '/configuracoes'}
            />
            <NavLink
              icon="👥"
              label="Usuários"
              href="/usuarios"
              active={location === '/usuarios'}
            />
          </div>
        </nav>

        {/* FOOTER SIDEBAR */}
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">👤</div>
            <span className="username">Admin</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* HEADER */}
        <header className="header">
          <div className="header-left">
            <button
              className="toggle-sidebar-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title="Toggle sidebar"
            >
              ☰
            </button>
            <div className="breadcrumb-container">
              <Breadcrumb />
            </div>
          </div>

          <div className="header-center">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Busca rápida (Ctrl+K)..."
                className="search-input"
              />
            </div>
          </div>

          <div className="header-right">
            <button className="header-btn notification-btn">
              🔔
              <span className="badge">3</span>
            </button>
            <button className="header-btn user-btn">👤</button>
          </div>
        </header>

        {/* CONTEÚDO */}
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
};

interface NavLinkProps {
  icon: string;
  label: string;
  href: string;
  active: boolean;
  highlight?: boolean;
}

function NavLink({ icon, label, href, active, highlight }: NavLinkProps) {
  return (
    <a
      href={href}
      className={`nav-link ${active ? 'active' : ''} ${highlight ? 'highlight' : ''}`}
    >
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
    </a>
  );
}

function Breadcrumb() {
  const [location] = useLocation();
  const segments = location?.split('/').filter(Boolean) || [];

  return (
    <div className="breadcrumb">
      <span className="breadcrumb-item">Você está em:</span>
      {segments.map((segment, idx) => (
        <React.Fragment key={idx}>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">
            {segment.charAt(0).toUpperCase() + segment.slice(1)}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
