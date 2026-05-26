import { Router, type IRouter } from "express";
import { db } from "../lib/prisma";
import {
  CreateClienteBody,
  UpdateClienteBody,
  UpdateClienteParams,
  GetClienteParams,
  DeleteClienteParams,
  ListClientesQueryParams,
} from "../schemas";
import {
  requireAuth,
  requireRoles,
  ALL_ROLES,
  ADMIN_ROLES,
} from "../middleware/auth";
import { auditLog } from "../middleware/audit";
import { validate } from "../middleware/validate";
import { validateBody, validateParams } from "../middleware/validateZod";
import { response } from "../utils/response";
import { getPagination, buildMeta } from "../utils/pagination";
import { withCache, cacheDel } from "../lib/redis";

const router: IRouter = Router();

function serializeCliente(r: any) {
  return {
    id: r.id,
    razaoSocial: r.razaoSocial,
    nomeFantasia: r.nomeFantasia,
    cnpjCpf: r.cnpjCpf,
    endereco: r.endereco,
    cidade: r.cidade,
    estado: r.estado,
    telefone: r.telefone,
    email: r.email,
    observacoes: r.observacoes,
    createdAt:
      r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

router.get(
  "/clientes",
  requireAuth,
  requireRoles(ALL_ROLES),
  auditLog({ action: "list", module: "clientes", table: "Cliente" }),
  async (req, res): Promise<void> => {
    const params = ListClientesQueryParams.safeParse(req.query);
    const q = params.success ? params.data.q : undefined;
    const { page, limit, skip } = getPagination(req);

    // Don't cache searches, only full list
    if (!q) {
      const cacheKey = "clientes:all";
      const cached = await withCache(cacheKey, 300, async () => {
        const [rows, total] = await Promise.all([
          db.cliente.findMany({
            skip,
            take: limit,
            orderBy: { razaoSocial: "asc" },
          }),
          db.cliente.count(),
        ]);
        return { rows: rows.map(serializeCliente), total };
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
      OR: [
        { razaoSocial: { contains: q, mode: "insensitive" as const } },
        { nomeFantasia: { contains: q, mode: "insensitive" as const } },
        { cnpjCpf: { contains: q, mode: "insensitive" as const } },
      ],
    };

    const [rows, total] = await Promise.all([
      db.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { razaoSocial: "asc" },
      }),
      db.cliente.count({ where }),
    ]);

    res.json(
      response.success(
        rows.map(serializeCliente),
        buildMeta(page, limit, total),
      ),
    );
  },
);

router.post(
  "/clientes",
  requireAuth,
  requireRoles(ADMIN_ROLES),
  validateBody(CreateClienteBody),
  auditLog({ action: "create", module: "clientes", table: "Cliente" }),
  async (req, res): Promise<void> => {
    const row = await db.cliente.create({ data: req.body });
    // Invalidate cache
    await cacheDel("clientes:all");
    res.status(201).json(response.success(serializeCliente(row)));
  },
);

router.get(
  "/clientes/:id",
  requireAuth,
  requireRoles(ALL_ROLES),
  auditLog({ action: "view", module: "clientes", table: "Cliente" }),
  async (req, res): Promise<void> => {
    const p = GetClienteParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }
    const row = await db.cliente.findUnique({
      where: { id: Number(p.data.id) },
    });
    if (!row) {
      res
        .status(404)
        .json(response.error("Cliente não encontrado", "NOT_FOUND"));
      return;
    }
    res.json(response.success(serializeCliente(row)));
  },
);

router.patch(
  "/clientes/:id",
  requireAuth,
  requireRoles(ADMIN_ROLES),
  validateParams(UpdateClienteParams),
  validateBody(UpdateClienteBody),
  auditLog({ action: "update", module: "clientes", table: "Cliente" }),
  async (req, res): Promise<void> => {
    const p = UpdateClienteParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }
    try {
      const row = await db.cliente.update({
        where: { id: Number(p.data.id) },
        data: req.body,
      });
      // Invalidate cache
      await cacheDel("clientes:all");
      res.json(response.success(serializeCliente(row)));
    } catch {
      res
        .status(404)
        .json(response.error("Cliente não encontrado", "NOT_FOUND"));
    }
  },
);

router.delete(
  "/clientes/:id",
  requireAuth,
  requireRoles(ADMIN_ROLES),
  validateParams(DeleteClienteParams),
  auditLog({ action: "delete", module: "clientes", table: "Cliente" }),
  async (req, res): Promise<void> => {
    const p = DeleteClienteParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }
    try {
      await db.cliente.delete({ where: { id: Number(p.data.id) } });
      // Invalidate cache
      await cacheDel("clientes:all");
      res.sendStatus(204);
    } catch {
      res
        .status(404)
        .json(response.error("Cliente não encontrado", "NOT_FOUND"));
    }
  },
);

export default router;
