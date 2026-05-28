import { Switch, Route, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { IndustrialLayout } from "@/components/layouts/IndustrialLayout";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import OrcamentosPage from "@/pages/orcamentos";
import OrcamentoNovoPage from "@/pages/orcamento-novo";
import OrcamentoDetailPage from "@/pages/orcamento-detail";
import VendasPage from "@/pages/vendas";
import VendaNovaPage from "@/pages/venda-nova";
import VendaDetailPage from "@/pages/venda-detail";
import OSPage from "@/pages/os";
import OSDetailPage from "@/pages/os-detail";
import FinanceiroPage from "@/pages/financeiro";
import ContasReceberPage from "@/pages/contas-receber";
import ContasPagarPage from "@/pages/contas-pagar";
import ClientesPage from "@/pages/clientes";
import ProdutosPage from "@/pages/produtos";
import UsuariosPage from "@/pages/usuarios";
import OSPrintPage from "@/pages/os-print";
import KanbanProducaoPage from "@/pages/kanban-producao";
import KanbanComercialPage from "@/pages/kanban-comercial";
import EngenhariaPage from "@/pages/engenharia";

// Novas páginas
import { FluxoDashboard } from "@/pages/producao/FluxoDashboard";
import { EtiquetasPage } from "@/pages/producao/EtiquetasPage";
import { CriarLoteOS } from "@/pages/producao/CriarLoteOS";
import { DashboardProducao } from "@/pages/producao/DashboardProducao";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/os/:id/print" component={OSPrintPage} />

      {/* Rota Raiz redireciona para o novo layout */}
      <Route path="/">
        <IndustrialLayout>
          <Switch>
            <Route path="/dashboard">
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            </Route>
            <Route path="/orcamentos">
              <AuthGuard>
                <OrcamentosPage />
              </AuthGuard>
            </Route>
            <Route path="/orcamentos/novo">
              <AuthGuard>
                <OrcamentoNovoPage />
              </AuthGuard>
            </Route>
            <Route path="/orcamentos/:id">
              <AuthGuard>
                <OrcamentoDetailPage />
              </AuthGuard>
            </Route>
            <Route path="/vendas">
              <AuthGuard>
                <VendasPage />
              </AuthGuard>
            </Route>
            <Route path="/vendas/nova">
              <AuthGuard>
                <VendaNovaPage />
              </AuthGuard>
            </Route>
            <Route path="/vendas/:id">
              <AuthGuard>
                <VendaDetailPage />
              </AuthGuard>
            </Route>
            <Route path="/producao/os">
              <AuthGuard>
                <OSPage />
              </AuthGuard>
            </Route>
            <Route path="/os/:id">
              <AuthGuard>
                <OSDetailPage />
              </AuthGuard>
            </Route>
             <Route path="/producao/setores">
                <AuthGuard>
                    <KanbanProducaoPage />
                </AuthGuard>
            </Route>
            <Route path="/producao/planos">
                <AuthGuard>
                    <CriarLoteOS />
                </AuthGuard>
            </Route>
            <Route path="/producao/etiquetas">
                <AuthGuard>
                    <EtiquetasPage />
                </AuthGuard>
            </Route>
            <Route path="/producao/dashboard">
                <AuthGuard>
                    <DashboardProducao />
                </AuthGuard>
            </Route>
            <Route path="/financeiro">
              <AuthGuard>
                <FinanceiroPage />
              </AuthGuard>
            </Route>
            <Route path="/financeiro/receber">
              <AuthGuard>
                <ContasReceberPage />
              </AuthGuard>
            </Route>
            <Route path="/financeiro/pagar">
              <AuthGuard>
                <ContasPagarPage />
              </AuthGuard>
            </Route>
            <Route path="/clientes">
              <AuthGuard>
                <ClientesPage />
              </AuthGuard>
            </Route>
            <Route path="/produtos">
              <AuthGuard>
                <ProdutosPage />
              </AuthGuard>
            </Route>
            <Route path="/usuarios">
              <AuthGuard>
                <UsuariosPage />
              </AuthGuard>
            </Route>
            <Route path="/engenharia">
              <AuthGuard>
                <EngenhariaPage />
              </AuthGuard>
            </Route>
             <Route path="/kanban/comercial">
                <AuthGuard>
                    <KanbanComercialPage />
                </AuthGuard>
            </Route>
            <Route path="/">
              <Redirect to="/dashboard" />
            </Route>
            <Route>
              <NotFound />
            </Route>
          </Switch>
        </IndustrialLayout>
      </Route>

      {/* Fallback para Not Found */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

export default App;
