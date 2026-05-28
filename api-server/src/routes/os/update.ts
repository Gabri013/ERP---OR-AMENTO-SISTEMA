import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth, requireRoles, PRODUCTION_ROLES } from "../../middleware/auth";
import { validateBody, validateParams } from "../../middleware/validateZod";
import { UpdateOSBody, UpdateOSParams } from "../../schemas";
import { auditLog } from "../../middleware/audit";
import { canTransitionOS } from "../../lib/stateMachine";
import { response } from "../../utils/response";

export const updateRouter = Router();

updateRouter.patch(
  "/os/:id",
  requireAuth,
  requireRoles(PRODUCTION_ROLES),
  validateParams(UpdateOSParams),
  validateBody(UpdateOSBody),
  auditLog({ action: "update", module: "os", table: "OrdemServico" }),
  async (req: Request, res: Response): Promise<void> => {
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
