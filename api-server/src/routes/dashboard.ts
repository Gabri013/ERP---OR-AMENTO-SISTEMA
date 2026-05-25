import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import { requireAuth, FINANCEIRO_ROLES, PRODUCTION_ROLES, SALES_ROLES } from "../middleware/auth";
import { auditLog } from "../middleware/audit";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, auditLog({
  action: "view",
  module: "dashboard",
  table: "Dashboard"
}), async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser;
  const isVendedor = currentUser.tipo === "vendedor";

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const startOfLastMonth = new Date(startOfMonth);
  startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

  // Vendas + receita
  const allVendas = await db.venda.findMany();
  let ownVendas = allVendas;
  if (isVendedor) {
    ownVendas = allVendas.filter(v => v.usuarioId === currentUser.id);
  }
  const totalVendas = ownVendas.length;
  const ownThisMonth = ownVendas.filter(v => v.createdAt >= startOfMonth);
  const receitaMes = ownThisMonth.reduce((acc, v) => acc + Number(v.valorTotal), 0);
  
  // Receita do mês anterior para comparação
  const ownLastMonth = ownVendas.filter(v => v.createdAt >= startOfLastMonth && v.createdAt < startOfMonth);
  const receitaMesAnterior = ownLastMonth.reduce((acc, v) => acc + Number(v.valorTotal), 0);
  const crescimentoReceita = receitaMesAnterior > 0 
    ? ((receitaMes - receitaMesAnterior) / receitaMesAnterior) * 100 
    : 0;

  const totalOrcamentos = await db.orcamento.count();
  const totalOs = await db.ordemServico.count();
  const totalClientes = await db.cliente.count();

  // Métricas de OS
  const osPendentes = await db.ordemServico.count({ where: { status: "pendente" } });
  const osEmProducao = await db.ordemServico.count({ where: { status: "em_producao" } });
  const osConcluidas = await db.ordemServico.count({ where: { status: "concluida" } });
  
  // OS atrasadas (dataTermino < hoje e status não concluida/cancelada)
  const hoje = new Date();
  const osAtrasadas = await db.ordemServico.count({
    where: {
      status: { in: ["pendente", "em_projeto", "em_revisao", "em_producao"] },
      dataTermino: { lt: hoje }
    }
  });

  // Conversão de orçamentos
  const orcamentosConvertidos = await db.orcamento.count({ where: { status: "convertido" } });
  const taxaConversao = totalOrcamentos > 0 ? (orcamentosConvertidos / totalOrcamentos) * 100 : 0;

  // Financeiro (apenas para roles financeiro)
  const canSeeFinanceiro = FINANCEIRO_ROLES.includes(currentUser.tipo);
  let contasReceberPendentes = 0;
  let contasReceberValor = 0;
  let contasReceberAtrasadas = 0;
  let valorRecebidoMes = 0;
  
  if (canSeeFinanceiro) {
    const cr = await db.contaReceber.aggregate({
      _count: { id: true },
      _sum: { valorLiquido: true },
      where: { status: "PENDENTE" },
    });
    contasReceberPendentes = cr._count.id || 0;
    contasReceberValor = Number(cr._sum.valorLiquido || 0);

    // Contas a receber atrasadas
    const crAtrasadas = await db.contaReceber.aggregate({
      _count: { id: true },
      where: {
        status: "PENDENTE",
        dataVencimento: { lt: hoje }
      }
    });
    contasReceberAtrasadas = crAtrasadas._count.id || 0;

    // Valor recebido no mês
    const pagamentosMes = await db.pagamento.findMany({
      where: {
        createdAt: { gte: startOfMonth }
      }
    });
    valorRecebidoMes = pagamentosMes.reduce((acc, p) => acc + Number(p.valorPago), 0);
  }

  // Ranking de vendedores (apenas para gerentes/master)
  const canSeeRanking = ["master", "gerente"].includes(currentUser.tipo);
  let rankingVendedores = [];
  if (canSeeRanking) {
    const vendasPorUsuario = await db.venda.groupBy({
      by: ['usuarioId'],
      _count: { id: true },
      _sum: { valorTotal: true },
      orderBy: { _sum: { valorTotal: 'desc' } },
      take: 5
    });
    
    for (const venda of vendasPorUsuario) {
      const usuario = await db.usuario.findUnique({ where: { id: venda.usuarioId } });
      if (usuario) {
        rankingVendedores.push({
          nome: usuario.nome,
          totalVendas: venda._count.id,
          valorTotal: Number(venda._sum.valorTotal || 0)
        });
      }
    }
  }

  res.json({
    totalVendas,
    totalOrcamentos,
    totalOs,
    totalClientes,
    receitaMes,
    crescimentoReceita: Math.round(crescimentoReceita * 10) / 10,
    osPendentes,
    osEmProducao,
    osConcluidas,
    osAtrasadas,
    taxaConversao: Math.round(taxaConversao * 10) / 10,
    contasReceberPendentes: canSeeFinanceiro ? contasReceberPendentes : null,
    contasReceberValor: canSeeFinanceiro ? contasReceberValor : null,
    contasReceberAtrasadas: canSeeFinanceiro ? contasReceberAtrasadas : null,
    valorRecebidoMes: canSeeFinanceiro ? valorRecebidoMes : null,
    rankingVendedores: canSeeRanking ? rankingVendedores : null,
  });
});

router.get("/dashboard/os-por-status", requireAuth, auditLog({
  action: "view",
  module: "dashboard",
  table: "OS"
}), async (_req, res): Promise<void> => {
  const statuses = ["pendente", "em_projeto", "em_revisao", "em_producao", "concluida", "cancelada"] as const;
  const result = await Promise.all(
    statuses.map(async (status) => {
      const count = await db.ordemServico.count({ where: { status: status as any } });
      return { status, count };
    })
  );
  res.json(result);
});

router.get("/dashboard/vendas-recentes", requireAuth, auditLog({
  action: "view",
  module: "dashboard",
  table: "Venda"
}), async (req, res): Promise<void> => {
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

router.get("/dashboard/os-atrasadas", requireAuth, auditLog({
  action: "view",
  module: "dashboard",
  table: "OS"
}), async (req, res): Promise<void> => {
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

