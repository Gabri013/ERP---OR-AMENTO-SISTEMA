import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { auditLog } from "../../middleware/audit";
import { response } from "../../utils/response";
import { GetOSParams } from "../../schemas";
import { loadVendaItens } from "./utils";

export const getRouter = Router();

getRouter.get(
  "/os/:id",
  requireAuth,
  checkPermission("os", "visualizar"),
  auditLog({ action: "view", module: "os", table: "OrdemServico" }),
  async (req: Request, res: Response): Promise<void> => {
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

    const vendaItens = await loadVendaItens(os.vendaId ?? undefined);

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
          os.createdAt instanceof Date ? os.createdAt.toISOString() : os.createdAt,
        cliente: os.cliente
          ? {
              id: os.cliente.id,
              razaoSocial: os.cliente.razaoSocial,
              nomeFantasia: os.cliente.nomeFantasia,
              cnpjCpf: os.cliente.cnpjCpf,
              cidade: os.cliente.cidade,
              estado: os.cliente.estado,
              telefone: os.cliente.telefone,
              email: os.cliente.email,
              observacoes: os.cliente.observacoes,
              createdAt:
                os.cliente.createdAt instanceof Date
                  ? os.cliente.createdAt.toISOString()
                  : os.cliente.createdAt,
            }
          : undefined,
        observacoes: observacoes.map((o) => ({
          id: o.id,
          tipoSetor: o.tipoSetor,
          observacao: o.observacao,
          createdAt:
            o.createdAt instanceof Date
              ? o.createdAt.toISOString()
              : o.createdAt,
          usuario: o.usuario ? { id: o.usuario.id, nome: o.usuario.nome } : undefined,
        })),
        historico: historico.map((h) => ({
          id: h.id,
          statusAnterior: h.statusAnterior,
          statusNovo: h.statusNovo,
          observacao: h.observacao,
          createdAt:
            h.createdAt instanceof Date ? h.createdAt.toISOString() : h.createdAt,
        })),
        etapas: etapas.map((e) => ({
          id: e.id,
          etapa: e.etapa,
          status: e.status,
          dataInicio: e.dataInicio instanceof Date ? e.dataInicio.toISOString() : e.dataInicio,
          dataFim: e.dataFim instanceof Date ? e.dataFim.toISOString() : e.dataFim,
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
