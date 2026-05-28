import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { response } from "../../utils/response";
import { validateParams } from "../../middleware/validateZod";
import { GetVendaParams } from "../../schemas";
import { serializeVenda } from "./utils";

export const getRouter = Router();

getRouter.get(
  "/vendas/:id",
  requireAuth,
  checkPermission("vendas", "visualizar"),
  validateParams(GetVendaParams),
  async (req: Request, res: Response): Promise<void> => {
    const p = GetVendaParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const venda = await db.venda.findUnique({
      where: { id: Number(p.data.id) },
      include: { cliente: true },
    });

    if (!venda) {
      res.status(404).json(response.error("Venda não encontrada", "NOT_FOUND"));
      return;
    }

    const itens = await db.vendaItem.findMany({ where: { vendaId: Number(p.data.id) } });
    const ordens = await db.ordemServico.findMany({ where: { vendaId: Number(p.data.id) } });

    res.json(
      response.success({
        ...serializeVenda(venda, venda.cliente),
        itens: itens.map((i) => ({
          id: i.id,
          produtoId: i.produtoId,
          descricaoManual: i.descricaoManual,
          quantidade: Number(i.quantidade),
          valorUnitario: Number(i.valorUnitario),
          valorTotal: Number(i.valorTotal),
        })),
        ordensServico: ordens.map((os) => ({
          id: os.id,
          numero: os.numero,
          status: os.status,
          etapaAtual: os.etapaAtual,
          prioridade: os.prioridade,
        })),
      }),
    );
  },
);
