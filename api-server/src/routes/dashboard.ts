import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser;
  const isVendedor = currentUser.tipo === "vendedor";

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Vendas + receita (with vendedor filter done in JS like the original)
  const allVendas = await db.venda.findMany();
  let ownVendas = allVendas;
  if (isVendedor) {
    ownVendas = allVendas.filter(v => v.usuarioId === currentUser.id);
  }
  const totalVendas = ownVendas.length;
  const ownThisMonth = ownVendas.filter(v => v.createdAt >= startOfMonth);
  const receitaMes = ownThisMonth.reduce((acc, v) => acc + Number(v.valorTotal), 0);

  const totalOrcamentos = await db.orcamento.count();
  const totalOs = await db.ordemServico.count();
  const totalClientes = await db.cliente.count();

  const osPendentes = await db.ordemServico.count({ where: { status: "pendente" } });
  const osEmProducao = await db.ordemServico.count({ where: { status: "em_producao" } });

  const isMaster = currentUser.tipo === "master";
  let contasReceberPendentes = 0;
  let contasReceberValor = 0;
  if (isMaster) {
    const cr = await db.contaReceber.aggregate({
      _count: { id: true },
      _sum: { valorLiquido: true },
      where: { status: "PENDENTE" },
    });
    contasReceberPendentes = cr._count.id || 0;
    contasReceberValor = Number(cr._sum.valorLiquido || 0);
  }

  res.json({
    totalVendas,
    totalOrcamentos,
    totalOs,
    totalClientes,
    receitaMes,
    osPendentes,
    osEmProducao,
    contasReceberPendentes: isMaster ? contasReceberPendentes : null,
    contasReceberValor: isMaster ? contasReceberValor : null,
  });
});

router.get("/dashboard/os-por-status", requireAuth, async (_req, res): Promise<void> => {
  const statuses = ["pendente", "em_projeto", "em_revisao", "em_producao", "concluida", "cancelada"];
  const result = await Promise.all(
    statuses.map(async (status) => {
      const count = await db.ordemServico.count({ where: { status: status as any } });
      return { status, count };
    })
  );
  res.json(result);
});

router.get("/dashboard/vendas-recentes", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser;

  const rows = await db.venda.findMany({
    include: { cliente: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  let result = rows.map(r => ({
    id: r.id,
    numero: r.numero,
    orcamentoId: r.orcamentoId,
    clienteId: r.clienteId,
    usuarioId: r.usuarioId,
    dataVenda: r.dataVenda,
    valorTotal: Number(r.valorTotal),
    desconto: Number(r.desconto),
    formaPagamento: r.formaPagamento,
    numParcelas: r.numParcelas,
    status: r.status,
    observacoes: r.observacoes,
    createdAt: r.createdAt.toISOString(),
    cliente: r.cliente ? {
      id: r.cliente.id,
      razaoSocial: r.cliente.razaoSocial,
      nomeFantasia: r.cliente.nomeFantasia,
      cnpjCpf: r.cliente.cnpjCpf,
      cidade: r.cliente.cidade,
      estado: r.cliente.estado,
      telefone: r.cliente.telefone,
      email: r.cliente.email,
      observacoes: r.cliente.observacoes,
      createdAt: r.cliente.createdAt.toISOString(),
    } : undefined,
  }));

  if (currentUser.tipo === "vendedor") {
    result = result.filter(r => r.usuarioId === currentUser.id);
  }

  res.json(result.slice(0, 5));
});

router.get("/dashboard/os-atrasadas", requireAuth, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser;
  const allowedRoles = ["master", "gerente", "producao", "dashboard_producao"];

  if (!allowedRoles.includes(currentUser.tipo)) {
    res.json([]);
    return;
  }

  const rows = await db.ordemServico.findMany({
    include: { cliente: true },
    where: { status: "em_producao" },
    orderBy: { dataTermino: "asc" },
    take: 10,
  });

  res.json(rows.map(r => ({
    id: r.id,
    numero: r.numero,
    vendaId: r.vendaId,
    clienteId: r.clienteId,
    dataInicio: r.dataInicio,
    dataTermino: r.dataTermino,
    prioridade: r.prioridade,
    status: r.status,
    etapaAtual: r.etapaAtual,
    observacoesGerais: r.observacoesGerais,
    observacoesCortedobra: r.observacoesCortedobra,
    observacoesSolda: r.observacoesSolda,
    arquivoProjeto: r.arquivoProjeto,
    createdAt: r.createdAt.toISOString(),
    cliente: r.cliente ? {
      id: r.cliente.id, razaoSocial: r.cliente.razaoSocial, nomeFantasia: r.cliente.nomeFantasia,
      cnpjCpf: r.cliente.cnpjCpf, cidade: r.cliente.cidade, estado: r.cliente.estado,
      telefone: r.cliente.telefone, email: r.cliente.email, observacoes: r.cliente.observacoes,
      createdAt: r.cliente.createdAt.toISOString(),
    } : undefined,
  })));
});

export default router;

