import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { response } from "../../utils/response";
import { validateParams } from "../../middleware/validateZod";
import { GetOrcamentoParams } from "../../schemas";
import { serializeOrc } from "./utils";

export const getRouter = Router();

getRouter.get(
  "/orcamentos/:id",
  requireAuth,
  checkPermission("orcamentos", "visualizar"),
  validateParams(GetOrcamentoParams),
  async (req: Request, res: Response): Promise<void> => {
    const p = GetOrcamentoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const id = Number(p.data.id);
    const orc = await db.orcamento.findUnique({
      where: { id },
      include: { cliente: true },
    });

    if (!orc) {
      res.status(404).json(response.error("Orçamento não encontrado", "NOT_FOUND"));
      return;
    }

    res.json(response.success(serializeOrc(orc, orc.cliente)));
  },
);
