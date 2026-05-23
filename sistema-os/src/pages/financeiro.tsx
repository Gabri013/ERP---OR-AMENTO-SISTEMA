import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListContasReceber, useListContasPagar } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function FinanceiroPage() {
  const { data: cr = [] } = useListContasReceber({ status: "PENDENTE" });
  const { data: cp = [] } = useListContasPagar({ status: "PENDENTE" });

  const totalReceber = cr.reduce((s, c) => s + c.valorLiquido, 0);
  const totalPagar = cp.reduce((s, c) => s + c.valor, 0);
  const saldo = totalReceber - totalPagar;

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold">Financeiro</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                <p className="text-sm text-muted-foreground font-medium">A Receber (pendentes)</p>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceber)}</p>
              <p className="text-xs text-muted-foreground mt-1">{cr.length} parcela(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-muted-foreground font-medium">A Pagar (pendentes)</p>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPagar)}</p>
              <p className="text-xs text-muted-foreground mt-1">{cp.length} conta(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`h-4 w-4 ${saldo >= 0 ? "text-green-600" : "text-red-600"}`} />
                <p className="text-sm text-muted-foreground font-medium">Saldo Projetado</p>
              </div>
              <p className={`text-2xl font-bold ${saldo >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(saldo)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Contas a Receber</CardTitle>
                <Link href="/financeiro/contas-receber">
                  <a><Button variant="outline" size="sm">Ver todas</Button></a>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cr.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted">
                    <div>
                      <p className="font-medium">{c.cliente?.razaoSocial ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">Venc: {new Date(c.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                    </div>
                    <p className="font-semibold text-green-700">{formatCurrency(c.valorLiquido)}</p>
                  </div>
                ))}
                {cr.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Nenhuma pendência</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Contas a Pagar</CardTitle>
                <Link href="/financeiro/contas-pagar">
                  <a><Button variant="outline" size="sm">Ver todas</Button></a>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cp.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center justify-between text-sm p-2 rounded hover:bg-muted">
                    <div>
                      <p className="font-medium">{c.descricao}</p>
                      <p className="text-xs text-muted-foreground">Venc: {new Date(c.dataVencimento + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                    </div>
                    <p className="font-semibold text-red-700">{formatCurrency(c.valor)}</p>
                  </div>
                ))}
                {cp.length === 0 && <p className="text-center text-muted-foreground text-sm py-4">Nenhuma pendência</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
