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
import { requireAuth, requireRoles, ALL_ROLES, ADMIN_ROLES } from "../middleware/auth";
import { auditLog } from "../middleware/audit";

const router: IRouter = Router();

router.get("/clientes", requireAuth, requireRoles(ALL_ROLES), auditLog({
  action: "list",
  module: "clientes",
  table: "Cliente"
}), async (req, res): Promise<void> => {
  const params = ListClientesQueryParams.safeParse(req.query);
  const q = params.success ? params.data.q : undefined;

  let rows;
  if (q) {
    rows = await db.cliente.findMany({
      where: {
        OR: [
          { razaoSocial: { contains: q, mode: "insensitive" } },
          { nomeFantasia: { contains: q, mode: "insensitive" } },
          { cnpjCpf: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { razaoSocial: "asc" },
    });
  } else {
    rows = await db.cliente.findMany({ orderBy: { razaoSocial: "asc" } });
  }

  res.json(rows.map(r => ({
    id: r.id, razaoSocial: r.razaoSocial, nomeFantasia: r.nomeFantasia,
    cnpjCpf: r.cnpjCpf, endereco: r.endereco, cidade: r.cidade,
    estado: r.estado, telefone: r.telefone, email: r.email,
    observacoes: r.observacoes, createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  })));
});

router.post("/clientes", requireAuth, requireRoles(ADMIN_ROLES), auditLog({
  action: "create",
  module: "clientes",
  table: "Cliente"
}), async (req, res): Promise<void> => {
  const parsed = CreateClienteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const row = await db.cliente.create({ 
    data: {
      razaoSocial: parsed.data.razaoSocial,
      nomeFantasia: parsed.data.nomeFantasia,
      cnpjCpf: parsed.data.cnpjCpf,
      endereco: parsed.data.endereco,
      cidade: parsed.data.cidade,
      estado: parsed.data.estado,
      telefone: parsed.data.telefone,
      email: parsed.data.email,
      observacoes: parsed.data.observacoes,
    }
  });
  res.status(201).json({ ...row, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt });
});

router.get("/clientes/:id", requireAuth, requireRoles(ALL_ROLES), auditLog({
  action: "view",
  module: "clientes",
  table: "Cliente"
}), async (req, res): Promise<void> => {
  const p = GetClienteParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const id = Number(p.data.id);
  const row = await db.cliente.findUnique({ where: { id } });
  if (!row) { res.status(404).json({ error: "Cliente nÃ£o encontrado" }); return; }

  res.json({ ...row, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt });
});

router.patch("/clientes/:id", requireAuth, requireRoles(ADMIN_ROLES), auditLog({
  action: "update",
  module: "clientes",
  table: "Cliente"
}), async (req, res): Promise<void> => {
  const p = UpdateClienteParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const parsed = UpdateClienteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  try {
    const id = Number(p.data.id);
    const row = await db.cliente.update({
      where: { id },
      data: parsed.data,
    });
    res.json({ ...row, createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt });
  } catch {
    res.status(404).json({ error: "Cliente nÃ£o encontrado" });
  }
});

router.delete("/clientes/:id", requireAuth, requireRoles(ADMIN_ROLES), auditLog({
  action: "delete",
  module: "clientes",
  table: "Cliente"
}), async (req, res): Promise<void> => {
  const p = DeleteClienteParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  try {
    const id = Number(p.data.id);
    await db.cliente.delete({ where: { id } });
    res.sendStatus(204);
  } catch {
    res.status(404).json({ error: "Cliente nÃ£o encontrado" });
  }
});

export default router;


