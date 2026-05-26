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
import {
  requireAuth,
  requireRoles,
  SECTOR_ROLES,
  PRODUCTION_ROLES,
  SALES_ROLES,
} from "../middleware/auth";
import { auditLog } from "../middleware/audit";
import { canTransitionEtapa, canTransitionOS } from "../lib/stateMachine";
import { response } from "../utils/response";
import { getPagination, buildMeta } from "../utils/pagination";
import { validateBody, validateParams } from "../middleware/validateZod";
import { generateOSPDF } from "../lib/pdf";

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

const ETAPA_ORDER = [
  "autorizacao",
  "corte",
  "dobra",
  "solda",
  "refrigeracao",
  "acabamento",
  "finalizacao",
  "montagem",
  "concluida",
];

function serializeOS(r: any, cliente?: any) {
  return {
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
    createdAt: r.createdAt?.toISOString?.() ?? r.createdAt,
    cliente: cliente
      ? {
          id: cliente.id,
          razaoSocial: cliente.razaoSocial,
          nomeFantasia: cliente.nomeFantasia,
          cnpjCpf: cliente.cnpjCpf,
          cidade: cliente.cidade,
          estado: cliente.estado,
          telefone: cliente.telefone,
          email: cliente.email,
          observacoes: cliente.observacoes,
          createdAt: cliente.createdAt?.toISOString?.() ?? cliente.createdAt,
        }
      : undefined,
  };
}

router.get(
  "/os",
  requireAuth,
  requireRoles(ALL_ROLES),
  auditLog({ action: "list", module: "os", table: "OrdemServico" }),
  async (req, res): Promise<void> => {
    const params = ListOSQueryParams.safeParse(req.query);
    const status = params.success
      ? (req.query.status as string | undefined)
      : undefined;
    const vendaId = req.query.vendaId ? Number(req.query.vendaId) : undefined;

    const { page, limit, skip } = getPagination(req);
    const where: any = {};
    if (status) where.status = status;
    if (vendaId) where.vendaId = vendaId;

    const [rows, total] = await Promise.all([
      db.ordemServico.findMany({
        where,
        include: { cliente: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.ordemServico.count({ where }),
    ]);
    res.json(
      response.success(
        rows.map((r) => serializeOS(r, r.cliente)),
        buildMeta(page, limit, total),
      ),
    );
  },
);

router.get(
  "/os/:id",
  requireAuth,
  requireRoles(ALL_ROLES),
  auditLog({ action: "view", module: "os", table: "OrdemServico" }),
  async (req, res): Promise<void> => {
    const p = GetOSParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const osId = Number(p.data.id);
    const os = await db.ordemServico.findUnique({
      where: { id: osId },
      include: { cliente: true },
    });

    if (!os) {
      res.status(404).json(response.error("OS não encontrada", "NOT_FOUND"));
      return;
    }

    const observacoes = await db.oSObservacao.findMany({
      where: { osId },
      include: { usuario: true },
      orderBy: { createdAt: "desc" },
    });

    const historico = await db.oSHistoricoStatus.findMany({
      where: { osId },
      orderBy: { createdAt: "desc" },
    });

    const etapas = await db.oSEtapaProducao.findMany({
      where: { osId },
    });

    // Fetch venda items (products being produced in this OS)
    const vendaItens = os.vendaId
      ? await db.vendaItem.findMany({
          where: { vendaId: os.vendaId },
          include: { produto: true },
        })
      : [];

    res.json(
      response.success({
        id: os.id,
        numero: os.numero,
        vendaId: os.vendaId,
        clienteId: os.clienteId,
        dataInicio: os.dataInicio,
        dataTermino: os.dataTermino,
        prioridade: os.prioridade,
        status: os.status,
        etapaAtual: os.etapaAtual,
        observacoesGerais: os.observacoesGerais,
        observacoesCortedobra: os.observacoesCortedobra,
        observacoesSolda: os.observacoesSolda,
        arquivoProjeto: os.arquivoProjeto,
        createdAt:
          os.createdAt instanceof Date
            ? os.createdAt.toISOString()
            : os.createdAt,
        cliente: os.cliente
          ? { id: os.cliente.id, razaoSocial: os.cliente.razaoSocial }
          : undefined,
        observacoes: observacoes.map((o) => ({
          id: o.id,
          tipoSetor: o.tipoSetor,
          observacao: o.observacao,
          createdAt:
            o.createdAt instanceof Date
              ? o.createdAt.toISOString()
              : o.createdAt,
          usuario: o.usuario
            ? { id: o.usuario.id, nome: o.usuario.nome }
            : undefined,
        })),
        historico: historico.map((h) => ({
          id: h.id,
          statusAnterior: h.statusAnterior,
          statusNovo: h.statusNovo,
          observacao: h.observacao,
          createdAt:
            h.createdAt instanceof Date
              ? h.createdAt.toISOString()
              : h.createdAt,
        })),
        etapas: etapas.map((e) => ({
          id: e.id,
          etapa: e.etapa,
          status: e.status,
          dataInicio:
            e.dataInicio instanceof Date
              ? e.dataInicio.toISOString()
              : e.dataInicio,
          dataFim:
            e.dataFim instanceof Date ? e.dataFim.toISOString() : e.dataFim,
        })),
        itens: vendaItens.map((i) => ({
          id: i.id,
          produtoId: i.produtoId,
          descricaoManual: i.descricaoManual,
          quantidade: Number(i.quantidade),
          valorUnitario: Number(i.valorUnitario),
          valorTotal: Number(i.valorTotal),
          produto: i.produto
            ? {
                id: i.produto.id,
                codigo: i.produto.codigo,
                nome: i.produto.nome,
                descricao: i.produto.descricao,
              }
            : null,
        })),
      }),
    );
  },
);

router.patch(
  "/os/:id",
  requireAuth,
  requireRoles(PRODUCTION_ROLES),
  validateParams(UpdateOSParams),
  validateBody(UpdateOSBody),
  auditLog({ action: "update", module: "os", table: "OrdemServico" }),
  async (req, res): Promise<void> => {
    const p = UpdateOSParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    if (req.body.status) {
      const atual = await db.ordemServico.findUnique({
        where: { id: Number(p.data.id) },
      });
      if (atual) {
        const validation = canTransitionOS(atual.status, req.body.status);
        if (!validation.valid) {
          res
            .status(422)
            .json(
              response.error(
                validation.error || "Transição inválida",
                "INVALID_TRANSITION",
              ),
            );
          return;
        }
      }
    }

    try {
      const row = await db.ordemServico.update({
        where: { id: Number(p.data.id) },
        data: req.body as any,
      });
      res.json(response.success(row));
    } catch {
      res.status(404).json(response.error("OS não encontrada", "NOT_FOUND"));
    }
  },
);

router.post(
  "/os/:id/avancar",
  requireAuth,
  requireRoles(PRODUCTION_ROLES),
  validateParams(AvancarEtapaOSParams),
  validateBody(AvancarEtapaOSBody),
  auditLog({ action: "update", module: "os", table: "OrdemServico" }),
  async (req, res): Promise<void> => {
    const p = AvancarEtapaOSParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const userId = (req as any).currentUser?.id;
    const osId = Number(p.data.id);
    const osAtual = await db.ordemServico.findUnique({ where: { id: osId } });
    if (!osAtual) {
      res.status(404).json(response.error("OS não encontrada", "NOT_FOUND"));
      return;
    }

    const novaEtapa = req.body.novaEtapa || req.body.etapa;
    const observacao = req.body.observacao;

    if (!novaEtapa) {
      res
        .status(422)
        .json(response.error("Nova etapa é obrigatória", "VALIDATION_ERROR"));
      return;
    }

    const etapaValidation = canTransitionEtapa(osAtual.etapaAtual, novaEtapa);
    if (!etapaValidation.valid) {
      res
        .status(422)
        .json(
          response.error(
            etapaValidation.error || "Transição inválida",
            "INVALID_TRANSITION",
          ),
        );
      return;
    }

    const etapaAtual = osAtual.etapaAtual;
    const proximoStatus =
      novaEtapa === "concluida" ? "concluida" : "em_producao";

    // Fecha etapa atual
    await db.oSEtapaProducao
      .updateMany({
        where: { osId, etapa: etapaAtual as any },
        data: { status: "concluido", dataFim: new Date(), usuarioId: userId },
      })
      .catch(() => {});

    // Cria se não existir
    const exists = await db.oSEtapaProducao.findFirst({
      where: { osId, etapa: etapaAtual as any },
    });
    if (!exists) {
      await db.oSEtapaProducao.create({
        data: {
          osId,
          etapa: etapaAtual as any,
          status: "concluido",
          dataFim: new Date(),
          usuarioId: userId,
        },
      });
    }

    // Atualiza OS
    const updated = await db.ordemServico.update({
      where: { id: osId },
      data: {
        etapaAtual: novaEtapa as any,
        status: proximoStatus === "concluida" ? "concluida" : "em_producao",
      },
    });

    await db.oSHistoricoStatus.create({
      data: {
        osId,
        statusAnterior: etapaAtual,
        statusNovo: proximoStatus,
        observacao,
        usuarioId: userId,
      },
    });

    if (observacao) {
      await db.oSObservacao.create({
        data: {
          osId,
          tipoSetor: etapaAtual as any,
          observacao,
          usuarioId: userId,
        },
      });
    }

    res.json(response.success(updated));
  },
);

router.post(
  "/os/:id/observacoes",
  requireAuth,
  requireRoles(ALL_ROLES),
  validateParams(AddObservacaoOSParams),
  validateBody(AddObservacaoOSBody),
  auditLog({ action: "create", module: "os", table: "OSObservacao" }),
  async (req, res): Promise<void> => {
    const p = AddObservacaoOSParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const userId = (req as any).currentUser?.id;

    const obs = await db.oSObservacao.create({
      data: {
        osId: Number(p.data.id),
        tipoSetor: req.body.tipoSetor,
        observacao: req.body.observacao,
        usuarioId: userId,
      },
    });

    res.status(201).json(response.success(obs));
  },
);

// GET /os/:id/imprimir — returns full OS data formatted for printing
router.get(
  "/os/:id/imprimir",
  requireAuth,
  requireRoles(ALL_ROLES),
  async (req, res): Promise<void> => {
    const osId = Number(req.params.id);
    if (!osId) {
      res.status(400).json(response.error("ID inválido", "VALIDATION_ERROR"));
      return;
    }

    const os = await db.ordemServico.findUnique({
      where: { id: osId },
      include: {
        cliente: true,
        venda: {
          include: { itens: { include: { produto: true } }, orcamento: true },
        },
        etapas: { orderBy: { createdAt: "asc" } },
        historico: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!os) {
      res.status(404).json(response.error("OS não encontrada", "NOT_FOUND"));
      return;
    }

    const PROCESSOS = [
      "Engenharia",
      "Programação",
      "Corte",
      "Dobra",
      "Tubo",
      "Solda",
      "Mobiliário",
      "Cocção",
      "Refrigeração",
      "Embalagem",
    ];

    res.json(
      response.success({
        numero: os.numero,
        dataEmissao:
          os.createdAt instanceof Date
            ? os.createdAt.toISOString()
            : os.createdAt,
        dataInicio: os.dataInicio,
        dataTermino: os.dataTermino,
        prioridade: os.prioridade,
        status: os.status,
        etapaAtual: os.etapaAtual,
        observacoesGerais: os.observacoesGerais,
        cliente: os.cliente
          ? {
              id: os.cliente.id,
              razaoSocial: os.cliente.razaoSocial,
              nomeFantasia: os.cliente.nomeFantasia,
              cnpjCpf: os.cliente.cnpjCpf,
              endereco: os.cliente.endereco,
              cidade: os.cliente.cidade,
              estado: os.cliente.estado,
              telefone: os.cliente.telefone,
            }
          : null,
        venda: os.venda
          ? {
              numero: os.venda.numero,
              dataVenda: os.venda.dataVenda,
              valorTotal: Number(os.venda.valorTotal),
              numeroPedido:
                (os.venda as any).orcamento?.numero ?? os.venda.numero,
            }
          : null,
        itens: (os.venda?.itens ?? []).map((i) => ({
          id: i.id,
          codigo: i.produto?.codigo ?? null,
          descricao: i.descricaoManual ?? i.produto?.nome ?? "—",
          quantidade: Number(i.quantidade),
          valorUnitario: Number(i.valorUnitario),
          valorTotal: Number(i.valorTotal),
          produto: i.produto
            ? {
                id: i.produto.id,
                codigo: i.produto.codigo,
                nome: i.produto.nome,
                descricao: i.produto.descricao,
              }
            : null,
        })),
        processos: PROCESSOS,
        etapas: os.etapas.map((e) => ({
          etapa: e.etapa,
          status: e.status,
          dataInicio: e.dataInicio,
          dataFim: e.dataFim,
        })),
      }),
    );
  },
);

// GET /kanban/producao - returns OS grouped by status column
router.get(
  "/kanban/producao",
  requireAuth,
  requireRoles(ALL_ROLES),
  async (req, res): Promise<void> => {
    const allOS = await db.ordemServico.findMany({
      include: { cliente: true },
      orderBy: [{ prioridade: "asc" }, { dataTermino: "asc" }],
    });

    const hoje = new Date();

    const kanban: Record<string, any[]> = {
      pendente: [],
      liberada: [],
      em_producao: [],
      pausado: [],
      em_revisao: [],
      concluida: [],
      entregue: [],
      cancelada: [],
    };

    allOS.forEach((os) => {
      const col = kanban[os.status] ?? kanban.pendente;
      col.push({
        id: os.id,
        numero: os.numero,
        clienteNome: os.cliente?.razaoSocial ?? "—",
        clienteId: os.clienteId,
        vendaId: os.vendaId,
        etapaAtual: os.etapaAtual,
        prioridade: os.prioridade,
        status: os.status,
        dataInicio: os.dataInicio,
        dataTermino: os.dataTermino,
        atrasada: os.dataTermino ? os.dataTermino < hoje : false,
        observacoesGerais: os.observacoesGerais,
        createdAt: os.createdAt,
      });
    });

    res.json(response.success(kanban));
  },
);

// PATCH /os/:id/kanban - move OS to a different status column
router.patch(
  "/os/:id/kanban",
  requireAuth,
  requireRoles(PRODUCTION_ROLES),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      res
        .status(400)
        .json(response.error("Status é obrigatório", "VALIDATION_ERROR"));
      return;
    }

    const os = await db.ordemServico.findUnique({ where: { id } });
    if (!os) {
      res.status(404).json(response.error("OS não encontrada", "NOT_FOUND"));
      return;
    }

    const updated = await db.ordemServico.update({
      where: { id },
      data: { status: status as any, updatedAt: new Date() },
    });

    await db.oSHistoricoStatus.create({
      data: {
        osId: id,
        statusAnterior: os.status,
        statusNovo: status,
        observacao: `Movida via Kanban`,
        usuarioId: (req as any).currentUser?.id,
      },
    });

    res.json(response.success(updated));
  },
);

export default router;
