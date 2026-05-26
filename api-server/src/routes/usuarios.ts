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
import { validate } from "../middleware/validate";
import { validateBody, validateParams } from "../middleware/validateZod";
import { response } from "../utils/response";

const router: IRouter = Router();

function serializeUser(r: any) {
  return {
    id: r.id,
    nome: r.nome,
    email: r.email,
    tipo: typeof r.tipo === "string" ? r.tipo : String(r.tipo ?? ""),
    status: r.status,
    telefoneWhatsapp: r.telefoneWhatsapp ?? null,
    createdAt:
      r.createdAt instanceof Date
        ? r.createdAt.toISOString()
        : (r.createdAt ?? null),
  };
}

// GET /usuarios
// Usa $queryRawUnsafe para evitar falha de deserialização do enum TipoUsuario
// quando existem valores no banco que não constam na definição Prisma (ex: 'montagem')
router.get(
  "/usuarios",
  requireAuth,
  requireRoles(["master"]),
  async (_req, res): Promise<void> => {
    const rows = (await (db as any).$queryRawUnsafe(
      `SELECT id, nome, email, tipo::text AS tipo, status, "telefoneWhatsapp", "createdAt" FROM "Usuario" ORDER BY nome ASC`,
    )) as any[];
    res.json(response.success(rows.map(serializeUser)));
  },
);

// POST /usuarios
router.post(
  "/usuarios",
  requireAuth,
  requireRoles(["master"]),
  validateBody(CreateUsuarioBody),
  async (req, res): Promise<void> => {
    const hashedSenha = await bcrypt.hash(req.body.senha, 10);
    const row = await db.usuario.create({
      data: {
        nome: req.body.nome,
        email: req.body.email,
        senha: hashedSenha,
        tipo: req.body.tipo as any,
        status: req.body.status ?? "ativo",
        telefoneWhatsapp: req.body.telefoneWhatsapp ?? null,
      },
    });
    res.status(201).json(response.success(serializeUser(row)));
  },
);

// PATCH /usuarios/:id
router.patch(
  "/usuarios/:id",
  requireAuth,
  requireRoles(["master"]),
  validateParams(UpdateUsuarioParams),
  validateBody(UpdateUsuarioBody),
  async (req, res): Promise<void> => {
    const p = UpdateUsuarioParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    const data: any = { ...req.body };
    if (data.senha) {
      data.senha = await bcrypt.hash(data.senha, 10);
    }

    try {
      const row = await db.usuario.update({
        where: { id: Number(p.data.id) },
        data,
      });
      res.json(response.success(serializeUser(row)));
    } catch {
      res
        .status(404)
        .json(response.error("Usuário não encontrado", "NOT_FOUND"));
    }
  },
);

// DELETE /usuarios/:id
router.delete(
  "/usuarios/:id",
  requireAuth,
  requireRoles(["master"]),
  async (req, res): Promise<void> => {
    const p = DeleteUsuarioParams.safeParse(req.params);
    if (!p.success) {
      res.status(400).json(response.error(p.error.message, "VALIDATION_ERROR"));
      return;
    }

    try {
      await db.usuario.delete({ where: { id: Number(p.data.id) } });
      res.sendStatus(204);
    } catch {
      res
        .status(404)
        .json(response.error("Usuário não encontrado", "NOT_FOUND"));
    }
  },
);

export default router;
