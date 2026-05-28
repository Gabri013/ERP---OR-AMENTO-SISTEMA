import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { auditLog } from "../../middleware/audit";
import { getPagination, buildMeta } from "../../utils/pagination";
import { response } from "../../utils/response";
import { ListOSQueryParams } from "../../schemas";
import { getDataFilter } from "../../utils/permissionFilters";

export const listRouter = Router();

listRouter.get(
  "/os",
  requireAuth,
  checkPermission("os", "visualizar"),
  auditLog({ action: "list", module: "os", table: "OrdemServico" }),
  async (req: Request, res: Response): Promise<void> => {
    const params = ListOSQueryParams.safeParse(req.query);
    const status = params.success ? (req.query.status as string | undefined) : undefined;
    const vendaId = req.query.vendaId ? Number(req.query.vendaId) : undefined;
    const currentUser = (req as any).currentUser;

    const { page, limit, skip } = getPagination(req);

    const permFilter = getDataFilter(
      {
        userId: currentUser.id,
        userRole: currentUser.tipo,
        setorId: currentUser.setorId,
      },
      "os",
    );

    const where: any = { ...permFilter };
    if (status) where.status = status;
    if (vendaId) where.vendaId = vendaId;

    const [rows, total] = await Promise.all([
      db.ordemServico.findMany({
        where,
        include: { cliente: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.ordemServico.count({ where }),
    ]);

    res.json(
      response.success(
        rows.map((r) => ({
          ...r,
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
          cliente: r.cliente
            ? {
                id: r.cliente.id,
                razaoSocial: r.cliente.razaoSocial,
                nomeFantasia: r.cliente.nomeFantasia,
                cnpjCpf: r.cliente.cnpjCpf,
                cidade: r.cliente.cidade,
                estado: r.cliente.estado,
                telefone: r.cliente.telefone,
                email: r.cliente.email,
                observacoes: r.cliente.observacoes,
                createdAt:
                  r.cliente.createdAt instanceof Date
                    ? r.cliente.createdAt.toISOString()
                    : r.cliente.createdAt,
              }
            : undefined,
        })),
        buildMeta(page, limit, total),
      ),
    );
  },
);
