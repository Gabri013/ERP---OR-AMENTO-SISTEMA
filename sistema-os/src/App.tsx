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
          <FinanceiroPage />
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
