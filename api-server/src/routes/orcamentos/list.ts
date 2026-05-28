import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { response } from "../../utils/response";
import { getPagination, buildMeta } from "../../utils/pagination";
import { ListOrcamentosQueryParams } from "../../schemas";
import { getDataFilter } from "../../utils/permissionFilters";

export const listRouter = Router();

listRouter.get(
  "/orcamentos",
  requireAuth,
  checkPermission("orcamentos", "visualizar"),
  async (req: Request, res: Response): Promise<void> => {
    const params = ListOrcamentosQueryParams.safeParse(req.query);
    const status = params.success ? params.data.status : undefined;
    const currentUser = (req as any).currentUser;

    const { page, limit, skip } = getPagination(req);

    const permFilter = getDataFilter(
      {
        userId: currentUser.id,
        userRole: currentUser.tipo,
        setorId: currentUser.setorId,
      },
      "orcamentos",
    );

    const where: any = { ...permFilter };
    if (status) where.status = status;

    const [rows, total] = await Promise.all([
      db.orcamento.findMany({
        where,
        include: { cliente: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.orcamento.count({ where }),
    ]);

    res.json(
      response.success(
        rows.map((r) => ({
          ...r,
          valorTotal: Number(r.valorTotal),
          desconto: Number(r.desconto),
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
