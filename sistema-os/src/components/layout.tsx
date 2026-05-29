import { Link, useLocation } from "wouter";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Building2,
  ChevronDown,
  Factory,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });

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
    <div className="flex h-full flex-col bg-[#0B1F33] text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#003D7A] ring-1 ring-white/10">
            <Factory className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black tracking-normal">COZINCA ERP</p>
            <p className="text-[11px] font-medium uppercase text-blue-100/70">Industrial Enterprise</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-[8px] border border-white/10 bg-white/[0.04] p-2">
          <div>
            <p className="text-[10px] text-blue-100/60">O.S.</p>
            <p className="text-sm font-bold">95</p>
          </div>
          <div>
            <p className="text-[10px] text-blue-100/60">SLA</p>
            <p className="text-sm font-bold">91%</p>
          </div>
          <div>
            <p className="text-[10px] text-blue-100/60">Turno</p>
            <p className="text-sm font-bold">A</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {groupedModules.map((entry) => (
          <div key={entry.group}>
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-normal text-blue-100/50">
              {entry.group}
            </p>
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
                      "group flex items-center gap-3 rounded-[6px] px-3 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-[#003D7A] text-white shadow-sm"
                        : "text-blue-50/75 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="min-w-0 truncate">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-3 rounded-[8px] border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E0E9FF] text-xs font-black text-[#003D7A]">
              {(user?.nome ?? "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{user?.nome ?? "Usuario ERP"}</p>
              <p className="truncate text-[11px] text-blue-100/60">
                {user?.tipo ?? "operacao"} - permissoes ativas
              </p>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start rounded-[6px] text-blue-50/75 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  ), [location, user, logout, groupedModules]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F9FAFB] text-slate-950">
      {!isMobile && (
        <aside className="w-[280px] shrink-0 border-r border-slate-200 flex flex-col">
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
        <header className="shrink-0 border-b border-slate-200 bg-white">
          <div className="flex h-16 flex-col gap-2 px-4 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:gap-3 md:px-6 md:py-0">
            <div className="flex min-w-0 items-center gap-3">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              {!isMobile && (
                <div
                  className="h-9 w-9 shrink-0 items-center justify-center rounded-[6px] border flex"
                  style={{
                    color: currentModule.accent,
                    backgroundColor: `${currentModule.accent}12`,
                    borderColor: `${currentModule.accent}24`,
                  }}
                >
                  <CurrentModuleIcon className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-base font-black text-slate-950 md:text-lg">
                    {currentModule.title}
                  </h1>
                  {!isMobile && (
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  )}
                </div>
                {!isMobile && (
                  <p className="truncate text-xs text-slate-500">
                    {currentModule.description}
                  </p>
                )}
              </div>
            </div>

            {isDesktop && (
              <div className="flex-1 justify-center px-4 xl:px-6">
                <div className="relative w-full max-w-xl">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    className="h-9 rounded-[6px] border-slate-200 bg-slate-50 pl-9 text-sm cursor-pointer"
                    placeholder="Buscar O.S., cliente, produto, lote, boleto ou desenho... (Ctrl+K)"
                    onClick={() => setSearchOpen(true)}
                    readOnly
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border bg-muted text-[10px] text-slate-500">Ctrl+K</kbd>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 overflow-x-auto">
              {!isMobile && (
                <div className="shrink-0 items-center gap-2 rounded-[6px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 flex">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Tempo real
                </div>
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
