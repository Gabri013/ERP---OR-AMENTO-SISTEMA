import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  ListContasReceberQueryParams,
  ListContasPagarQueryParams,
  PagarContaReceberParams,
  PagarContaReceberBody,
  PagarContaPagarParams,
  CreateContaPagarBody,
} from "@workspace/api-zod";
import { requireAuth, requireRoles } from "../middleware/auth";

const router: IRouter = Router();
const MASTER_ONLY = ["master"];

function serializeCR(r: any, cliente?: any) {
  return {
    id: r.id, vendaId: r.vendaId, clienteId: r.clienteId,
    parcelaNumero: r.parcelaNumero, totalParcelas: r.totalParcelas,
    valorBruto: Number(r.valorBruto), valorLiquido: Number(r.valorLiquido),
    valorRecebido: Number(r.valorRecebido), dataVencimento: r.dataVencimento,
    dataPagamento: r.dataPagamento instanceof Date ? r.dataPagamento.toISOString() : r.dataPagamento,
    formaPagamento: r.formaPagamento, status: r.status,
    cliente: cliente ? {
      id: cliente.id, razaoSocial: cliente.razaoSocial, nomeFantasia: cliente.nomeFantasia,
      cnpjCpf: cliente.cnpjCpf, cidade: cliente.cidade, estado: cliente.estado,
      telefone: cliente.telefone, email: cliente.email, observacoes: cliente.observacoes,
      createdAt: cliente.createdAt instanceof Date ? cliente.createdAt.toISOString() : cliente.createdAt,
    } : undefined,
  };
}

router.get("/financeiro/contas-receber", requireAuth, requireRoles(MASTER_ONLY), async (req, res): Promise<void> => {
  const params = ListContasReceberQueryParams.safeParse(req.query);
  const status = params.success ? params.data.status : undefined;

  const rows = await db.contaReceber.findMany({
    include: { cliente: true },
    orderBy: { dataVencimento: "desc" },
  });

  let result = rows.map(r => serializeCR(r, r.cliente));

  if (status) result = result.filter(r => r.status === status);
  res.json(result);
});

router.post("/financeiro/contas-receber/:id/pagar", requireAuth, requireRoles(MASTER_ONLY), async (req, res): Promise<void> => {
  const p = PagarContaReceberParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const body = PagarContaReceberBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const userId = (req as any).currentUser?.id;

  const updated = await db.contaReceber.update({
    where: { id: p.data.id },
    data: {
      valorRecebido: Number(body.data.valorPago),
      dataPagamento: new Date(),
      formaPagamento: body.data.formaPagamento,
      status: "PAGO",
    },
  });

  await db.pagamento.create({
    data: {
      contaReceberId: p.data.id,
      usuarioId: userId,
      valorPago: Number(body.data.valorPago),
      formaPagamento: body.data.formaPagamento,
      observacao: body.data.observacao,
    },
  });

  const cliente = await db.cliente.findUnique({ where: { id: updated.clienteId } });
  res.json(serializeCR(updated, cliente));
});

router.get("/financeiro/contas-pagar", requireAuth, requireRoles(MASTER_ONLY), async (req, res): Promise<void> => {
  const params = ListContasPagarQueryParams.safeParse(req.query);

  const rows = await db.contaPagar.findMany({ orderBy: { dataVencimento: "desc" } });

  let result = rows.map(r => ({
    id: r.id, descricao: r.descricao, fornecedor: r.fornecedor,
    valor: Number(r.valor), dataVencimento: r.dataVencimento,
    dataPagamento: r.dataPagamento instanceof Date ? r.dataPagamento.toISOString() : r.dataPagamento,
    status: r.status,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  }));

  if (params.success && params.data.status) {
    result = result.filter(r => r.status === params.data.status);
  }

  res.json(result);
});

router.post("/financeiro/contas-pagar", requireAuth, requireRoles(MASTER_ONLY), async (req, res): Promise<void> => {
  const parsed = CreateContaPagarBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const row = await db.contaPagar.create({
    data: {
      ...parsed.data,
      valor: Number(parsed.data.valor),
    },
  });

  res.status(201).json({
    id: row.id, descricao: row.descricao, fornecedor: row.fornecedor,
    valor: Number(row.valor), dataVencimento: row.dataVencimento,
    dataPagamento: row.dataPagamento instanceof Date ? row.dataPagamento.toISOString() : row.dataPagamento,
    status: row.status,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  });
});

router.post("/financeiro/contas-pagar/:id/pagar", requireAuth, requireRoles(MASTER_ONLY), async (req, res): Promise<void> => {
  const p = PagarContaPagarParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const updated = await db.contaPagar.update({
    where: { id: p.data.id },
    data: { status: "PAGO", dataPagamento: new Date() },
  });

  res.json({
    id: updated.id, descricao: updated.descricao, fornecedor: updated.fornecedor,
    valor: Number(updated.valor), dataVencimento: updated.dataVencimento,
    dataPagamento: updated.dataPagamento instanceof Date ? updated.dataPagamento.toISOString() : updated.dataPagamento,
    status: updated.status,
    createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : updated.createdAt,
  });
});

export default router;
