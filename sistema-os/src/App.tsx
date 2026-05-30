import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { lazy, Suspense } from "react";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";

// Lazy loading das páginas principais
const DashboardPage = lazy(() => import("@/pages/dashboard").then(m => ({ default: m.default })));
const OrcamentosPage = lazy(() => import("@/pages/orcamentos").then(m => ({ default: m.default })));
const OrcamentoNovoPage = lazy(() => import("@/pages/orcamento-novo").then(m => ({ default: m.default })));
const OrcamentoDetailPage = lazy(() => import("@/pages/orcamento-detail").then(m => ({ default: m.default })));
const VendasPage = lazy(() => import("@/pages/vendas").then(m => ({ default: m.default })));
const VendaNovaPage = lazy(() => import("@/pages/venda-nova").then(m => ({ default: m.default })));
const VendaDetailPage = lazy(() => import("@/pages/venda-detail").then(m => ({ default: m.default })));
const OSPage = lazy(() => import("@/pages/os").then(m => ({ default: m.default })));
const OSDetailPage = lazy(() => import("@/pages/os-detail").then(m => ({ default: m.default })));
const FinanceiroPage = lazy(() => import("@/pages/financeiro").then(m => ({ default: m.default })));
const ContasReceberPage = lazy(() => import("@/pages/contas-receber").then(m => ({ default: m.default })));
const ContasPagarPage = lazy(() => import("@/pages/contas-pagar").then(m => ({ default: m.default })));
const ClientesPage = lazy(() => import("@/pages/clientes").then(m => ({ default: m.default })));
const ProdutosPage = lazy(() => import("@/pages/produtos").then(m => ({ default: m.default })));
const UsuariosPage = lazy(() => import("@/pages/usuarios").then(m => ({ default: m.default })));
const OSPrintPage = lazy(() => import("@/pages/os-print").then(m => ({ default: m.default })));
const KanbanProducaoPage = lazy(() => import("@/pages/kanban-producao").then(m => ({ default: m.default })));
const KanbanComercialPage = lazy(() => import("@/pages/kanban-comercial").then(m => ({ default: m.default })));
const EngenhariaPage = lazy(() => import("@/pages/engenharia").then(m => ({ default: m.default })));
const EnterpriseModulePage = lazy(() => import("@/pages/enterprise-module").then(m => ({ default: m.default })));
const SetoresPage = lazy(() => import("@/pages/setores").then(m => ({ default: m.default })));
const PermissoesUsuarioPage = lazy(() => import("@/pages/permissoes-usuario").then(m => ({ default: m.default })));
const PermissoesSetorPage = lazy(() => import("@/pages/permissoes-setor").then(m => ({ default: m.default })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Componente de loading para Suspense
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030304] text-white">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#F7931A] border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="mt-4 text-sm text-white/70">Carregando...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/orcamentos">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="orcamentos" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/orcamentos/novo">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <OrcamentoNovoPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/orcamentos/:id">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <OrcamentoDetailPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/vendas">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="vendas" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/vendas/nova">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <VendaNovaPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/vendas/:id">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <VendaDetailPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/os">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <OSPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/os/:id">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <OSDetailPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/financeiro">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="financeiro" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/financeiro/contas-receber">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <ContasReceberPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/financeiro/contas-pagar">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <ContasPagarPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/cadastros/clientes">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <ClientesPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/cadastros/produtos">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <ProdutosPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/cadastros/usuarios">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <UsuariosPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/sistema/setores">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <SetoresPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/sistema/permissoes-usuario">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <PermissoesUsuarioPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/sistema/permissoes-setor">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <PermissoesSetorPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/os/:id/print">
        <Suspense fallback={<PageLoader />}>
          <OSPrintPage />
        </Suspense>
      </Route>
      <Route path="/kanban-producao">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <KanbanProducaoPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/kanban-comercial">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <KanbanComercialPage />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/engenharia">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="engenharia" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/comercial">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="comercial" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/estrutura-produto">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="estrutura-produto" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/producao">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="producao" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/pcp">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="pcp" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/fluxo-producao">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="fluxo-producao" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/estoque">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="estoque" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/compras">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="compras" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/rh">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="rh" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/qualidade">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="qualidade" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/assistencia-tecnica">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="assistencia-tecnica" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/etiquetas">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="etiquetas" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/configuracoes">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="configuracoes" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route path="/usuarios-permissoes">
        <AuthGuard>
          <Suspense fallback={<PageLoader />}>
            <EnterpriseModulePage moduleKey="usuarios-permissoes" />
          </Suspense>
        </AuthGuard>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
