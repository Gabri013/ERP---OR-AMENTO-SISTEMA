import { Router, Request, Response } from "express";
import { db } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { checkPermission } from "../../middleware/checkPermission";
import { response } from "../../utils/response";
import { getPagination, buildMeta } from "../../utils/pagination";
import { ListVendasQueryParams } from "../../schemas";
import { getDataFilter } from "../../utils/permissionFilters";

export const listRouter = Router();

listRouter.get(
  "/vendas",
  requireAuth,
  checkPermission("vendas", "visualizar"),
  async (req: Request, res: Response): Promise<void> => {
    ListVendasQueryParams.safeParse(req.query);
    const status = req.query.status as string | undefined;
    const currentUser = (req as any).currentUser;

    const { page, limit, skip } = getPagination(req);

    const permFilter = getDataFilter(
      {
        userId: currentUser.id,
        userRole: currentUser.tipo,
        setorId: currentUser.setorId,
      },
      "vendas",
    );

    const where: any = { ...permFilter };
    if (status) where.status = status;

    const [rows, total] = await Promise.all([
      db.venda.findMany({
        where,
        include: { cliente: true, ordensServico: { select: { id: true, numero: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.venda.count({ where }),
    ]);

    res.json(
      response.success(
        rows.map((r) => ({
          ...r,
          valorTotal: Number(r.valorTotal),
          desconto: Number(r.desconto),
          createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
          ordensServico: (r as any).ordensServico ?? [],
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
