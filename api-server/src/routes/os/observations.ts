import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth, requireRoles, PRODUCTION_ROLES, SALES_ROLES } from "../../middleware/auth";
import { validateBody, validateParams } from "../../middleware/validateZod";
import { AddObservacaoOSBody, AddObservacaoOSParams } from "../../schemas";
import { auditLog } from "../../middleware/audit";
import { response } from "../../utils/response";

export const observationsRouter = Router();

observationsRouter.post(
  "/os/:id/observacoes",
  requireAuth,
  requireRoles([...PRODUCTION_ROLES, ...SALES_ROLES]),
  validateParams(AddObservacaoOSParams),
  validateBody(AddObservacaoOSBody),
  auditLog({ action: "create", module: "os", table: "OSObservacao" }),
  async (req: Request, res: Response): Promise<void> => {
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
