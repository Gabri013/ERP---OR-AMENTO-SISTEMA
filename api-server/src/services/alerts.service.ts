import { db } from "../lib/prisma";
import { logger } from "../lib/logger";
import { getIO } from "../lib/socket";

const nm = (db as any).notificacao;

export async function checkOverdueOS() {
  try {
    const hoje = new Date();
    const overdueOS = await db.ordemServico.findMany({
      where: {
        status: { notIn: ["concluida", "entregue", "cancelada"] as any[] },
        dataTermino: { lt: hoje },
      },
      include: { cliente: true },
    });

    if (overdueOS.length === 0) return;

    // Busca gerentes e masters para notificar
    const gestores = await (db as any).$queryRawUnsafe(
      `SELECT id FROM "Usuario" WHERE tipo::text IN ('master', 'gerente') AND status = 'ativo'`
    ) as any[];

    const io = getIO();

    for (const os of overdueOS) {
      const titulo = `OS ${os.numero} atrasada`;
      const mensagem = `A OS ${os.numero} do cliente ${os.cliente?.razaoSocial ?? "—"} está atrasada. Prazo era ${os.dataTermino ? new Date(os.dataTermino).toLocaleDateString("pt-BR") : "—"}.`;

      for (const gestor of gestores) {
        // Verifica se já existe notificação recente (últimas 24h) para não duplicar
        const existente = await nm.findFirst({
          where: {
            usuarioId: gestor.id,
            titulo,
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

        if (!existente) {
          const notif = await nm.create({
            data: { usuarioId: gestor.id, titulo, mensagem, tipo: "warning" },
          });

          io?.to(`user:${gestor.id}`).emit("notificacao", {
            id: notif.id,
            titulo: notif.titulo,
            mensagem: notif.mensagem,
            tipo: notif.tipo,
            lida: false,
            createdAt: notif.createdAt.toISOString(),
          });
        }
      }
    }

    logger.info({ count: overdueOS.length }, "Alert check: overdue OS notified");
  } catch (err) {
    logger.error({ err }, "Alert check error");
  }
}

export function startAlertScheduler(intervalMs = 5 * 60 * 1000) {
  // Run immediately on start
  setTimeout(() => checkOverdueOS(), 10000);
  // Then every intervalMs
  setInterval(() => checkOverdueOS(), intervalMs);
  logger.info({ intervalMs }, "Alert scheduler started");
}
