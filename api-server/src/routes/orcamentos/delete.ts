import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { validateParams } from "../../middleware/validateZod";
import { DeleteOrcamentoParams } from "../../schemas";
import { auditLog } from "../../middleware/audit";
import { response } from "../../utils/response";

export const deleteRouter = Router();

deleteRouter.delete(
  "/orcamentos/:id",
  requireAuth,
  checkPermission("orcamentos", "deletar"),
  validateParams(DeleteOrcamentoParams),
  auditLog({ action: "delete", module: "orcamentos", table: "Orcamento" }),
  async (req: Request, res: Response): Promise<void> => {
    const p = DeleteOrcamentoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    try {
      const id = Number(p.data.id);
      await db.orcamento.delete({ where: { id } });
      res.sendStatus(204);
    } catch {
      res.status(404).json(response.error("Orçamento não encontrado", "NOT_FOUND"));
    }
  },
);
