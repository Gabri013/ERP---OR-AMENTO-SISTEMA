import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import {
  GetOSParams,
  UpdateOSBody,
  UpdateOSParams,
  ListOSQueryParams,
  AvancarEtapaOSBody,
  AvancarEtapaOSParams,
  AddObservacaoOSParams,
  AddObservacaoOSBody,
} from "../schemas";
import { requireAuth, requireRoles, SECTOR_ROLES, PRODUCTION_ROLES, SALES_ROLES } from "../middleware/auth";

const router: IRouter = Router();
const ALL_ROLES = [...new Set([...SALES_ROLES, ...PRODUCTION_ROLES])];

const SECTOR_STAGE_MAP: Record<string, string> = {
  corte: "corte",
  dobra: "dobra",
  solda: "solda",
  refrigeracao: "refrigeracao",
  acabamento: "acabamento",
  finalizacao: "finalizacao",
  montagem: "montagem",
};

const ETAPA_ORDER = ["autorizacao","corte","dobra","solda","refrigeracao","acabamento","finalizacao","montagem","concluida"];

function serializeOS(r: any, cliente?: any) {
  return {
    id: r.id, numero: r.numero, vendaId: r.vendaId, clienteId: r.clienteId,
    dataInicio: r.dataInicio, dataTermino: r.dataTermino, prioridade: r.prioridade,
    status: r.status, etapaAtual: r.etapaAtual,
    observacoesGerais: r.observacoesGerais, observacoesCortedobra: r.observacoesCortedobra,
    observacoesSolda: r.observacoesSolda, arquivoProjeto: r.arquivoProjeto,
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    cliente: cliente ? {
      id: cliente.id, razaoSocial: cliente.razaoSocial, nomeFantasia: cliente.nomeFantasia,
      cnpjCpf: cliente.cnpjCpf, cidade: cliente.cidade, estado: cliente.estado,
      telefone: cliente.telefone, email: cliente.email, observacoes: cliente.observacoes,
      createdAt: cliente.createdAt?.toISOString?.() ?? cliente.createdAt,
    } : undefined,
  };
}

router.get("/os", requireAuth, requireRoles(ALL_ROLES), async (req, res): Promise<void> => {
  const params = ListOSQueryParams.safeParse(req.query);
  const status = params.success ? params.data.status : undefined;
  const etapa = params.success ? params.data.etapa : undefined;
  const currentUser = (req as any).currentUser;

  // Sector users only see OS in their etapa
  const sectorStage = SECTOR_STAGE_MAP[currentUser.tipo];

  const where: any = {};
  if (sectorStage) {
    where.etapaAtual = sectorStage;
    where.status = { notIn: ["concluida", "cancelada"] };
  }
  if (status) where.status = status;
  if (etapa) where.etapaAtual = etapa;

  const rows = await db.ordemServico.findMany({
    where,
    include: { cliente: true },
    orderBy: { createdAt: "desc" },
  });

  const result = rows.map(r => ({
    id: r.id, numero: r.numero, vendaId: r.vendaId, clienteId: r.clienteId,
    dataInicio: r.dataInicio, dataTermino: r.dataTermino, prioridade: r.prioridade,
    status: r.status, etapaAtual: r.etapaAtual,
    observacoesGerais: r.observacoesGerais, observacoesCortedobra: r.observacoesCortedobra,
    observacoesSolda: r.observacoesSolda, arquivoProjeto: r.arquivoProjeto,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    cliente: r.cliente ? {
      id: r.cliente.id, razaoSocial: r.cliente.razaoSocial, nomeFantasia: r.cliente.nomeFantasia,
      cnpjCpf: r.cliente.cnpjCpf, cidade: r.cliente.cidade, estado: r.cliente.estado,
      telefone: r.cliente.telefone, email: r.cliente.email, observacoes: r.cliente.observacoes,
      createdAt: r.cliente.createdAt instanceof Date ? r.cliente.createdAt.toISOString() : r.cliente.createdAt,
    } : undefined,
  }));

  res.json(result);
});

router.get("/os/:id", requireAuth, requireRoles(ALL_ROLES), async (req, res): Promise<void> => {
  const p = GetOSParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const os = await db.ordemServico.findUnique({
    where: { id: p.data.id },
    include: {
      cliente: true,
      venda: { include: { itens: { include: { produto: true } } } },
    },
  });

  if (!os) { res.status(404).json({ error: "OS nÃ£o encontrada" }); return; }

  const currentUser = (req as any).currentUser;
  // TODO: add proper ownership check via venda.usuarioId or cliente when needed
  // if (currentUser.tipo === "vendedor" && os.usuarioId && os.usuarioId !== currentUser.id) {
  //   res.status(403).json({ error: "Sem permissÃ£o" }); return;
  // }

  const observacoes = await db.oSObservacao.findMany({
    where: { osId: p.data.id },
    include: { usuario: true },
    orderBy: { createdAt: "desc" },
  });

  const historico = await db.oSHistoricoStatus.findMany({
    where: { osId: p.data.id },
    orderBy: { createdAt: "desc" },
  });

  const etapas = await db.oSEtapaProducao.findMany({ where: { osId: p.data.id } });

  res.json({
    id: os.id, numero: os.numero, vendaId: os.vendaId, clienteId: os.clienteId,
    dataInicio: os.dataInicio, dataTermino: os.dataTermino, prioridade: os.prioridade,
    status: os.status, etapaAtual: os.etapaAtual,
    observacoesGerais: os.observacoesGerais, observacoesCortedobra: os.observacoesCortedobra,
    observacoesSolda: os.observacoesSolda, arquivoProjeto: os.arquivoProjeto,
    createdAt: os.createdAt instanceof Date ? os.createdAt.toISOString() : os.createdAt,
    cliente: os.cliente ? {
      id: os.cliente.id, razaoSocial: os.cliente.razaoSocial, nomeFantasia: os.cliente.nomeFantasia,
      cnpjCpf: os.cliente.cnpjCpf, cidade: os.cliente.cidade, estado: os.cliente.estado,
      telefone: os.cliente.telefone, email: os.cliente.email, observacoes: os.cliente.observacoes,
    } : undefined,
    venda: os.venda ? {
      id: os.venda.id, numero: os.venda.numero, valorTotal: os.venda.valorTotal,
      formaPagamento: os.venda.formaPagamento, status: os.venda.status,
      itens: os.venda.itens.map((item: any) => ({
        id: item.id, descricaoManual: item.descricaoManual, quantidade: item.quantidade,
        valorUnitario: item.valorUnitario, valorTotal: item.valorTotal,
        produto: item.produto ? { id: item.produto.id, nome: item.produto.nome, codigo: item.produto.codigo } : undefined,
      })),
    } : undefined,
    observacoes: observacoes.map(o => ({
      id: o.id, tipoSetor: o.tipoSetor, observacao: o.observacao,
      createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
      usuario: o.usuario ? { id: o.usuario.id, nome: o.usuario.nome } : undefined,
    })),
    historico: historico.map(h => ({
      id: h.id, statusAnterior: h.statusAnterior, statusNovo: h.statusNovo,
      observacao: h.observacao, createdAt: h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
    })),
    etapas: etapas.map(e => ({
      id: e.id, etapa: e.etapa, status: e.status,
      dataInicio: e.dataInicio instanceof Date ? e.dataInicio.toISOString() : e.dataInicio,
      dataFim: e.dataFim instanceof Date ? e.dataFim.toISOString() : e.dataFim,
    })),
  });
});

router.patch("/os/:id", requireAuth, requireRoles(PRODUCTION_ROLES), async (req, res): Promise<void> => {
  const p = UpdateOSParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const parsed = UpdateOSBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const row = await db.ordemServico.update({ where: { id: p.data.id }, data: parsed.data as any });
    res.json(row);
  } catch {
    res.status(404).json({ error: "OS nÃ£o encontrada" });
  }
});

router.post("/os/:id/avancar", requireAuth, requireRoles(PRODUCTION_ROLES), async (req, res): Promise<void> => {
  const p = AvancarEtapaOSParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const body = AvancarEtapaOSBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const userId = (req as any).currentUser?.id;
  const osId = p.data.id;
  const { novaEtapa, observacao } = body.data;
  const etapaAtual = novaEtapa;        // legacy var name used below
  const proximoStatus = novaEtapa;     // for now treat as same (logic can be refined later)

  // Fecha etapa atual
  await db.oSEtapaProducao.updateMany({
    where: { osId, etapa: etapaAtual as any },
    data: { status: "concluido", dataFim: new Date(), usuarioId: userId },
  }).catch(() => {});

  // Cria se nÃ£o existir
  const exists = await db.oSEtapaProducao.findFirst({ where: { osId, etapa: etapaAtual as any } });
  if (!exists) {
    await db.oSEtapaProducao.create({
      data: { osId, etapa: etapaAtual as any, status: "concluido", dataFim: new Date(), usuarioId: userId },
    });
  }

  // Atualiza OS
  const updated = await db.ordemServico.update({
    where: { id: osId },
    data: {
      etapaAtual: proximoStatus as any,
      status: proximoStatus === "concluida" ? "concluida" : "em_producao",
    },
  });

  await db.oSHistoricoStatus.create({
    data: { osId, statusAnterior: etapaAtual, statusNovo: proximoStatus, observacao, usuarioId: userId },
  });

  if (observacao) {
    await db.oSObservacao.create({
      data: { osId, tipoSetor: etapaAtual as any, observacao, usuarioId: userId },
    });
  }

  res.json(updated);
});

router.post("/os/:id/observacoes", requireAuth, requireRoles(ALL_ROLES), async (req, res): Promise<void> => {
  const p = AddObservacaoOSParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const body = AddObservacaoOSBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const userId = (req as any).currentUser?.id;

  const obs = await db.oSObservacao.create({
    data: {
      osId: p.data.id as number,
      tipoSetor: body.data.tipoSetor,
      observacao: body.data.observacao,
      usuarioId: userId,
    },
  });

  res.status(201).json(obs);
});

export default router;


