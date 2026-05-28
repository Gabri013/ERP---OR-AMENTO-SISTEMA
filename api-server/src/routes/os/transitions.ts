import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { validateBody, validateParams } from "../../middleware/validateZod";
import { AvancarEtapaOSBody, AvancarEtapaOSParams } from "../../schemas";
import { auditLog } from "../../middleware/audit";
import { checkPermission } from "../../middleware/checkPermission";
import { canTransitionEtapa } from "../../lib/stateMachine";
import { response } from "../../utils/response";

export const transitionsRouter = Router();

transitionsRouter.post(
  "/os/:id/avancar",
  requireAuth,
  checkPermission("os", "avancar_etapa"),
  validateParams(AvancarEtapaOSParams),
  validateBody(AvancarEtapaOSBody),
  auditLog({ action: "update", module: "os", table: "OrdemServico" }),
  async (req: Request, res: Response): Promise<void> => {
    const p = AvancarEtapaOSParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const userId = (req as any).currentUser?.id;
    const osId = Number(p.data.id);
    const osAtual = await db.ordemServico.findUnique({ where: { id: osId } });
    if (!osAtual) {
      res.status(404).json(response.error("OS não encontrada", "NOT_FOUND"));
      return;
    }

    const novaEtapa = req.body.novaEtapa || req.body.etapa;
    const observacao = req.body.observacao;

    if (!novaEtapa) {
      res
        .status(422)
        .json(response.error("Nova etapa é obrigatória", "VALIDATION_ERROR"));
      return;
    }

    const etapaValidation = canTransitionEtapa(osAtual.etapaAtual, novaEtapa);
    if (!etapaValidation.valid) {
      res
        .status(422)
        .json(
          response.error(
            etapaValidation.error || "Transição inválida",
            "INVALID_TRANSITION",
          ),
        );
      return;
    }

    const etapaAtual = osAtual.etapaAtual;
    const proximoStatus = novaEtapa === "concluida" ? "concluida" : "em_producao";

    await db.oSEtapaProducao
      .updateMany({
        where: { osId, etapa: etapaAtual as any },
        data: { status: "concluido", dataFim: new Date(), usuarioId: userId },
      })
      .catch(() => {});

    const exists = await db.oSEtapaProducao.findFirst({
      where: { osId, etapa: etapaAtual as any },
    });
    if (!exists) {
      await db.oSEtapaProducao.create({
        data: {
          osId,
          etapa: etapaAtual as any,
          status: "concluido",
          dataFim: new Date(),
          usuarioId: userId,
        },
      });
    }

    const updated = await db.ordemServico.update({
      where: { id: osId },
      data: {
        etapaAtual: novaEtapa as any,
        status: proximoStatus === "concluida" ? "concluida" : "em_producao",
      },
    });

    await db.oSHistoricoStatus.create({
      data: {
        osId,
        statusAnterior: etapaAtual,
        statusNovo: proximoStatus,
        observacao,
        usuarioId: userId,
      },
    });

    if (observacao) {
      await db.oSObservacao.create({
        data: {
          osId,
          tipoSetor: etapaAtual as any,
          observacao,
          usuarioId: userId,
        },
      });
    }

    res.json(response.success(updated));
  },
);
