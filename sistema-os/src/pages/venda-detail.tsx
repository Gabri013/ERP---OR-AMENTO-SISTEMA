import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useGetVenda, useGerarOsParaVenda } from "@workspace/api-client-react";
import { getListVendasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ClipboardPlus } from "lucide-react";
import { Link } from "wouter";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

const statusColors: Record<string, string> = {
  em_andamento: "bg-blue-100 text-blue-800",
  concluida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
};
const statusLabels: Record<string, string> = {
  em_andamento: "Em Andamento", concluida: "Concluída", cancelada: "Cancelada",
};

export default function VendaDetailPage() {
  const [, params] = useRoute("/vendas/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const id = parseInt(params?.id ?? "0");

  const { data: venda, isLoading } = useGetVenda(id);

  const gerarOsMut = useGerarOsParaVenda({
    mutation: {
      onSuccess: (os) => {
        toast({ title: `OS ${os.numero} criada!` });
        qc.invalidateQueries();
        setLocation(`/os/${os.id}`);
      },
      onError: () => toast({ title: "Erro ao gerar OS", variant: "destructive" }),
    },
  });

  if (isLoading) return <Layout><div className="p-6 text-muted-foreground">Carregando...</div></Layout>;
  if (!venda) return <Layout><div className="p-6 text-muted-foreground">Venda não encontrada.</div></Layout>;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link href="/vendas"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <div>
              <h1 className="text-xl font-bold font-mono">{venda.numero}</h1>
              <p className="text-sm text-muted-foreground">Venda</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[venda.status] ?? "bg-muted"}`}>
              {statusLabels[venda.status] ?? venda.status}
            </span>
          </div>
          <Button size="sm" onClick={() => gerarOsMut.mutate({ id: venda.id })}>
            <ClipboardPlus className="h-4 w-4 mr-1" /> Gerar OS
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{venda.cliente?.razaoSocial}</p>
              {venda.cliente?.cnpjCpf && <p className="text-sm text-muted-foreground">CNPJ/CPF: {venda.cliente.cnpjCpf}</p>}
              {venda.cliente?.telefone && <p className="text-sm text-muted-foreground">Tel: {venda.cliente.telefone}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Financeiro</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Data</span><span>{formatDate(venda.dataVenda)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Pagamento</span><span>{venda.formaPagamento ?? "—"} {(venda.numParcelas ?? 1) > 1 ? `(${venda.numParcelas}x)` : ""}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Desconto</span><span>−{formatCurrency(venda.desconto ?? 0)}</span></div>
              <div className="flex justify-between text-base font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(venda.valorTotal)}</span></div>
            </CardContent>
          </Card>
        </div>

        {(venda as any).ordensServico?.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Ordens de Serviço</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(venda as any).ordensServico.map((os: any) => (
                  <Link key={os.id} href={`/os/${os.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <p className="font-medium font-mono">{os.numero}</p>
                    <Badge variant="outline">{os.etapaAtual}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-sm">Itens</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide pb-2 border-b">
                <div className="col-span-6">Descrição</div>
                <div className="col-span-2 text-right">Qtd</div>
                <div className="col-span-2 text-right">Unit.</div>
                <div className="col-span-2 text-right">Total</div>
              </div>
              {(venda as any).itens?.map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-2 text-sm py-2 border-b last:border-0">
                  <div className="col-span-6 font-medium">{item.descricaoManual ?? `Item ${i + 1}`}</div>
                  <div className="col-span-2 text-right text-muted-foreground">{item.quantidade}</div>
                  <div className="col-span-2 text-right text-muted-foreground">{formatCurrency(item.valorUnitario)}</div>
                  <div className="col-span-2 text-right font-medium">{formatCurrency(item.valorTotal)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
