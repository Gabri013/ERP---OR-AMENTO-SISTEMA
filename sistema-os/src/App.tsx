import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
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
      <Route path="/" component={DashboardPage} />
      <Route path="/orcamentos" component={OrcamentosPage} />
      <Route path="/orcamentos/novo" component={OrcamentoNovoPage} />
      <Route path="/orcamentos/:id" component={OrcamentoDetailPage} />
      <Route path="/vendas" component={VendasPage} />
      <Route path="/vendas/nova" component={VendaNovaPage} />
      <Route path="/vendas/:id" component={VendaDetailPage} />
      <Route path="/os" component={OSPage} />
      <Route path="/os/:id" component={OSDetailPage} />
      <Route path="/financeiro" component={FinanceiroPage} />
      <Route path="/financeiro/contas-receber" component={ContasReceberPage} />
      <Route path="/financeiro/contas-pagar" component={ContasPagarPage} />
      <Route path="/cadastros/clientes" component={ClientesPage} />
      <Route path="/cadastros/produtos" component={ProdutosPage} />
      <Route path="/cadastros/usuarios" component={UsuariosPage} />
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
