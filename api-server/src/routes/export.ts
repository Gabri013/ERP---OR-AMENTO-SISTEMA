import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import { requireAuth, requireRoles, ALL_ROLES, FINANCEIRO_ROLES } from "../middleware/auth";
import { response } from "../utils/response";

const router: IRouter = Router();

function toCSV(headers: string[], rows: any[][]): string {
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n"))
      return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((row) => row.map(escape).join(",")),
  ];
  return lines.join("\n");
}

// GET /export/os - export OS list as CSV
router.get("/export/os", requireAuth, requireRoles(ALL_ROLES), async (req, res): Promise<void> => {
  const rows = await db.ordemServico.findMany({
    include: { cliente: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["Número", "Cliente", "Status", "Etapa Atual", "Prioridade", "Data Início", "Prazo", "Criado em"];
  const data = rows.map((r) => [
    r.numero,
    r.cliente?.razaoSocial ?? "",
    r.status,
    r.etapaAtual,
    r.prioridade,
    r.dataInicio ? new Date(r.dataInicio).toLocaleDateString("pt-BR") : "",
    r.dataTermino ? new Date(r.dataTermino).toLocaleDateString("pt-BR") : "",
    new Date(r.createdAt).toLocaleDateString("pt-BR"),
  ]);

  const csv = toCSV(headers, data);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="ordens-servico-${Date.now()}.csv"`);
  res.send("\uFEFF" + csv); // BOM for Excel
});

// GET /export/orcamentos - export orcamentos as CSV
router.get("/export/orcamentos", requireAuth, requireRoles(ALL_ROLES), async (req, res): Promise<void> => {
  const rows = await db.orcamento.findMany({
    include: { cliente: true, usuario: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["Número", "Cliente", "Vendedor", "Status", "Valor Total", "Desconto", "Validade", "Emissão"];
  const data = rows.map((r) => [
    r.numero,
    r.cliente?.razaoSocial ?? "",
    r.usuario?.nome ?? "",
    r.status,
    Number(r.valorTotal).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    Number(r.desconto).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    r.validade ? new Date(r.validade).toLocaleDateString("pt-BR") : "",
    new Date(r.createdAt).toLocaleDateString("pt-BR"),
  ]);

  const csv = toCSV(headers, data);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="orcamentos-${Date.now()}.csv"`);
  res.send("\uFEFF" + csv);
});

// GET /export/financeiro - export contas-receber as CSV
router.get("/export/financeiro", requireAuth, requireRoles(FINANCEIRO_ROLES), async (req, res): Promise<void> => {
  const rows = await db.contaReceber.findMany({
    include: { cliente: true },
    orderBy: { dataVencimento: "asc" },
  });

  const headers = ["ID", "Cliente", "Parcela", "Total Parcelas", "Valor Bruto", "Valor Recebido", "Vencimento", "Pagamento", "Status"];
  const data = rows.map((r) => [
    r.id,
    r.cliente?.razaoSocial ?? "",
    r.parcelaNumero,
    r.totalParcelas,
    Number(r.valorBruto).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    Number(r.valorRecebido).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    new Date(r.dataVencimento).toLocaleDateString("pt-BR"),
    r.dataPagamento ? new Date(r.dataPagamento).toLocaleDateString("pt-BR") : "",
    r.status,
  ]);

  const csv = toCSV(headers, data);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="financeiro-${Date.now()}.csv"`);
  res.send("\uFEFF" + csv);
});

export default router;
