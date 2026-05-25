import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { auditLog } from "../middleware/audit";

const router: IRouter = Router();

router.get("/notificacoes", requireAuth, auditLog({
  action: "list",
  module: "notificacoes",
  table: "Notificacao"
}), async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser;
  
  const notificacoes = await db.notificacao.findMany({
    where: { usuarioId: currentUser.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const naoLidas = await db.notificacao.count({
    where: { usuarioId: currentUser.id, lida: false },
  });

  res.json({
    notificacoes: notificacoes.map(n => ({
      id: n.id,
      titulo: n.titulo,
      mensagem: n.mensagem,
      tipo: n.tipo,
      lida: n.lida,
      link: n.link,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt?.toISOString(),
    })),
    naoLidas,
  });
});

router.post("/notificacoes/:id/marcar-lida", requireAuth, auditLog({
  action: "update",
  module: "notificacoes",
  table: "Notificacao"
}), async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser;
  const id = Number(req.params.id);

  const notificacao = await db.notificacao.findUnique({ where: { id } });
  
  if (!notificacao) {
    res.status(404).json({ error: "Notificação não encontrada" });
    return;
  }

  if (notificacao.usuarioId !== currentUser.id) {
    res.status(403).json({ error: "Sem permissão para esta notificação" });
    return;
  }

  await db.notificacao.update({
    where: { id },
    data: { lida: true, readAt: new Date() },
  });

  res.json({ success: true });
});

router.post("/notificacoes/marcar-todas-lidas", requireAuth, auditLog({
  action: "update",
  module: "notificacoes",
  table: "Notificacao"
}), async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser;

  await db.notificacao.updateMany({
    where: { usuarioId: currentUser.id, lida: false },
    data: { lida: true, readAt: new Date() },
  });

  res.json({ success: true });
});

router.delete("/notificacoes/:id", requireAuth, auditLog({
  action: "delete",
  module: "notificacoes",
  table: "Notificacao"
}), async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser;
  const id = Number(req.params.id);

  const notificacao = await db.notificacao.findUnique({ where: { id } });
  
  if (!notificacao) {
    res.status(404).json({ error: "Notificação não encontrada" });
    return;
  }

  if (notificacao.usuarioId !== currentUser.id) {
    res.status(403).json({ error: "Sem permissão para esta notificação" });
    return;
  }

  await db.notificacao.delete({ where: { id } });

  res.json({ success: true });
});

export default router;
