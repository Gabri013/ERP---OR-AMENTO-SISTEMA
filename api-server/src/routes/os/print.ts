import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth, requireRoles, SALES_ROLES, PRODUCTION_ROLES } from "../../middleware/auth";
import { response } from "../../utils/response";
import { generateOSPDF } from "../../lib/pdf";

export const printRouter = Router();

printRouter.get(
  "/os/:id/imprimir",
  requireAuth,
  requireRoles([...SALES_ROLES, ...PRODUCTION_ROLES]),
  async (req: Request, res: Response): Promise<void> => {
    const osId = Number(req.params.id);
    if (!osId) {
      res.status(400).json(response.error("ID inválido", "VALIDATION_ERROR"));
      return;
    }

    const os = await db.ordemServico.findUnique({
      where: { id: osId },
      include: {
        cliente: true,
        venda: { include: { itens: { include: { produto: true } }, orcamento: true } },
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
        dataEmissao: os.createdAt instanceof Date ? os.createdAt.toISOString() : os.createdAt,
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
              numeroPedido: (os.venda as any).orcamento?.numero ?? os.venda.numero,
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
