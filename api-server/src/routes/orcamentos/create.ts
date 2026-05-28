import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { validateBody } from "../../middleware/validateZod";
import { CreateOrcamentoBody } from "../../schemas";
import { response } from "../../utils/response";
import { getNextOrcamentoNum, serializeOrc } from "./utils";
import { emailQueue } from "../../lib/queue";

export const createRouter = Router();

createRouter.post(
  "/orcamentos",
  requireAuth,
  checkPermission("orcamentos", "criar"),
  validateBody(CreateOrcamentoBody),
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).currentUser?.id ?? 1;
    const { itens, ...orcData } = req.body as any;
    const numero = await getNextOrcamentoNum();

    const valorTotal = itens.reduce(
      (sum: number, i: any) => sum + Number(i.valorUnitario) * Number(i.quantidade),
      0,
    );

    const orc = await db.orcamento.create({
      data: {
        numero,
        clienteId: orcData.clienteId,
        usuarioId: userId,
        dataOrcamento: orcData.dataOrcamento,
        validade: orcData.validade,
        valorTotal: valorTotal - Number(orcData.desconto ?? 0),
        desconto: orcData.desconto ?? 0,
        status: orcData.status ?? "pendente",
        observacoes: orcData.observacoes,
      },
    });

    for (const item of itens) {
      await db.orcamentoItem.create({
        data: {
          orcamentoId: orc.id,
          produtoId: item.produtoId ?? null,
          descricaoManual: item.descricaoManual ?? null,
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valorUnitario),
          valorTotal: Number(item.valorUnitario) * Number(item.quantidade),
        },
      });
    }

    const cliente = await db.cliente.findUnique({ where: { id: orc.clienteId } });
    if (cliente?.email) {
      await emailQueue.add({
        type: "orcamento",
        clienteEmail: cliente.email,
        numero,
        modelId: orc.id,
      });
    }

    res.status(201).json(response.success(serializeOrc(orc, cliente)));
  },
);
