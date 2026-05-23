import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  ShoppingCart,
  ClipboardList,
  DollarSign,
  Users,
  Package,
  UserCog,
  LogOut,
  ChevronDown,
  Menu,
  Wrench,
  Scissors,
  Flame,
  Snowflake,
  Hammer,
  Wind,
  Check,
  Box,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavChild = { href: string; label: string; roles?: string[] };
type NavLeaf  = { href: string; icon: any; label: string; roles?: string[] };
type NavGroup = { label: string; icon: any; children: NavChild[]; roles?: string[] };
type NavItem  = NavLeaf | NavGroup;

const ALL_NAV: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/orcamentos", icon: FileText, label: "Orçamentos", roles: ["master","gerente","vendedor"] },
  { href: "/vendas", icon: ShoppingCart, label: "Vendas", roles: ["master","gerente","vendedor"] },
  { href: "/os", icon: ClipboardList, label: "Ordens de Serviço" },
  {
    label: "Financeiro",
    icon: DollarSign,
    roles: ["master"],
    children: [
      { href: "/financeiro", label: "Visão Geral" },
      { href: "/financeiro/contas-receber", label: "Contas a Receber" },
      { href: "/financeiro/contas-pagar", label: "Contas a Pagar" },
    ],
  },
  {
    label: "Cadastros",
    icon: Package,
    roles: ["master","gerente","vendedor"],
    children: [
      { href: "/cadastros/clientes", label: "Clientes" },
      { href: "/cadastros/produtos", label: "Produtos" },
      { href: "/cadastros/usuarios", label: "Usuários", roles: ["master"] },
    ],
  },
];

const SECTOR_ICONS: Record<string, any> = {
  corte: Scissors,
  dobra: Wind,
  solda: Flame,
  refrigeracao: Snowflake,
  acabamento: Hammer,
  finalizacao: Check,
  montagem: Box,
  dashboard_producao: Eye,
};

function canSeeItem(item: NavItem, tipo: string): boolean {
  if (!("roles" in item) || !item.roles) return true;
  return item.roles.includes(tipo);
}

interface NavItemProps {
  item: NavItem;
  location: string;
  onNavigate?: () => void;
}

function NavItemView({ item, location, onNavigate }: NavItemProps) {
  const [open, setOpen] = useState(false);

  if ("children" in item && item.children) {
    const visibleChildren = item.children.filter(c => !("roles" in c) || !(c as any).roles || (c as any).roles.includes("master"));
    if (!visibleChildren.length) return null;
    const isActive = visibleChildren.some(c => location.startsWith(c.href));
    const Icon = item.icon;
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="ml-7 mt-1 space-y-1">
            {visibleChildren.map(child => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                className={cn(
                  "block px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  location === child.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  const leaf = item as NavLeaf;
  const isActive = location === leaf.href;
  const Icon = leaf.icon;
  return (
    <Link
      href={leaf.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{leaf.label}</span>
    </Link>
  );
}

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleLabels: Record<string, string> = {
    master: "Master",
    vendedor: "Vendedor",
    projetista: "Projetista",
    gerente: "Gerente de Produção",
    producao: "Produção",
    corte: "Setor de Corte",
    dobra: "Setor de Dobra",
    solda: "Setor de Solda",
    refrigeracao: "Setor de Refrigeração",
    acabamento: "Setor de Acabamento",
    finalizacao: "Setor de Finalização",
    montagem: "Setor de Montagem",
    dashboard_producao: "Painel Produção",
  };

  const tipo = user?.tipo ?? "";

  // Build the navigation items visible to this user
  const visibleNav = ALL_NAV.filter(item => canSeeItem(item, tipo)).map(item => {
    if ("children" in item && item.children) {
      const visibleChildren = item.children.filter(c => !("roles" in c) || !(c as any).roles || (c as any).roles.includes(tipo));
      return { ...item, children: visibleChildren };
    }
    return item;
  }).filter(item => {
    if ("children" in item && item.children) return item.children.length > 0;
    return true;
  });

  // For sector users, show a sector badge
  const SectorIcon = SECTOR_ICONS[tipo];

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full bg-sidebar">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border/30">
        <div className="bg-sidebar-primary rounded-md p-1.5">
          <Wrench className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <p className="text-sidebar-foreground font-bold text-sm leading-tight">Sistema OS</p>
          <p className="text-sidebar-foreground/50 text-xs">Gestão Industrial</p>
        </div>
      </div>

      {SectorIcon && (
        <div className="mx-3 mt-3 flex items-center gap-2 px-3 py-2 rounded-md bg-sidebar-accent/30 border border-sidebar-border/20">
          <SectorIcon className="h-4 w-4 text-sidebar-primary shrink-0" />
          <span className="text-sidebar-foreground text-xs font-medium">{roleLabels[tipo]}</span>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNav.map((item, i) => (
          <NavItemView key={i} item={item} location={location} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border/30">
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div className="bg-sidebar-primary/20 rounded-full w-7 h-7 flex items-center justify-center">
            <span className="text-sidebar-primary text-xs font-bold">
              {user?.nome?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sidebar-foreground text-xs font-medium truncate">{user?.nome}</p>
            <p className="text-sidebar-foreground/50 text-xs truncate">{roleLabels[tipo] ?? tipo}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 gap-2"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 border-r border-border">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 flex flex-col">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Sistema OS</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
