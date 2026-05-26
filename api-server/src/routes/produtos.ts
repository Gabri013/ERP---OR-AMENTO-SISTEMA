import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import {
  CreateProdutoBody,
  UpdateProdutoBody,
  UpdateProdutoParams,
  GetProdutoParams,
  DeleteProdutoParams,
  ListProdutosQueryParams,
} from "../schemas";
import {
  requireAuth,
  requireRoles,
  ALL_ROLES,
  ADMIN_ROLES,
} from "../middleware/auth";
import { auditLog } from "../middleware/audit";
import { validate } from "../middleware/validate";
import { response } from "../utils/response";
import { getPagination, buildMeta } from "../utils/pagination";
import { withCache, cacheDel } from "../lib/redis";

const router: IRouter = Router();

function serializeProduto(r: any) {
  return {
    id: r.id,
    codigo: r.codigo,
    nome: r.nome,
    descricao: r.descricao,
    foto: r.foto,
    valor:
      typeof r.valor === "object" && r.valor !== null
        ? Number(r.valor)
        : Number(r.valor),
    estoque: r.estoque,
    status: r.status,
  };
}

router.get(
  "/produtos",
  requireAuth,
  requireRoles(ALL_ROLES),
  auditLog({ action: "list", module: "produtos", table: "Produto" }),
  async (req, res): Promise<void> => {
    const params = ListProdutosQueryParams.safeParse(req.query);
    const q = params.success ? params.data.q : undefined;
    const { page, limit, skip } = getPagination(req);

    // Don't cache searches, only full list
    if (!q) {
      const cacheKey = "produtos:all";
      const cached = await withCache(cacheKey, 600, async () => {
        const [rows, total] = await Promise.all([
          db.produto.findMany({
            skip,
            take: limit,
            orderBy: { nome: "asc" },
          }),
          db.produto.count(),
        ]);
        return { rows: rows.map(serializeProduto), total };
      });

      res.json(
        response.success(
          cached.rows,
          buildMeta(page, limit, cached.total),
        ),
      );
      return;
    }

    // Search queries are not cached
    const where = {
      nome: { contains: q, mode: "insensitive" as const },
    };

    const [rows, total] = await Promise.all([
      db.produto.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: "asc" },
      }),
      db.produto.count({ where }),
    ]);

    res.json(
      response.success(
        rows.map(serializeProduto),
        buildMeta(page, limit, total),
      ),
    );
  },
);

router.post(
  "/produtos",
  requireAuth,
  requireRoles(ADMIN_ROLES),
  validate(CreateProdutoBody),
  auditLog({ action: "create", module: "produtos", table: "Produto" }),
  async (req, res): Promise<void> => {
    const data: any = { ...req.body };
    if (data.valor !== undefined) data.valor = String(data.valor);

    const row = await db.produto.create({ data });
    // Invalidate cache
    await cacheDel("produtos:all");
    res.status(201).json(response.success(serializeProduto(row)));
  },
);

router.get(
  "/produtos/:id",
  requireAuth,
  requireRoles(ALL_ROLES),
  auditLog({ action: "view", module: "produtos", table: "Produto" }),
  async (req, res): Promise<void> => {
    const p = GetProdutoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const row = await db.produto.findUnique({
      where: { id: Number(p.data.id) },
    });
    if (!row) {
      res
        .status(404)
        .json(response.error("Produto não encontrado", "NOT_FOUND"));
      return;
    }

    res.json(response.success(serializeProduto(row)));
  },
);

router.patch(
  "/produtos/:id",
  requireAuth,
  requireRoles(ADMIN_ROLES),
  validate(UpdateProdutoBody),
  auditLog({ action: "update", module: "produtos", table: "Produto" }),
  async (req, res): Promise<void> => {
    const p = UpdateProdutoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const data: any = { ...req.body };
    if (data.valor !== undefined) data.valor = String(data.valor);

    try {
      const row = await db.produto.update({
        where: { id: Number(p.data.id) },
        data,
      });
      // Invalidate cache
      await cacheDel("produtos:all");
      res.json(response.success(serializeProduto(row)));
    } catch {
      res
        .status(404)
        .json(response.error("Produto não encontrado", "NOT_FOUND"));
    }
  },
);

router.delete(
  "/produtos/:id",
  requireAuth,
  requireRoles(ADMIN_ROLES),
  auditLog({ action: "delete", module: "produtos", table: "Produto" }),
  async (req, res): Promise<void> => {
    const p = DeleteProdutoParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    try {
      await db.produto.delete({ where: { id: Number(p.data.id) } });
      // Invalidate cache
      await cacheDel("produtos:all");
      res.sendStatus(204);
    } catch {
      res
        .status(404)
        .json(response.error("Produto não encontrado", "NOT_FOUND"));
    }
  },
);

export default router;
