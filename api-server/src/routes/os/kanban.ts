import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { response } from "../../utils/response";

export const kanbanRouter = Router();

kanbanRouter.get(
  "/kanban/producao",
  requireAuth,
  checkPermission("os", "visualizar"),
  async (req: Request, res: Response): Promise<void> => {
    const allOS = await db.ordemServico.findMany({
      include: { cliente: true },
      orderBy: [{ prioridade: "asc" }, { dataTermino: "asc" }],
    });

    const hoje = new Date();

    const kanban: Record<string, any[]> = {
      pendente: [],
      liberada: [],
      em_producao: [],
      pausado: [],
      em_revisao: [],
      concluida: [],
      entregue: [],
      cancelada: [],
    };

    allOS.forEach((os) => {
      const col = kanban[os.status] ?? kanban.pendente;
      col.push({
        id: os.id,
        numero: os.numero,
        clienteNome: os.cliente?.razaoSocial ?? "—",
        clienteId: os.clienteId,
        vendaId: os.vendaId,
        etapaAtual: os.etapaAtual,
        prioridade: os.prioridade,
        status: os.status,
        dataInicio: os.dataInicio,
        dataTermino: os.dataTermino,
        atrasada: os.dataTermino ? os.dataTermino < hoje : false,
        observacoesGerais: os.observacoesGerais,
        createdAt: os.createdAt,
      });
    });

    res.json(response.success(kanban));
  },
);

kanbanRouter.patch(
  "/os/:id/kanban",
  requireAuth,
  checkPermission("os", "editar"),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const { status } = req.body;

    if (!status) {
      res.status(400).json(response.error("Status é obrigatório", "VALIDATION_ERROR"));
      return;
    }

    const os = await db.ordemServico.findUnique({ where: { id } });
    if (!os) {
      res.status(404).json(response.error("OS não encontrada", "NOT_FOUND"));
      return;
    }

    const updated = await db.ordemServico.update({
      where: { id },
      data: { status: status as any, updatedAt: new Date() },
    });

    await db.oSHistoricoStatus.create({
      data: {
        osId: id,
        statusAnterior: os.status,
        statusNovo: status,
        observacao: `Movida via Kanban`,
        usuarioId: (req as any).currentUser?.id,
      },
    });

    res.json(response.success(updated));
  },
);
