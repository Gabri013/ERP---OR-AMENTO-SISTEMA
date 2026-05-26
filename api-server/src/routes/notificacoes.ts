import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { auditLog } from "../middleware/audit";
import { response } from "../utils/response";

const router: IRouter = Router();

// notificacao model is in schema — cast until `npm run db:generate` runs
const nm = (db as any).notificacao;

router.get(
  "/notificacoes",
  requireAuth,
  auditLog({ action: "list", module: "notificacoes", table: "Notificacao" }),
  async (req, res): Promise<void> => {
    const currentUser = (req as any).currentUser;

    const [notificacoes, naoLidas] = await Promise.all([
      nm.findMany({
        where: { usuarioId: currentUser.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      nm.count({ where: { usuarioId: currentUser.id, lida: false } }),
    ]);

    res.json(
      response.success({
        notificacoes: notificacoes.map((n: any) => ({
          id: n.id,
          titulo: n.titulo,
          mensagem: n.mensagem,
          tipo: n.tipo,
          lida: n.lida,
          link: n.link,
          createdAt: n.createdAt.toISOString(),
          readAt: n.readAt?.toISOString() ?? null,
        })),
        naoLidas,
      }),
    );
  },
);

router.post(
  "/notificacoes/:id/marcar-lida",
  requireAuth,
  auditLog({ action: "update", module: "notificacoes", table: "Notificacao" }),
  async (req, res): Promise<void> => {
    const currentUser = (req as any).currentUser;
    const id = Number(req.params.id);

    const notificacao = await nm.findUnique({ where: { id } });

    if (!notificacao) {
      res
        .status(404)
        .json(response.error("Notificação não encontrada", "NOT_FOUND"));
      return;
    }

    if (notificacao.usuarioId !== currentUser.id) {
      res
        .status(403)
        .json(
          response.error("Sem permissão para esta notificação", "FORBIDDEN"),
        );
      return;
    }

    await nm.update({
      where: { id },
      data: { lida: true, readAt: new Date() },
    });
    res.json(response.success({ ok: true }));
  },
);

router.post(
  "/notificacoes/marcar-todas-lidas",
  requireAuth,
  auditLog({ action: "update", module: "notificacoes", table: "Notificacao" }),
  async (req, res): Promise<void> => {
    const currentUser = (req as any).currentUser;
    await nm.updateMany({
      where: { usuarioId: currentUser.id, lida: false },
      data: { lida: true, readAt: new Date() },
    });
    res.json(response.success({ ok: true }));
  },
);

router.delete(
  "/notificacoes/:id",
  requireAuth,
  auditLog({ action: "delete", module: "notificacoes", table: "Notificacao" }),
  async (req, res): Promise<void> => {
    const currentUser = (req as any).currentUser;
    const id = Number(req.params.id);

    const notificacao = await nm.findUnique({ where: { id } });

    if (!notificacao) {
      res
        .status(404)
        .json(response.error("Notificação não encontrada", "NOT_FOUND"));
      return;
    }

    if (notificacao.usuarioId !== currentUser.id) {
      res
        .status(403)
        .json(
          response.error("Sem permissão para esta notificação", "FORBIDDEN"),
        );
      return;
    }

    await nm.delete({ where: { id } });
    res.json(response.success({ ok: true }));
  },
);

export default router;
