import { Link, useLocation } from "wouter";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronRight,
  Clock,
  Factory,
  FileText,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Timer,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { industrialModules } from "@/modules/industrial/modules";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "react-responsive";
import { GlobalSearch } from "@/components/GlobalSearch";

interface LayoutProps {
  children: React.ReactNode;
}

const groupOrder = [
  "Gestao",
  "Receita",
  "Industrial",
  "Fabrica",
  "Suprimentos",
  "Administrativo",
  "Pos-venda",
  "Sistema",
];

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  // Atalho de teclado para busca global (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchOpen]);

  const groupedModules = useMemo(() => {
    return groupOrder
      .map((group) => ({
        group,
        items: industrialModules.filter((item) => item.group === group),
      }))
      .filter((entry) => entry.items.length > 0);
  }, []);

  const currentModule =
    industrialModules
      .filter((item) => location === item.href || location.startsWith(`${item.href}/`))
      .sort((a, b) => b.href.length - a.href.length)[0] ?? industrialModules[0];
  const CurrentModuleIcon = currentModule.icon;

  const Sidebar = useCallback(({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex h-full flex-col bg-[#07080b] text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#F7931A]/10 text-[#F7931A] ring-1 ring-[#F7931A]/20">
            <Factory className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-normal">COZINCA ERP</p>
            <p className="text-[11px] font-medium uppercase text-white/60">Industrial Enterprise</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-[8px] border border-white/10 bg-white/5 p-2">
          <div className="flex flex-col items-center gap-1">
            <FileText className="h-4 w-4 text-[#FFD600]" />
            <p className="text-[10px] text-white/60">O.S.</p>
            <p className="text-sm font-bold text-[#FFD600]">95</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Timer className="h-4 w-4 text-[#F7931A]" />
            <p className="text-[10px] text-white/60">SLA</p>
            <p className="text-sm font-bold text-[#F7931A]">91%</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="h-4 w-4 text-[#EA580C]" />
            <p className="text-[10px] text-white/60">Turno</p>
            <p className="text-sm font-bold text-[#EA580C]">A</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groupedModules.map((entry) => (
          <div key={entry.group}>
            <button
              onClick={() => toggleGroup(entry.group)}
              className="mb-2 flex w-full items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-normal text-white/50 hover:text-white/80 transition-colors duration-200"
            >
              {collapsedGroups.has(entry.group) ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {entry.group}
            </button>
            {!collapsedGroups.has(entry.group) && (
              <div className="space-y-1">
                {entry.items.map((item) => {
                  const Icon = item.icon;
                  const active =
                    location === item.href ||
                    (item.href !== "/" && location.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-[6px] px-3 py-2 text-sm font-semibold transition-all duration-200 ease-in-out",
                        active
                          ? "bg-[#1B1209] text-white shadow-[0_0_30px_-15px_rgba(247,147,26,0.25)] scale-[1.02]"
                          : "text-white/75 hover:bg-white/10 hover:text-white hover:scale-[1.02]",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                      <span className="min-w-0 truncate">{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-3 rounded-[8px] border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7931A]/10 text-xs font-black text-[#F7931A]">
              {(user?.nome ?? "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{user?.nome ?? "Usuario ERP"}</p>
              <p className="truncate text-[11px] text-white/60">
                {user?.tipo ?? "operacao"} - permissoes ativas
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start rounded-[6px] text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200 ease-in-out"
        >
          <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
          Sair
        </Button>
      </div>
    </div>
  ), [location, user, logout, groupedModules, collapsedGroups, toggleGroup]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#030304] text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid-void opacity-25" />
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-[#F7931A]/10 blur-3xl" />
        <div className="absolute right-[-4rem] bottom-10 h-72 w-72 rounded-full bg-[#EA580C]/10 blur-3xl" />
      </div>

      {!isMobile && (
        <aside className="w-[280px] shrink-0 border-r border-white/10 bg-[#07080b] flex flex-col">
          <Sidebar />
        </aside>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            aria-label="Fechar menu"
            className="fixed inset-0 bg-slate-950/55"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[280px]">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl transition-all duration-300 ease-in-out">
          <div className="flex h-16 flex-col gap-2 px-4 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:gap-3 md:px-6 md:py-0">
            <div className="flex min-w-0 items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 transition-all duration-200 ease-in-out hover:scale-110"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              {!isMobile && (
                <div
                  className="h-10 w-10 shrink-0 flex items-center justify-center rounded-[8px] border border-[#F7931A]/20 bg-[#F7931A]/10 text-[#F7931A]"
                >
                  <CurrentModuleIcon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-base font-black text-white md:text-lg">
                    {currentModule.title}
                  </h1>
                  {!isMobile && (
                    <ChevronDown className="h-4 w-4 shrink-0 text-white/60" />
                  )}
                </div>
                {!isMobile && (
                  <p className="truncate text-xs text-white/60">
                    {currentModule.description}
                  </p>
                )}
              </div>
            </div>

            {isDesktop && (
              <div className="flex-1 justify-center px-4 xl:px-6">
                <div className="relative w-full max-w-xl">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    className="h-12 rounded-full border-white/10 bg-white/5 pl-11 text-sm text-white placeholder:text-white/40 shadow-none transition-all duration-200 ease-in-out hover:border-[#F7931A]/40 hover:bg-white/10"
                    placeholder="Buscar O.S., cliente, produto, lote, boleto ou desenho... (Ctrl+K)"
                    onClick={() => setSearchOpen(true)}
                    readOnly
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border bg-muted text-[10px] text-white/60">Ctrl+K</kbd>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 overflow-x-auto">
              {!isMobile && (
                <div className="shrink-0 items-center gap-2 rounded-[6px] border border-[#F7931A]/20 bg-[#F7931A]/10 px-3 py-2 text-xs font-bold text-[#F7931A] flex transition-all duration-200 ease-in-out hover:bg-[#F7931A]/15 hover:shadow-[0_0_20px_rgba(247,147,26,0.2)]">
                  <span className="h-2 w-2 rounded-full bg-[#F7931A] animate-pulse" />
                  Tempo real
                </div>
              )}
              {!isMobile && (
                <Button variant="ghost" size="icon" className="relative transition-all duration-200 ease-in-out hover:scale-110">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    3
                  </span>
                </Button>
              )}
              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="shrink-0 flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 transition-all duration-200 ease-in-out hover:border-[#F7931A]/30 hover:bg-white/10 hover:shadow-[0_0_25px_-10px_rgba(247,147,26,0.18)] cursor-pointer">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F7931A]/10 text-[#F7931A] text-xs font-bold transition-transform duration-200 hover:scale-110">
                        {(user?.nome ?? "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-white">{user?.nome ?? "Usuario"}</p>
                        <p className="truncate text-[10px] text-white/60">{user?.tipo ?? "operacao"}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-white/60" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-semibold">{user?.nome ?? "Usuario"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email ?? "usuario@empresa.com"}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <User className="h-4 w-4 mr-2" />
                      Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Permissões
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>

      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
