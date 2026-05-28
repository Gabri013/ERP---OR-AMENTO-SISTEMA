import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
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
import EnterpriseModulePage from "@/pages/enterprise-module";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <AuthGuard>
          <DashboardPage />
        </AuthGuard>
      </Route>
      <Route path="/orcamentos">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="orcamentos" />
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
          <EnterpriseModulePage moduleKey="vendas" />
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
      <Route path="/os">
        <AuthGuard>
          <OSPage />
        </AuthGuard>
      </Route>
      <Route path="/os/:id">
        <AuthGuard>
          <OSDetailPage />
        </AuthGuard>
      </Route>
      <Route path="/financeiro">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="financeiro" />
        </AuthGuard>
      </Route>
      <Route path="/financeiro/contas-receber">
        <AuthGuard>
          <ContasReceberPage />
        </AuthGuard>
      </Route>
      <Route path="/financeiro/contas-pagar">
        <AuthGuard>
          <ContasPagarPage />
        </AuthGuard>
      </Route>
      <Route path="/cadastros/clientes">
        <AuthGuard>
          <ClientesPage />
        </AuthGuard>
      </Route>
      <Route path="/cadastros/produtos">
        <AuthGuard>
          <ProdutosPage />
        </AuthGuard>
      </Route>
      <Route path="/cadastros/usuarios">
        <AuthGuard>
          <UsuariosPage />
        </AuthGuard>
      </Route>
      <Route path="/os/:id/print" component={OSPrintPage} />
      <Route path="/kanban-producao">
        <AuthGuard>
          <KanbanProducaoPage />
        </AuthGuard>
      </Route>
      <Route path="/kanban-comercial">
        <AuthGuard>
          <KanbanComercialPage />
        </AuthGuard>
      </Route>
      <Route path="/engenharia">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="engenharia" />
        </AuthGuard>
      </Route>
      <Route path="/comercial">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="comercial" />
        </AuthGuard>
      </Route>
      <Route path="/estrutura-produto">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="estrutura-produto" />
        </AuthGuard>
      </Route>
      <Route path="/producao">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="producao" />
        </AuthGuard>
      </Route>
      <Route path="/pcp">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="pcp" />
        </AuthGuard>
      </Route>
      <Route path="/fluxo-producao">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="fluxo-producao" />
        </AuthGuard>
      </Route>
      <Route path="/estoque">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="estoque" />
        </AuthGuard>
      </Route>
      <Route path="/compras">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="compras" />
        </AuthGuard>
      </Route>
      <Route path="/rh">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="rh" />
        </AuthGuard>
      </Route>
      <Route path="/qualidade">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="qualidade" />
        </AuthGuard>
      </Route>
      <Route path="/assistencia-tecnica">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="assistencia-tecnica" />
        </AuthGuard>
      </Route>
      <Route path="/etiquetas">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="etiquetas" />
        </AuthGuard>
      </Route>
      <Route path="/configuracoes">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="configuracoes" />
        </AuthGuard>
      </Route>
      <Route path="/usuarios-permissoes">
        <AuthGuard>
          <EnterpriseModulePage moduleKey="usuarios-permissoes" />
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
