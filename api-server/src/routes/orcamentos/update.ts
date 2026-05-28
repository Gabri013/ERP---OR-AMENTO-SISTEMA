import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { validateBody, validateParams } from "../../middleware/validateZod";
import { UpdateOrcamentoBody, UpdateOrcamentoParams } from "../../schemas";
import { auditLog } from "../../middleware/audit";
import { canTransitionOrcamento } from "../../lib/stateMachine";
import { response } from "../../utils/response";
import { serializeOrc } from "./utils";

export const updateRouter = Router();

updateRouter.patch(
  "/orcamentos/:id",
  requireAuth,
  checkPermission("orcamentos", "editar"),
  validateParams(UpdateOrcamentoParams),
  validateBody(UpdateOrcamentoBody),
  auditLog({ action: "update", module: "orcamentos", table: "Orcamento" }),
  async (req: Request, res: Response): Promise<void> => {
    const p = UpdateOrcamentoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const data: any = { ...req.body };
    if (data.desconto !== undefined) data.desconto = Number(data.desconto);

    if (data.status) {
      const orc = await db.orcamento.findUnique({ where: { id: Number(p.data.id) } });
      if (orc) {
        const validation = canTransitionOrcamento(orc.status, data.status);
        if (!validation.valid) {
          res.status(400).json(response.error(validation.error || "Transição inválida", "INVALID_TRANSITION"));
          return;
        }
      }
    }

    try {
      const id = Number(p.data.id);
      const row = await db.orcamento.update({ where: { id }, data });
      const cliente = await db.cliente.findUnique({ where: { id: row.clienteId } });
      res.json(response.success(serializeOrc(row, cliente)));
    } catch {
      res.status(404).json(response.error("Orçamento não encontrado", "NOT_FOUND"));
    }
  },
);
