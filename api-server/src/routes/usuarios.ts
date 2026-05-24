import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db } from "../lib/prisma";
import {
  CreateUsuarioBody,
  UpdateUsuarioBody,
  UpdateUsuarioParams,
  DeleteUsuarioParams,
} from "../schemas";
import { requireAuth, requireRoles } from "../middleware/auth";

const router: IRouter = Router();

function serializeUser(r: any) {
  return {
    id: r.id,
    nome: r.nome,
    email: r.email,
    tipo: r.tipo,
    status: r.status,
    telefoneWhatsapp: r.telefoneWhatsapp,
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
  };
}

router.get("/usuarios", requireAuth, requireRoles(["master"]), async (_req, res): Promise<void> => {
  const rows = await db.usuario.findMany({ orderBy: { nome: "asc" } });
  res.json(rows.map(serializeUser));
});

router.post("/usuarios", requireAuth, requireRoles(["master"]), async (req, res): Promise<void> => {
  const parsed = CreateUsuarioBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const hashedSenha = await bcrypt.hash(parsed.data.senha, 10);
  const row = await db.usuario.create({
    data: {
      ...parsed.data,
      senha: hashedSenha,
    },
  });

  res.status(201).json(serializeUser(row));
});

router.patch("/usuarios/:id", requireAuth, requireRoles(["master"]), async (req, res): Promise<void> => {
  const p = UpdateUsuarioParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  const parsed = UpdateUsuarioBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const data: any = { ...parsed.data };
  if (data.senha) {
    data.senha = await bcrypt.hash(data.senha, 10);
  }

  try {
    const row = await db.usuario.update({
      where: { id: p.data.id },
      data,
    });
    res.json(serializeUser(row));
  } catch {
    res.status(404).json({ error: "UsuÃ¡rio nÃ£o encontrado" });
  }
});

router.delete("/usuarios/:id", requireAuth, requireRoles(["master"]), async (req, res): Promise<void> => {
  const p = DeleteUsuarioParams.safeParse(req.params);
  if (!p.success) { res.status(400).json({ error: p.error.message }); return; }

  try {
    await db.usuario.delete({ where: { id: p.data.id } });
    res.sendStatus(204);
  } catch {
    res.status(404).json({ error: "UsuÃ¡rio nÃ£o encontrado" });
  }
});

export default router;


