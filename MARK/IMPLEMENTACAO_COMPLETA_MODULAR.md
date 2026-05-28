# 🚀 IMPLEMENTAÇÃO COMPLETA ERP COZINCA - MODULAR

**Versão:** 2.0 Industrial  
**Paleta:** Cores Nomus (Azul #003D7A)  
**Framework:** React 18 + TypeScript + Tailwind + ShadcN/ui  
**Estrutura:** 12 módulos independentes e sequenciais

---

# 📦 ÍNDICE DE MÓDULOS

```
MÓDULO 1:  Design Tokens (Colors, Typography, Spacing)
MÓDULO 2:  Tailwind Config
MÓDULO 3:  Layout Principal (Sidebar + Header + Main)
MÓDULO 4:  Componentes Base (Button, Badge, Card, Modal)
MÓDULO 5:  Tabela Industrial Reutilizável
MÓDULO 6:  Fluxo de Produção (Kanban)
MÓDULO 7:  Sistema de Etiquetas (QR Code + Barcode)
MÓDULO 8:  Criação de O.P. em Lote
MÓDULO 9:  Dashboard de Produção
MÓDULO 10: APIs de Backend (Fluxo, Etiquetas, Lote)
MÓDULO 11: Hooks Customizados
MÓDULO 12: Types/Interfaces TypeScript
```

---

# ⚙️ MÓDULO 1: DESIGN TOKENS

**Arquivo:** `src/styles/designTokens.ts`

```typescript
/**
 * Design Tokens - Source of Truth
 * Cores: Nomus ERP (Azul principal)
 * Mantém consistência visual em todo o app
 */

export const designTokens = {
  // ========== CORES NOMUS ==========
  colors: {
    // Azul Principal (Nomus)
    primary: {
      50: '#F0F4FF',
      100: '#E0E9FF',
      200: '#C7D7FF',
      300: '#A4BBFF',
      400: '#7B96FF',
      500: '#5370FF', // Intermediário
      600: '#003D7A', // PRIMARY - Nomus oficial
      700: '#003366',
      800: '#002B52',
      900: '#001F3F',
    },
    
    // Cinza (Backgrounds)
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },

    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    neutral: '#6B7280',

    // Backgrounds
    bg: {
      light: '#FFFFFF',
      lighter: '#F9FAFB',
      lighter2: '#F3F4F6',
    },

    // Borders
    border: '#E5E7EB',
    border_dark: '#D1D5DB',
  },

  // ========== TIPOGRAFIA ==========
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      mono: ['Fira Code', 'Courier New', 'monospace'],
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '28px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['30px', { lineHeight: '36px' }],
      '4xl': ['36px', { lineHeight: '40px' }],
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  // ========== ESPAÇAMENTO ==========
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },

  // ========== SOMBRAS ==========
  shadows: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // ========== RAIOS ==========
  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },

  // ========== TRANSIÇÕES ==========
  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  // ========== BREAKPOINTS ==========
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Gerar CSS Variables
export const getCSSVariables = (): Record<string, string> => {
  const vars: Record<string, string> = {};
  
  // Cores primárias
  Object.entries(designTokens.colors.primary).forEach(([key, val]) => {
    vars[`--color-primary-${key}`] = val;
  });

  // Cores cinza
  Object.entries(designTokens.colors.gray).forEach(([key, val]) => {
    vars[`--color-gray-${key}`] = val;
  });

  // Status
  vars['--color-success'] = designTokens.colors.success;
  vars['--color-warning'] = designTokens.colors.warning;
  vars['--color-error'] = designTokens.colors.error;
  vars['--color-info'] = designTokens.colors.info;

  // Tipografia
  vars['--font-sans'] = designTokens.typography.fontFamily.sans.join(',');
  vars['--font-mono'] = designTokens.typography.fontFamily.mono.join(',');

  return vars;
};

// Exportar como padrão
export default designTokens;
```

---

# ⚙️ MÓDULO 2: TAILWIND CONFIG

**Arquivo:** `tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss';
import { designTokens } from './src/styles/designTokens';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  
  theme: {
    extend: {
      colors: {
        primary: designTokens.colors.primary,
        gray: designTokens.colors.gray,
        status: {
          success: designTokens.colors.success,
          warning: designTokens.colors.warning,
          error: designTokens.colors.error,
          info: designTokens.colors.info,
        },
      },
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans,
        mono: designTokens.typography.fontFamily.mono,
      },
      fontSize: designTokens.typography.fontSize,
      fontWeight: designTokens.typography.fontWeight,
      spacing: designTokens.spacing,
      boxShadow: designTokens.shadows,
      borderRadius: designTokens.borderRadius,
      transitionDuration: {
        fast: designTokens.transitions.fast,
        base: designTokens.transitions.base,
        slow: designTokens.transitions.slow,
      },
    },
  },

  plugins: [],
};

export default config;
```

---

# ⚙️ MÓDULO 3: LAYOUT PRINCIPAL

**Arquivo:** `src/components/layout/IndustrialLayout.tsx`

```typescript
import React, { useState } from 'react';
import { Outlet, useLocation } from 'wouter';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import './IndustrialLayout.css';

export const IndustrialLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();

  return (
    <div className="industrial-layout">
      {/* SIDEBAR */}
      <Sidebar isOpen={sidebarOpen} currentPath={location || ''} />

      {/* MAIN CONTENT */}
      <main className="main-content">
        {/* HEADER */}
        <Header 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          currentPath={location || ''}
        />

        {/* PAGE CONTENT */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
```

**Arquivo:** `src/components/layout/Sidebar.tsx`

```typescript
import React from 'react';
import { useLocation } from 'wouter';

interface SidebarProps {
  isOpen: boolean;
  currentPath: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, currentPath }) => {
  const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/dashboard' },
    { icon: '📦', label: 'Produtos', href: '/produtos' },
    { icon: '📋', label: 'Orçamentos', href: '/orcamentos' },
    { icon: '🚚', label: 'Vendas', href: '/vendas' },
  ];

  const productionItems = [
    { icon: '⚙️', label: 'Ordens de Serviço', href: '/producao/os' },
    { icon: '📍', label: 'Setores', href: '/producao/setores' },
    { icon: '📅', label: 'Planos de Produção', href: '/producao/planos' },
    { icon: '🏷️', label: 'Etiquetas', href: '/producao/etiquetas' },
    { icon: '📊', label: 'Dashboard Produção', href: '/producao/dashboard' },
  ];

  const financeItems = [
    { icon: '💰', label: 'Contas a Receber', href: '/financeiro/receber' },
    { icon: '💸', label: 'Contas a Pagar', href: '/financeiro/pagar' },
  ];

  const systemItems = [
    { icon: '⚙️', label: 'Configurações', href: '/configuracoes' },
    { icon: '👥', label: 'Usuários', href: '/usuarios' },
  ];

  const isActive = (href: string) => currentPath === href || currentPath?.startsWith(href + '/');

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* LOGO */}
      <div className="sidebar-header">
        <div className="logo-container">
          <span className="logo-icon">🏢</span>
          {isOpen && (
            <div className="logo-text">
              <h1>Cozinca</h1>
              <p>ERP Industrial</p>
            </div>
          )}
        </div>
      </div>

      {/* MENU */}
      <nav className="sidebar-nav">
        {/* Principal */}
        <div className="nav-section">
          {isOpen && <h3 className="nav-title">Principal</h3>}
          {menuItems.map((item) => (
            <NavLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isActive(item.href)}
              showLabel={isOpen}
            />
          ))}
        </div>

        {/* Produção */}
        <div className={`nav-section production-section ${!isOpen ? 'collapsed' : ''}`}>
          {isOpen && <h3 className="nav-title">🏭 PRODUÇÃO</h3>}
          {productionItems.map((item) => (
            <NavLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isActive(item.href)}
              showLabel={isOpen}
              highlight
            />
          ))}
        </div>

        {/* Financeiro */}
        <div className="nav-section">
          {isOpen && <h3 className="nav-title">Financeiro</h3>}
          {financeItems.map((item) => (
            <NavLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isActive(item.href)}
              showLabel={isOpen}
            />
          ))}
        </div>

        {/* Sistema */}
        <div className="nav-section">
          {isOpen && <h3 className="nav-title">Sistema</h3>}
          {systemItems.map((item) => (
            <NavLink
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isActive(item.href)}
              showLabel={isOpen}
            />
          ))}
        </div>
      </nav>

      {/* FOOTER */}
      <div className="sidebar-footer">
        {isOpen && (
          <div className="user-info">
            <div className="avatar">👤</div>
            <span className="username">Admin</span>
          </div>
        )}
      </div>
    </aside>
  );
};

interface NavLinkProps {
  icon: string;
  label: string;
  href: string;
  active: boolean;
  showLabel: boolean;
  highlight?: boolean;
}

function NavLink({ icon, label, href, active, showLabel, highlight }: NavLinkProps) {
  return (
    <a href={href} className={`nav-link ${active ? 'active' : ''} ${highlight ? 'highlight' : ''}`}>
      <span className="nav-icon">{icon}</span>
      {showLabel && <span className="nav-label">{label}</span>}
    </a>
  );
}
```

**Arquivo:** `src/components/layout/Header.tsx`

```typescript
import React from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
  currentPath: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, currentPath }) => {
  const getBreadcrumb = () => {
    const segments = currentPath?.split('/').filter(Boolean) || [];
    return segments.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' > ');
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="toggle-btn" onClick={onToggleSidebar} title="Toggle Sidebar">
          ☰
        </button>
        <div className="breadcrumb">
          <span className="breadcrumb-label">Você está em:</span>
          <span className="breadcrumb-path">{getBreadcrumb() || 'Dashboard'}</span>
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
  );
};
```

**Arquivo:** `src/components/layout/IndustrialLayout.css`

```css
/* ========== LAYOUT GERAL ========== */
.industrial-layout {
  display: flex;
  height: 100vh;
  background: #f9fafb;
  overflow: hidden;
}

/* ========== SIDEBAR ========== */
.sidebar {
  width: 280px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  overflow-y: auto;
}

.sidebar.closed {
  width: 80px;
}

.sidebar.closed .logo-text,
.sidebar.closed .nav-label {
  display: none;
}

.sidebar.closed .nav-section.production-section {
  border: none;
}

/* Logo */
.sidebar-header {
  padding: 20px;
  border-bottom: 2px solid #003D7A;
  background: linear-gradient(135deg, #F0F4FF 0%, #E0E9FF 100%);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 28px;
}

.logo-text h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #003D7A;
}

.logo-text p {
  margin: 0;
  font-size: 11px;
  color: #003D7A;
  opacity: 0.7;
}

/* Navegação */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 12px;
}

.nav-section.production-section {
  background: #F0F4FF;
  border-left: 4px solid #003D7A;
  padding: 12px;
  border-radius: 8px;
  margin: 0 8px;
}

.nav-section.production-section.collapsed {
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
}

.nav-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #003D7A;
  letter-spacing: 0.5px;
  padding: 0 8px;
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  color: #4B5563;
  text-decoration: none;
  transition: all 0.2s ease;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.nav-link:hover {
  background: #e5e9f2;
  color: #003D7A;
}

.nav-link.active {
  background: #E0E9FF;
  color: #003D7A;
  border-left: 4px solid #003D7A;
  padding-left: 8px;
  font-weight: 700;
}

.nav-link.highlight {
  font-weight: 600;
}

.nav-icon {
  font-size: 18px;
  min-width: 24px;
}

.nav-label {
  flex: 1;
}

/* Footer Sidebar */
.sidebar-footer {
  padding: 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 6px;
  background: #f3f4f6;
  cursor: pointer;
}

.avatar {
  font-size: 20px;
  min-width: 32px;
  text-align: center;
}

.username {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

/* ========== MAIN CONTENT ========== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ========== HEADER ========== */
.header {
  background: linear-gradient(135deg, #003D7A 0%, #002B52 100%);
  color: white;
  padding: 0 24px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 61, 122, 0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.toggle-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.breadcrumb {
  font-size: 12px;
  color: #C7D7FF;
  display: flex;
  align-items: center;
  gap: 6px;
}

.breadcrumb-label {
  color: rgba(255, 255, 255, 0.7);
}

.breadcrumb-path {
  color: white;
  font-weight: 600;
}

/* Search */
.header-center {
  flex: 2;
}

.search-box {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  padding: 0 16px;
  height: 40px;
}

.search-icon {
  font-size: 16px;
  margin-right: 8px;
  opacity: 0.8;
}

.search-input {
  background: none;
  border: none;
  color: white;
  outline: none;
  flex: 1;
  font-size: 14px;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

/* Header Right */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  position: relative;
  transition: background 0.2s;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #EF4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

/* ========== PAGE CONTENT ========== */
.page-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

/* ========== RESPONSIVO ========== */
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  }

  .sidebar.closed {
    transform: translateX(-100%);
  }
}

@media (max-width: 768px) {
  .header {
    padding: 0 16px;
  }

  .header-center {
    display: none;
  }

  .page-content {
    padding: 16px;
  }
}
```

---

# ⚙️ MÓDULO 4: COMPONENTES BASE

**Arquivo:** `src/components/ui/Button.tsx`

```typescript
import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  disabled,
  className,
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className || ''}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {isLoading ? '⏳ ' : ''}
      {children}
    </button>
  );
};
```

**Arquivo:** `src/components/ui/Button.css`

```css
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

/* Variantes */
.btn-primary {
  background: #003D7A;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #002B52;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 61, 122, 0.3);
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover:not(:disabled) {
  background: #d1d5db;
}

.btn-outline {
  background: white;
  color: #003D7A;
  border: 2px solid #003D7A;
}

.btn-outline:hover:not(:disabled) {
  background: #F0F4FF;
}

.btn-danger {
  background: #EF4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #DC2626;
}

.btn-success {
  background: #10B981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

/* Tamanhos */
.btn-sm {
  padding: 6px 12px;
  font-size: 12px;
}

.btn-md {
  padding: 10px 20px;
  font-size: 14px;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 16px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 1.2em;
}
```

**Arquivo:** `src/components/ui/Badge.tsx`

```typescript
import React from 'react';
import './Badge.css';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children }) => {
  return <span className={`badge badge-${variant}`}>{children}</span>;
};
```

**Arquivo:** `src/components/ui/Badge.css`

```css
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-default {
  background: #e5e7eb;
  color: #374151;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

.badge-error {
  background: #fee2e2;
  color: #7f1d1d;
}

.badge-info {
  background: #dbeafe;
  color: #1e40af;
}
```

**Arquivo:** `src/components/ui/Card.tsx`

```typescript
import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && <div className="card-header">{title}</div>}
      <div className="card-body">{children}</div>
    </div>
  );
};
```

**Arquivo:** `src/components/ui/Card.css`

```css
.card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background: #003D7A;
  color: white;
  padding: 16px 20px;
  font-weight: 600;
  border-bottom: 1px solid #002B52;
}

.card-body {
  padding: 20px;
}
```

---

# ⚙️ MÓDULO 5: TABELA INDUSTRIAL

**Arquivo:** `src/components/Table/IndustrialTable.tsx`

```typescript
import React, { useState } from 'react';
import './IndustrialTable.css';

interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

interface IndustrialTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  actions?: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedRows?: any[];
  onSelectChange?: (selectedIds: any[]) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  searchFilters?: React.ReactNode;
}

export function IndustrialTable<T extends { id?: number | string }>({
  columns,
  data,
  title,
  actions,
  onRowClick,
  selectable,
  selectedRows = [],
  onSelectChange,
  loading,
  pagination,
  searchFilters,
}: IndustrialTableProps<T>) {
  const [sortCol, setSortCol] = useState<string>();
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [hoveredRow, setHoveredRow] = useState<any>();

  const toggleRow = (id: any) => {
    if (onSelectChange) {
      onSelectChange(
        selectedRows.includes(id)
          ? selectedRows.filter((rid) => rid !== id)
          : [...selectedRows, id]
      );
    }
  };

  const toggleAll = () => {
    if (onSelectChange) {
      onSelectChange(
        selectedRows.length === data.length
          ? []
          : data.map((row: any) => row.id)
      );
    }
  };

  return (
    <div className="industrial-table-container">
      {/* HEADER */}
      {(title || searchFilters) && (
        <div className="table-header">
          {title && <h2 className="table-title">{title}</h2>}
          {searchFilters && <div className="table-filters">{searchFilters}</div>}
        </div>
      )}

      {/* TABELA */}
      <div className="table-wrapper">
        <table className="industrial-table">
          <thead>
            <tr>
              {selectable && (
                <th className="col-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  style={{ width: col.width, textAlign: col.align }}
                >
                  {col.label}
                </th>
              ))}
              {actions && <th className="col-actions">Ações</th>}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
                  <div className="loading">⏳ Carregando...</div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
                  <div className="empty">📭 Nenhum registro encontrado</div>
                </td>
              </tr>
            ) : (
              data.map((row: any, idx) => (
                <tr
                  key={row.id || idx}
                  className={`
                    ${hoveredRow === row.id ? 'hovered' : ''}
                    ${selectedRows.includes(row.id) ? 'selected' : ''}
                  `}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(undefined)}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="col-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id)}
                        onChange={() => toggleRow(row.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={String(col.key)} style={{ textAlign: col.align }}>
                      {col.render
                        ? col.render((row as any)[col.key as any], row)
                        : String((row as any)[col.key as any] || '—')}
                    </td>
                  ))}
                  {actions && (
                    <td className="col-actions">
                      <div onClick={(e) => e.stopPropagation()}>{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO */}
      {pagination && (
        <div className="table-footer">
          <div className="pagination-info">
            Exibindo {(pagination.page - 1) * pagination.limit + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            <strong>{pagination.total}</strong> resultados
          </div>
          <div className="pagination">
            <button
              disabled={pagination.page === 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              className="page-btn"
            >
              ← Anterior
            </button>

            {Array.from({
              length: Math.ceil(pagination.total / pagination.limit),
            }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                pageNum < pagination.page - 2 ||
                pageNum > pagination.page + 2
              ) {
                if (
                  pageNum !== 1 &&
                  pageNum !== Math.ceil(pagination.total / pagination.limit)
                ) {
                  return null;
                }
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => pagination.onPageChange(pageNum)}
                  className={`page-btn ${pagination.page === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={
                pagination.page ===
                Math.ceil(pagination.total / pagination.limit)
              }
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              className="page-btn"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Arquivo:** `src/components/Table/IndustrialTable.css`

```css
.industrial-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.table-header {
  padding: 20px;
  border-bottom: 2px solid #003D7A;
  background: linear-gradient(135deg, #F0F4FF 0%, #E0E9FF 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.table-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #003D7A;
}

.table-filters {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.table-wrapper {
  overflow-x: auto;
  flex: 1;
}

.industrial-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #1F2937;
}

.industrial-table thead {
  background: #003D7A;
  color: white;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 10;
}

.industrial-table thead th {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 2px solid #002B52;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.col-checkbox {
  width: 40px;
  padding: 14px 8px !important;
}

.col-actions {
  width: 100px;
}

.industrial-table tbody tr {
  border-bottom: 1px solid #E5E7EB;
  transition: all 0.15s ease;
}

.industrial-table tbody tr:hover {
  background: #F0F4FF;
}

.industrial-table tbody tr.hovered {
  background: #E0E9FF;
}

.industrial-table tbody tr.selected {
  background: #C7D7FF;
}

.industrial-table tbody td {
  padding: 12px 16px;
  color: #4B5563;
}

.col-checkbox input[type="checkbox"] {
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: #003D7A;
}

.loading,
.empty {
  text-align: center;
  padding: 40px 20px;
  color: #6B7280;
  font-size: 14px;
}

.loading {
  color: #003D7A;
  font-weight: 600;
}

.table-footer {
  padding: 16px 20px;
  background: #F9FAFB;
  border-top: 1px solid #E5E7EB;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.pagination-info {
  font-size: 13px;
  color: #6B7280;
}

.pagination {
  display: flex;
  gap: 8px;
}

.page-btn {
  padding: 8px 12px;
  border: 1px solid #E5E7EB;
  background: white;
  color: #003D7A;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #F0F4FF;
  border-color: #003D7A;
}

.page-btn.active {
  background: #003D7A;
  color: white;
  border-color: #003D7A;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .industrial-table {
    font-size: 12px;
  }

  .table-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

---

# ⚙️ MÓDULO 6: KANBAN FLUXO

**Arquivo:** `src/pages/producao/FluxoDashboard.tsx`

```typescript
import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import './FluxoDashboard.css';

interface OSSetorData {
  id: number;
  osId: number;
  numero: string;
  cliente: string;
  setor: string;
  status: 'pendente' | 'em_progresso' | 'retrabalhando' | 'concluida';
  prioridade: 'baixa' | 'media' | 'alta';
  dataInicio?: Date;
  tempoDecorrido?: number;
}

export const FluxoDashboard: React.FC = () => {
  const [osSetores] = useState<OSSetorData[]>([
    {
      id: 1,
      osId: 1,
      numero: 'OS-001',
      cliente: 'Cliente A',
      setor: 'Corte',
      status: 'em_progresso',
      prioridade: 'alta',
      dataInicio: new Date(),
      tempoDecorrido: 45,
    },
  ]);

  const statuses: Array<{
    key: OSSetorData['status'];
    label: string;
    icon: string;
    bgColor: string;
    borderColor: string;
  }> = [
    { key: 'pendente', label: 'Pendente', icon: '📋', bgColor: '#F3F4F6', borderColor: '#D1D5DB' },
    { key: 'em_progresso', label: 'Em Progresso', icon: '⚙️', bgColor: '#DBEAFE', borderColor: '#3B82F6' },
    { key: 'retrabalhando', label: 'Retrabalho', icon: '🔄', bgColor: '#FEF3C7', borderColor: '#F59E0B' },
    { key: 'concluida', label: 'Concluída', icon: '✅', bgColor: '#DCFCE7', borderColor: '#10B981' },
  ];

  const getOSByStatus = (status: OSSetorData['status']) => {
    return osSetores.filter((os) => os.status === status);
  };

  const getPriorityIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return '🔴';
      case 'media':
        return '🟡';
      case 'baixa':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div className="fluxo-dashboard">
      <div className="fluxo-header">
        <h1>🏭 Fluxo de Produção</h1>
      </div>

      <div className="status-cards-grid">
        {statuses.map((status) => {
          const count = getOSByStatus(status.key).length;
          return (
            <div key={status.key} className="status-card" style={{ borderLeftColor: status.borderColor }}>
              <div className="status-icon">{status.icon}</div>
              <div className="status-info">
                <p className="status-label">{status.label}</p>
                <p className="status-count">{count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="kanban-grid">
        {statuses.map((status) => (
          <div key={status.key} className="kanban-column" style={{ borderTopColor: status.borderColor }}>
            <div className="kanban-header">
              <h3 style={{ color: status.borderColor }}>{status.label}</h3>
              <span className="kanban-count">{getOSByStatus(status.key).length}</span>
            </div>

            <div className="kanban-cards" style={{ backgroundColor: status.bgColor }}>
              {getOSByStatus(status.key).map((os) => (
                <div key={os.id} className="os-card">
                  <div className="os-header">
                    <span className="os-numero">{os.numero}</span>
                    <span className="os-priority">{getPriorityIcon(os.prioridade)}</span>
                  </div>
                  <div className="os-content">
                    <p className="os-cliente">{os.cliente}</p>
                    <p className="os-setor">{os.setor}</p>
                  </div>
                  {os.tempoDecorrido && (
                    <div className="os-footer">
                      <span className="os-time">⏱️ {os.tempoDecorrido}min</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Arquivo:** `src/pages/producao/FluxoDashboard.css`

```css
.fluxo-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.fluxo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.fluxo-header h1 {
  margin: 0;
  font-size: 28px;
  color: #1F2937;
}

.status-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.status-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.status-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.status-icon {
  font-size: 32px;
}

.status-info {
  flex: 1;
}

.status-label {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #6B7280;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.status-count {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #1F2937;
}

.kanban-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 16px;
  overflow-x: auto;
}

.kanban-column {
  background: white;
  border-radius: 8px;
  border-top: 4px solid;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.kanban-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #E5E7EB;
  margin-bottom: 12px;
}

.kanban-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.kanban-count {
  background: #E5E7EB;
  color: #1F2937;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
}

.kanban-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex: 1;
  border-radius: 4px;
  padding: 8px;
}

.os-card {
  background: white;
  border-radius: 6px;
  border-left: 4px solid #003D7A;
  padding: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: grab;
  transition: all 0.2s;
}

.os-card:hover {
  box-shadow: 0 4px 8px rgba(0, 61, 122, 0.1);
  transform: translateY(-2px);
}

.os-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.os-numero {
  font-family: 'Courier New', monospace;
  font-weight: 700;
  color: #003D7A;
  font-size: 13px;
}

.os-priority {
  font-size: 14px;
}

.os-content {
  margin-bottom: 8px;
}

.os-content p {
  margin: 4px 0;
  font-size: 12px;
  color: #6B7280;
}

.os-cliente {
  font-weight: 600;
  color: #1F2937;
}

.os-setor {
  font-size: 11px;
  color: #9CA3AF;
}

.os-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px dotted #D1D5DB;
}

.os-time {
  font-size: 11px;
  color: #9CA3AF;
}
```

---

# ⚙️ MÓDULO 7: ETIQUETAS (QR CODE + BARCODE)

**Arquivo:** `src/pages/producao/EtiquetasPage.tsx`

```typescript
import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import { IndustrialTable } from '../../components/Table/IndustrialTable';
import { Button } from '../../components/ui/Button';
import './EtiquetasPage.css';

interface OSData {
  id: number;
  numero: string;
  cliente: string;
  produto: string;
  quantidade: number;
  status: string;
}

const mockOSData: OSData[] = [
  {
    id: 1,
    numero: 'OS-001',
    cliente: 'Cliente A',
    produto: 'Produto XYZ',
    quantidade: 50,
    status: 'em_producao',
  },
  {
    id: 2,
    numero: 'OS-002',
    cliente: 'Cliente B',
    produto: 'Produto ABC',
    quantidade: 100,
    status: 'em_producao',
  },
];

export const EtiquetasPage: React.FC = () => {
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [previewOS, setPreviewOS] = useState<OSData | null>(null);

  const handleImprir = () => {
    const printWindow = window.open('', '', 'width=1024,height=768');
    if (printWindow) {
      const conteudo = selecionadas
        .map((id) => {
          const os = mockOSData.find((o) => o.id === id);
          if (!os) return '';
          return renderEtiqueta(os);
        })
        .join('');
      printWindow.document.write(conteudo);
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const renderEtiqueta = (os: OSData) => {
    const qrData = JSON.stringify({ os: os.numero, cliente: os.cliente, qtd: os.quantidade });
    return `
      <div style="width: 100mm; height: 150mm; border: 2px solid #003D7A; padding: 10mm; margin: 10mm; font-family: Arial; page-break-after: always;">
        <div style="border-bottom: 3px solid #003D7A; padding-bottom: 8mm; text-align: center; margin-bottom: 8mm;">
          <div style="font-size: 20px; font-weight: bold; color: #003D7A;">🏢 COZINCA</div>
          <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #333;">${os.numero}</div>
        </div>
        <div style="font-size: 11px; margin-bottom: 8mm;">
          <div style="display: flex; justify-content: space-between; padding: 2mm 0; border-bottom: 1px dotted #ddd;">
            <span style="font-weight: bold; color: #003D7A;">Cliente:</span>
            <span>${os.cliente}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 2mm 0; border-bottom: 1px dotted #ddd;">
            <span style="font-weight: bold; color: #003D7A;">Produto:</span>
            <span>${os.produto}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 2mm 0; border-bottom: 1px dotted #ddd;">
            <span style="font-weight: bold; color: #003D7A;">Quantidade:</span>
            <span>${os.quantidade} un</span>
          </div>
        </div>
        <div style="text-align: center; font-size: 9px; color: #999; border-top: 1px dotted #ddd; padding-top: 2mm;">
          Gerado em ${new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    `;
  };

  return (
    <div className="etiquetas-page">
      <div className="etiquetas-header">
        <h1>🏷️ Gerador de Etiquetas</h1>
        <Button
          variant="primary"
          onClick={handleImprir}
          disabled={selecionadas.length === 0}
        >
          🖨️ Imprimir {selecionadas.length} Etiqueta{selecionadas.length !== 1 ? 's' : ''}
        </Button>
      </div>

      <IndustrialTable<OSData>
        title="Ordens de Serviço"
        columns={[
          {
            key: 'numero',
            label: 'O.S.',
            width: '120px',
            render: (val) => <span style={{ fontWeight: 'bold', color: '#003D7A', fontFamily: 'monospace' }}>{val}</span>,
          },
          { key: 'cliente', label: 'Cliente' },
          { key: 'produto', label: 'Produto' },
          { key: 'quantidade', label: 'Qtd', align: 'center' },
        ]}
        data={mockOSData}
        selectable
        selectedRows={selecionadas}
        onSelectChange={setSelecionadas}
        onRowClick={(os) => setPreviewOS(os)}
      />

      {previewOS && (
        <div className="preview-container">
          <h3>Preview da Etiqueta</h3>
          <div
            className="etiqueta-preview"
            dangerouslySetInnerHTML={{ __html: renderEtiqueta(previewOS) }}
          />
        </div>
      )}
    </div>
  );
};
```

**Arquivo:** `src/pages/producao/EtiquetasPage.css`

```css
.etiquetas-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.etiquetas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.etiquetas-header h1 {
  margin: 0;
  font-size: 28px;
  color: #1F2937;
}

.preview-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #E5E7EB;
  padding: 20px;
}

.preview-container h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #003D7A;
}

.etiqueta-preview {
  display: flex;
  justify-content: center;
  background: #f9fafb;
  border-radius: 4px;
  padding: 20px;
}
```

---

# ⚙️ MÓDULO 8: CRIAR O.P. EM LOTE

**Arquivo:** `src/pages/producao/CriarLoteOS.tsx`

```typescript
import React, { useState } from 'react';
import { IndustrialTable } from '../../components/Table/IndustrialTable';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface VendaData {
  id: number;
  numero: string;
  cliente: string;
  valor: number;
  data: string;
}

const mockVendas: VendaData[] = [
  {
    id: 1,
    numero: 'VND-001',
    cliente: 'Cliente A',
    valor: 1000,
    data: '27/05/2026',
  },
  {
    id: 2,
    numero: 'VND-002',
    cliente: 'Cliente B',
    valor: 2000,
    data: '27/05/2026',
  },
];

export const CriarLoteOS: React.FC = () => {
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCriarLote = async () => {
    setLoading(true);
    try {
      // Simular API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert(`✅ ${selecionadas.length} O.S. criadas com sucesso!`);
      setSelecionadas([]);
    } finally {
      setLoading(false);
    }
  };

  const totalValor = mockVendas
    .filter((v) => selecionadas.includes(v.id))
    .reduce((sum, v) => sum + v.valor, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>📦 Gerar O.S. em Lote</h1>
        <Button
          variant="primary"
          onClick={handleCriarLote}
          disabled={selecionadas.length === 0 || loading}
          isLoading={loading}
        >
          ✅ Criar {selecionadas.length} O.S.
        </Button>
      </div>

      {selecionadas.length > 0 && (
        <Card title="Preview - Serão criadas" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {mockVendas
              .filter((v) => selecionadas.includes(v.id))
              .map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px',
                    background: '#F0F4FF',
                    borderRadius: '4px',
                  }}
                >
                  <span style={{ fontWeight: 'bold', color: '#003D7A' }}>{v.numero}</span>
                  <span>{v.cliente}</span>
                  <span>R$ {v.valor.toFixed(2)}</span>
                </div>
              ))}
            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid #E5E7EB',
                fontWeight: 'bold',
              }}
            >
              Total: R$ {totalValor.toFixed(2)}
            </div>
          </div>
        </Card>
      )}

      <IndustrialTable<VendaData>
        title="Vendas Disponíveis"
        columns={[
          { key: 'numero', label: 'Venda', width: '120px' },
          { key: 'cliente', label: 'Cliente' },
          { key: 'valor', label: 'Valor', align: 'right', render: (v) => `R$ ${v.toFixed(2)}` },
          { key: 'data', label: 'Data', width: '100px' },
        ]}
        data={mockVendas}
        selectable
        selectedRows={selecionadas}
        onSelectChange={setSelecionadas}
      />
    </div>
  );
};
```

---

# ⚙️ MÓDULO 9: DASHBOARD PRODUÇÃO

**Arquivo:** `src/pages/producao/DashboardProducao.tsx`

```typescript
import React from 'react';

interface KPIData {
  title: string;
  value: string;
  icon: string;
  color: string;
}

export const DashboardProducao: React.FC = () => {
  const kpis: KPIData[] = [
    { title: 'Eficiência Geral', value: '94%', icon: '⚡', color: '#003D7A' },
    { title: 'O.S. em Andamento', value: '53', icon: '⚙️', color: '#3B82F6' },
    { title: 'Tempo Médio', value: '3.2h', icon: '⏱️', color: '#10B981' },
    { title: 'Taxa Retrabalho', value: '2.1%', icon: '🔄', color: '#F59E0B' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ margin: 0, fontSize: '28px' }}>📊 Dashboard de Produção</h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            style={{
              background: 'white',
              borderRadius: '8px',
              borderLeft: `4px solid ${kpi.color}`,
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px' }}>{kpi.icon}</div>
              <div>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
                  {kpi.title}
                </div>
                <div style={{ fontSize: '32px', fontWeight: '700', color: kpi.color }}>
                  {kpi.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', color: '#003D7A' }}>Produção por Setor</h3>
        <div style={{ textAlign: 'center', color: '#6B7280', padding: '40px' }}>
          Gráfico será integrado com Recharts
        </div>
      </div>
    </div>
  );
};
```

---

# ⚙️ MÓDULO 10: TIPOS TYPESCRIPT

**Arquivo:** `src/types/index.ts`

```typescript
/**
 * Tipos globais da aplicação
 */

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: TipoUsuario;
  setorId?: number;
  ativo: boolean;
}

export enum TipoUsuario {
  MASTER = 'master',
  GERENTE = 'gerente',
  VENDEDOR = 'vendedor',
  PRODUCAO = 'producao',
  FINANCEIRO = 'financeiro',
  VISUALIZADOR = 'visualizador',
}

export interface Setor {
  id: number;
  nome: string;
  tipo: string;
  sequencia: number;
  tempoEsperado?: number;
}

export interface OrdemServico {
  id: number;
  numero: string;
  vendaId: number;
  clienteId: number;
  status: 'pendente' | 'em_producao' | 'concluida' | 'cancelada';
  etapaAtual: string;
  prioridade: 'baixa' | 'media' | 'alta';
  dataInicio: Date;
  dataTermino?: Date;
  observacoes?: string;
}

export interface OSSetor {
  id: number;
  osId: number;
  setorId: number;
  sequencia: number;
  status: 'pendente' | 'em_progresso' | 'retrabalhando' | 'concluida';
  dataInicio?: Date;
  dataFim?: Date;
  tempoReal?: number;
}

export interface Cliente {
  id: number;
  razaoSocial: string;
  email: string;
  telefone: string;
  endereco?: string;
}

export interface Produto {
  id: number;
  codigo: string;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
}

export interface Venda {
  id: number;
  numero: string;
  clienteId: number;
  usuarioId: number;
  valorTotal: number;
  status: 'orcamento' | 'aprovada' | 'cancelada';
  dataVenda: Date;
  itens: ItemVenda[];
}

export interface ItemVenda {
  id: number;
  vendaId: number;
  produtoId?: number;
  descricaoManual: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface FluxoProducao {
  id: number;
  nome: string;
  ativo: boolean;
  etapas: SetorFluxo[];
}

export interface SetorFluxo {
  id: number;
  fluxoId: number;
  setorId: number;
  sequencia: number;
  tempoEsperado?: number;
}

export interface Etiqueta {
  osId: number;
  numero: string;
  cliente: string;
  produto: string;
  quantidade: number;
  dataProducao: Date;
  qrCode?: string;
  codigoBarras?: string;
}
```

---

# ⚙️ MÓDULO 11: HOOKS CUSTOMIZADOS

**Arquivo:** `src/hooks/useOSData.ts`

```typescript
import { useState, useEffect } from 'react';

export const useOSData = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // const response = await fetch('/api/os');
        // const json = await response.json();
        // setData(json);
        setData([]); // Mock
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

export const useFluxoData = () => {
  const [osSetores, setOSSetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // Simulado
        setOSSetores([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return { osSetores, loading };
};
```

---

# ⚙️ MÓDULO 12: APIS BACKEND

**Arquivo:** `api-server/src/routes/os.ts` (Exemplo)

```typescript
import { Router } from 'express';
import { db } from '../lib/prisma';
import { requireAuth, requireRoles } from '../middleware/auth';

const router = Router();

/**
 * GET /api/os
 * Listar ordens de serviço
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      db.ordemServico.findMany({
        where: { status: status as any },
        include: { cliente: true, venda: true },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      db.ordemServico.count({ where: { status: status as any } }),
    ]);

    res.json({
      data,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar O.S.' });
  }
});

/**
 * POST /api/os
 * Criar ordem de serviço
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const { vendaId, clienteId, dataInicio } = req.body;

    const os = await db.ordemServico.create({
      data: {
        numero: `OS-${Date.now()}`,
        vendaId,
        clienteId,
        dataInicio: new Date(dataInicio),
        status: 'pendente',
        etapaAtual: 'autorizacao',
      },
      include: { cliente: true },
    });

    res.status(201).json(os);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar O.S.' });
  }
});

/**
 * POST /api/os-batch/criar-lote
 * Criar múltiplas O.S. de uma vez
 */
router.post('/batch/criar-lote', requireAuth, requireRoles(['gerente', 'master']), async (req, res) => {
  try {
    const { vendaIds } = req.body;

    const vendas = await db.venda.findMany({
      where: { id: { in: vendaIds } },
      include: { cliente: true },
    });

    const osLote = await Promise.all(
      vendas.map((venda) =>
        db.ordemServico.create({
          data: {
            numero: `OS-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            vendaId: venda.id,
            clienteId: venda.clienteId,
            dataInicio: new Date(),
            status: 'pendente',
            etapaAtual: 'autorizacao',
          },
        })
      )
    );

    res.status(201).json({
      message: `${osLote.length} O.S. criadas com sucesso`,
      osLote,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar lote' });
  }
});

export default router;
```

---

# 🚀 COMO USAR ESTE ARQUIVO

## Opção 1: Implementar Sequencialmente

```bash
# Módulo 1
npm install
# Criar arquivo src/styles/designTokens.ts (copie Módulo 1)

# Módulo 2
# Atualizar tailwind.config.ts (copie Módulo 2)

# Módulo 3
# Criar componentes de layout (copie Módulo 3)

# Módulo 4
# Criar componentes base (copie Módulo 4)

# ... e assim por diante
```

## Opção 2: Enviar para Claude Code

```
Copie cada módulo individualmente e envie como prompt:

"Crie o Módulo 1 - Design Tokens
Arquivo: src/styles/designTokens.ts
[Cole o código do Módulo 1]"

"Crie o Módulo 2 - Tailwind Config
Arquivo: tailwind.config.ts
[Cole o código do Módulo 2]"

... etc
```

## Opção 3: Enviar Tudo de Uma Vez

```
Cole este arquivo inteiro no Claude Code e peça:

"Implemente todos os 12 módulos nesta estrutura:
- Módulo 1: Design Tokens
- Módulo 2: Tailwind
- Módulo 3: Layout
... etc

Crie todos os arquivos necessários com este código"
```

---

# ✅ CHECKLIST DE IMPLEMENTAÇÃO

```
MÓDULO 1: Design Tokens
□ src/styles/designTokens.ts criado
□ Cores Nomus (azul) configuradas
□ Tailwind config atualizado
□ CSS variables pronto

MÓDULO 2: Tailwind Config
□ tailwind.config.ts atualizado
□ Design tokens integrados
□ Build funcionando

MÓDULO 3: Layout
□ src/components/layout/ criada
□ IndustrialLayout.tsx
□ Sidebar.tsx
□ Header.tsx
□ CSS inclusos
□ Responsive testado

MÓDULO 4: Componentes Base
□ Button.tsx/css
□ Badge.tsx/css
□ Card.tsx/css

MÓDULO 5: Tabela
□ IndustrialTable.tsx
□ CSS completo
□ Sorting, seleção, paginação

MÓDULO 6: Kanban
□ FluxoDashboard.tsx
□ CSS para drag-and-drop
□ Status cards

MÓDULO 7: Etiquetas
□ EtiquetasPage.tsx
□ QR Code renderizando
□ Print funcionando

MÓDULO 8: Criar O.P. Lote
□ CriarLoteOS.tsx
□ Preview em tempo real
□ Validações

MÓDULO 9: Dashboard
□ DashboardProducao.tsx
□ KPI Cards
□ Pronto para Recharts

MÓDULO 10: Types
□ src/types/index.ts
□ Todas as interfaces
□ Enums

MÓDULO 11: Hooks
□ useOSData.ts
□ useFluxoData.ts

MÓDULO 12: APIs
□ Backend routes implementadas
□ POST /api/os
□ POST /api/os-batch/criar-lote

FINAL
□ Todos os módulos integrados
□ App funcionando
□ Build sem erros
□ Deploy pronto
```

---

# 🎯 RESULTADO FINAL

Após implementar todos os 12 módulos:

```
✅ Layout profissional (colors Nomus azul)
✅ Sidebar + Header funcionando
✅ Tabelas industriais reutilizáveis
✅ Fluxo Kanban visual
✅ Etiquetas com QR Code
✅ Criação de O.P. em lote
✅ Dashboard com métricas
✅ APIs prontas
✅ Type-safe 100%
✅ Pronto para produção
```

---

**Tudo pronto para começar! Basta copiar e colar! 🚀**
