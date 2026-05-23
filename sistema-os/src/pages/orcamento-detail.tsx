import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useGetOrcamento, useConverterOrcamento, updateOrcamento, getListOrcamentosQueryKey } from "@workspace/api-client-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRightCircle, Check, X } from "lucide-react";
import { Link } from "wouter";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  aprovado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  convertido: "bg-blue-100 text-blue-800",
};
const statusLabels: Record<string, string> = {
  pendente: "Pendente", aprovado: "Aprovado", rejeitado: "Rejeitado", convertido: "Convertido",
};

export default function OrcamentoDetailPage() {
  const [, params] = useRoute("/orcamentos/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const id = parseInt(params?.id ?? "0");

  const { data: orc, isLoading } = useGetOrcamento(id);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListOrcamentosQueryKey() });

  const converterMut = useConverterOrcamento({
    mutation: {
      onSuccess: (venda) => {
        toast({ title: "Convertido em venda!" });
        invalidate();
        setLocation(`/vendas/${venda.id}`);
      },
      onError: () => toast({ title: "Erro ao converter", variant: "destructive" }),
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: (status: string) => updateOrcamento(id, { status }),
    onSuccess: () => { toast({ title: "Status atualizado!" }); qc.invalidateQueries(); },
    onError: () => toast({ title: "Erro", variant: "destructive" }),
  });

  if (isLoading) {
    return <Layout><div className="p-6 text-muted-foreground">Carregando...</div></Layout>;
  }

  if (!orc) {
    return <Layout><div className="p-6 text-muted-foreground">Orçamento não encontrado.</div></Layout>;
  }

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link href="/orcamentos"><ArrowLeft className="h-4 w-4" /></Link></Button>
            <div>
              <h1 className="text-xl font-bold font-mono">{orc.numero}</h1>
              <p className="text-sm text-muted-foreground">Orçamento</p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[orc.status] ?? "bg-muted"}`}>
              {statusLabels[orc.status] ?? orc.status}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {orc.status === "pendente" && (
              <>
                <Button variant="outline" size="sm" className="text-green-700 border-green-300 hover:bg-green-50"
                  onClick={() => updateStatusMut.mutate("aprovado")}>
                  <Check className="h-4 w-4 mr-1" /> Aprovar
                </Button>
                <Button variant="outline" size="sm" className="text-red-700 border-red-300 hover:bg-red-50"
                  onClick={() => updateStatusMut.mutate("rejeitado")}>
                  <X className="h-4 w-4 mr-1" /> Rejeitar
                </Button>
              </>
            )}
            {orc.status !== "convertido" && (
              <Button size="sm" onClick={() => converterMut.mutate({ id: orc.id })}>
                <ArrowRightCircle className="h-4 w-4 mr-1" /> Converter em Venda
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{orc.cliente?.razaoSocial}</p>
              {orc.cliente?.nomeFantasia && <p className="text-sm text-muted-foreground">{orc.cliente.nomeFantasia}</p>}
              {orc.cliente?.cnpjCpf && <p className="text-sm text-muted-foreground">CNPJ/CPF: {orc.cliente.cnpjCpf}</p>}
              {orc.cliente?.telefone && <p className="text-sm text-muted-foreground">Tel: {orc.cliente.telefone}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Datas e Valores</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Data</span><span>{formatDate(orc.dataOrcamento)}</span></div>
              {orc.validade && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Validade</span><span>{formatDate(orc.validade)}</span></div>}
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Desconto</span><span>−{formatCurrency(orc.desconto ?? 0)}</span></div>
              <div className="flex justify-between text-base font-bold border-t pt-2"><span>Total</span><span>{formatCurrency(orc.valorTotal)}</span></div>
            </CardContent>
          </Card>
        </div>

        {orc.observacoes && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Observações</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{orc.observacoes}</p></CardContent>
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
              {(orc as any).itens?.map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-2 text-sm py-2 border-b last:border-0">
                  <div className="col-span-6">
                    <p className="font-medium">{item.produto?.nome ?? item.descricaoManual ?? "Item " + (i + 1)}</p>
                    {item.produto && item.descricaoManual && <p className="text-xs text-muted-foreground">{item.descricaoManual}</p>}
                  </div>
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
