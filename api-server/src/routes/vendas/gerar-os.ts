import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { validateParams } from "../../middleware/validateZod";
import { GerarOsParaVendaParams } from "../../schemas";
import { auditLog } from "../../middleware/audit";
import { response } from "../../utils/response";
import { getNextOSNum } from "./utils";
import { emailQueue } from "../../lib/queue";

export const gerarOsRouter = Router();

const ETAPAS_PRODUCAO = [
  "programacao",
  "engenharia",
  "corte",
  "dobra",
  "tubo",
  "solda",
  "coccao",
  "refrigeracao",
  "mobiliario",
  "montagem",
  "revisao",
  "embalagem",
  "expedicao",
] as const;

gerarOsRouter.post(
  "/vendas/:id/gerar-os",
  requireAuth,
  checkPermission("vendas", "gerar_os"),
  validateParams(GerarOsParaVendaParams),
  auditLog({ action: "create", module: "os", table: "OrdemServico" }),
  async (req: Request, res: Response): Promise<void> => {
    const p = GerarOsParaVendaParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const venda = await db.venda.findUnique({
      where: { id: Number(p.data.id) },
      include: { itens: { include: { produto: true } } },
    });

    if (!venda) {
      res.status(404).json(response.error("Venda não encontrada", "NOT_FOUND"));
      return;
    }

    const existing = await db.ordemServico.findMany({ where: { vendaId: Number(p.data.id) } });
    if (existing.length > 0) {
      res.status(400).json(response.error("OS já gerada para esta venda", "ALREADY_EXISTS"));
      return;
    }

    const numero = await getNextOSNum();
    const today = new Date();
    const prazoDefault = new Date(today);
    prazoDefault.setDate(prazoDefault.getDate() + 30);

    const userId = (req as any).currentUser?.id ?? 1;

    const os = await db.ordemServico.create({
      data: {
        numero,
        vendaId: venda.id,
        clienteId: venda.clienteId,
        dataInicio: today,
        dataTermino: prazoDefault,
        prioridade: "verde",
        status: "pendente",
        etapaAtual: "autorizacao",
        observacoesGerais: venda.observacoes ?? undefined,
      },
    });

    for (const etapa of ETAPAS_PRODUCAO) {
      await db.oSEtapaProducao.create({
        data: { osId: os.id, etapa: etapa as any, status: "pendente" },
      });
    }

    await db.oSHistoricoStatus.create({
      data: {
        osId: os.id,
        statusAnterior: null,
        statusNovo: "pendente",
        observacao: `OS gerada a partir da venda ${venda.numero}`,
        usuarioId: userId,
      },
    });

    const cliente = await db.cliente.findUnique({ where: { id: venda.clienteId } });
    if (cliente?.email) {
      await emailQueue.add({
        type: "os",
        clienteEmail: cliente.email,
        numero,
        modelId: os.id,
      });
    }

    res.status(201).json(
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
        createdAt: os.createdAt instanceof Date ? os.createdAt.toISOString() : os.createdAt,
        itens: venda.itens.map((i) => ({
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
